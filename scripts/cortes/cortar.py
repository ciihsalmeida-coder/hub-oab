"""Robô de cortes: transforma os trechos escolhidos pela IA em vídeos verticais com legenda.

Roda no GitHub Actions (ver .github/workflows/cortes.yml), um painel por vez:
1. baixa o vídeo do painel do Google Drive;
2. acha o atraso entre o áudio da mesa de som (base dos tempos da transcrição) e o vídeo;
3. corta cada trecho em 9:16 com legenda na tela;
4. sobe o arquivo no Supabase e preenche o corte (continua como rascunho);
5. faz uma versão leve (720p) e uma capa de todo corte com vídeo (inclusive os enviados pelo Drive),
   para o site tocar sem travar no celular. A original fica para download.
"""

import base64
import json
import os
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request

import numpy as np
from google.auth.transport.requests import Request
from google.oauth2 import service_account

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SECRET_KEY"]
SITE_URL = os.environ.get("SITE_URL", "https://hub-oab.vercel.app")
PAINEL = sys.argv[1]
TAXA = 100  # quadros de energia por segundo para o alinhamento
MAX_TENTATIVAS = 3
# Toca em qualquer celular (o Safari do iPhone recusa áudio de 4 canais e alguns vídeos 60p da câmera).
COMPATIVEL = ["-pix_fmt", "yuv420p", "-profile:v", "high", "-level:v", "4.1", "-fpsmax", "30", "-ac", "2", "-ar", "48000"]
CONFIANCA_MINIMA = 8  # abaixo disso o áudio e o vídeo provavelmente não são da mesma gravação


def supabase(metodo, caminho, corpo=None, cabecalhos=None, bruto=False):
    dados = corpo if bruto else (json.dumps(corpo).encode() if corpo is not None else None)
    req = urllib.request.Request(f"{SUPABASE_URL}{caminho}", data=dados, method=metodo)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Content-Type", "application/json")
    for k, v in (cabecalhos or {}).items():
        req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=600) as r:
        texto = r.read()
        return json.loads(texto) if texto else None


def consulta(tabela, filtros):
    return supabase("GET", f"/rest/v1/{tabela}?{urllib.parse.urlencode(filtros)}")


def atualizar(tabela, filtros, campos):
    supabase("PATCH", f"/rest/v1/{tabela}?{urllib.parse.urlencode(filtros)}", campos)


def token_drive():
    cred = service_account.Credentials.from_service_account_info(
        json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"]),
        scopes=["https://www.googleapis.com/auth/drive.readonly"],
    )
    cred.refresh(Request())
    return cred.token


def baixar_drive(file_id, destino):
    req = urllib.request.Request(f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media&supportsAllDrives=true")
    req.add_header("Authorization", f"Bearer {token_drive()}")
    with urllib.request.urlopen(req, timeout=3600) as r, open(destino, "wb") as f:
        while bloco := r.read(8 * 1024 * 1024):
            f.write(bloco)


def energia(caminho, segundos):
    """Envelope de volume (100 por segundo) dos primeiros `segundos` do arquivo."""
    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-t", str(segundos), "-i", caminho, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    amostras = np.frombuffer(pcm, dtype=np.int16).astype(np.float32)
    por_quadro = 8000 // TAXA
    n = len(amostras) // por_quadro
    env = np.sqrt((amostras[: n * por_quadro].reshape(n, por_quadro) ** 2).mean(axis=1) + 1e-6)
    env = np.log(env)
    return (env - env.mean()) / (env.std() + 1e-6)


def atraso_video(audio, video, perto=None, janela=120):
    """Segundos a somar aos tempos do áudio da mesa para achar o mesmo instante no vídeo.

    Procura em qualquer posição: o vídeo pode ser um trecho curto (a câmera grava em vários arquivos)
    dentro de uma parte longa do áudio, ou começar antes dele. Só vale se pelo menos metade do mais
    curto dos dois (e no mínimo 20 segundos) se sobrepõe.
    """
    a = energia(audio, 70 * 60)
    v = energia(video, 4 * 60 * 60)  # vídeo do painel inteiro: até 4 h
    tamanho = 1 << int(np.ceil(np.log2(len(a) + len(v))))
    corr = np.fft.irfft(np.fft.rfft(v, tamanho) * np.conj(np.fft.rfft(a, tamanho)), tamanho)
    deslocamentos = np.arange(-(len(a) - 1), len(v))
    valores = corr[deslocamentos % tamanho]
    sobreposicao = np.minimum(len(a), len(v) - deslocamentos) - np.maximum(0, -deslocamentos)
    minimo = max(20 * TAXA, min(len(a), len(v)) // 2)
    validos = sobreposicao >= minimo
    if perto is not None:  # só perto do que o relógio da câmera indica
        validos &= np.abs(deslocamentos / TAXA - perto) <= janela
    if not validos.any():
        return 0.0, 0.0
    normalizados = np.where(validos, valores / np.maximum(sobreposicao, 1), -np.inf)
    melhor = int(np.argmax(normalizados))
    # Confiança: quanto o pico se destaca do resto (em desvios-padrão). Gravações diferentes ficam perto de 5;
    # a mesma gravação passa de 10 com folga.
    resto = normalizados[validos]
    confianca = float((normalizados[melhor] - np.median(resto)) / (resto.std() + 1e-6))
    return deslocamentos[melhor] / TAXA, confianca


def duracao(caminho):
    saida = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", caminho],
        capture_output=True, check=True, text=True,
    ).stdout
    return float(saida.strip())


def falhar_todos(cortes, motivo):
    print(motivo)
    for corte in cortes:
        atualizar("cortes", {"id": f"eq.{corte['id']}"}, {"tentativas": corte["tentativas"] + 1, "erro": motivo})


def ass_tempo(s):
    s = max(0.0, s)
    return f"{int(s // 3600)}:{int(s % 3600 // 60):02d}:{s % 60:05.2f}"


def legenda_ass(frases, inicio, fim, destino):
    """Legenda em blocos curtos (até 6 palavras), no terço inferior do vídeo vertical."""
    linhas = [
        "[Script Info]",
        "ScriptType: v4.00+",
        "PlayResX: 1080",
        "PlayResY: 1920",
        "WrapStyle: 0",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV",
        "Style: Padrao,DejaVu Sans,64,&H00FFFFFF,&H00000000,&H64000000,1,1,5,0,2,80,80,420",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Text",
    ]
    for f in frases:
        a, b = f["inicio"] / 1000, f["fim"] / 1000
        if b <= inicio or a >= fim:
            continue
        palavras = f["texto"].split()
        blocos = [palavras[i : i + 6] for i in range(0, len(palavras), 6)] or [[]]
        passo = (b - a) / len(blocos)
        for i, bloco in enumerate(blocos):
            ini, fi = a + i * passo, a + (i + 1) * passo
            if fi <= inicio or ini >= fim:
                continue
            texto = " ".join(bloco).replace("{", "(").replace("}", ")")
            linhas.append(f"Dialogue: 0,{ass_tempo(ini - inicio)},{ass_tempo(min(fi, fim) - inicio)},Padrao,{texto}")
    with open(destino, "w", encoding="utf-8") as arq:
        arq.write("\n".join(linhas) + "\n")


def otimizar():
    """Versão leve + capa para cortes que ainda não têm (automáticos e manuais)."""
    cortes = consulta(
        "cortes",
        {
            "painel_slug": f"eq.{PAINEL}",
            "video_url": "not.is.null",
            "video_web_url": "is.null",
            "select": "id,video_url,capa_url",
        },
    )
    with tempfile.TemporaryDirectory() as pasta:
        for corte in cortes:
            original = os.path.join(pasta, "original")
            leve = os.path.join(pasta, "leve.mp4")
            capa = os.path.join(pasta, "capa.jpg")
            try:
                with urllib.request.urlopen(corte["video_url"], timeout=600) as r, open(original, "wb") as f:
                    while bloco := r.read(8 * 1024 * 1024):
                        f.write(bloco)
                # Cabe em 720x1280 sem cortar nada (serve para vídeo vertical ou horizontal).
                escala = "scale=720:1280:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2"
                subprocess.run(
                    [
                        "ffmpeg", "-v", "error", "-y", "-i", original, "-vf", escala,
                        "-c:v", "libx264", "-preset", "medium", "-crf", "27", "-maxrate", "1500k", "-bufsize", "3000k",
                        "-g", "48", *COMPATIVEL, "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", leve,
                    ],
                    check=True,
                )
                subprocess.run(
                    ["ffmpeg", "-v", "error", "-y", "-ss", "1", "-i", original, "-frames:v", "1", "-vf", escala, "-q:v", "4", capa],
                    check=True,
                )
                base = f"{PAINEL}/{corte['id']}"
                for arquivo, destino, tipo in ((leve, f"{base}-web.mp4", "video/mp4"), (capa, f"{base}-capa.jpg", "image/jpeg")):
                    with open(arquivo, "rb") as arq:
                        supabase(
                            "POST",
                            f"/storage/v1/object/cortes/{destino}",
                            arq.read(),
                            {"Content-Type": tipo, "x-upsert": "true", "cache-control": "31536000"},
                            bruto=True,
                        )
                publico = f"{SUPABASE_URL}/storage/v1/object/public/cortes/{base}"
                # O "?v=" muda a cada versão para o navegador não mostrar a capa/vídeo antigos.
                versao = os.path.getmtime(leve)
                campos = {"video_web_url": f"{publico}-web.mp4?v={versao:.0f}"}
                if not corte["capa_url"]:
                    campos["capa_url"] = f"{publico}-capa.jpg?v={versao:.0f}"
                atualizar("cortes", {"id": f"eq.{corte['id']}"}, campos)
                print(f"Versão leve pronta: {base}-web.mp4 ({os.path.getsize(leve) / 1024 / 1024:.1f} MB)")
            except Exception as erro:  # noqa: BLE001 - sem versão leve, o site usa a original
                print(f"Falha na versão leve do corte {corte['id']}: {erro}")
                atualizar("cortes", {"id": f"eq.{corte['id']}"}, {"video_web_url": corte["video_url"]})


def reduzir_grandes():
    """Vídeos grandes da pasta "Cortes de vídeo" (ex.: 4K direto da câmera): baixa do Drive, reduz para
    1080p e publica como o vídeo original do corte. Depois o otimizar() faz a versão leve e a capa."""
    cortes = consulta(
        "cortes",
        {
            "painel_slug": f"eq.{PAINEL}",
            "origem": "eq.manual",
            "video_url": "is.null",
            "origem_drive_id": "not.is.null",
            "tentativas": f"lt.{MAX_TENTATIVAS}",
            "select": "id,origem_drive_id,tentativas,titulo",
        },
    )
    for corte in cortes:
        with tempfile.TemporaryDirectory() as pasta:
            try:
                original = os.path.join(pasta, "original")
                saida = os.path.join(pasta, "1080.mp4")
                print(f"Baixando vídeo grande do Drive: {corte['titulo']}…")
                baixar_drive(corte["origem_drive_id"], original)
                # Lado maior em até 1920 (serve para vertical e horizontal), sem aumentar vídeo pequeno.
                escala = (
                    "scale='if(gte(iw,ih),min(1920,iw),-2)':'if(gte(iw,ih),-2,min(1920,ih))',"
                    "scale=trunc(iw/2)*2:trunc(ih/2)*2"
                )
                subprocess.run(
                    [
                        "ffmpeg", "-v", "error", "-y", "-i", original, "-vf", escala,
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-maxrate", "8M", "-bufsize", "16M",
                        *COMPATIVEL, "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", saida,
                    ],
                    check=True,
                )
                destino = f"{PAINEL}/drive-{corte['origem_drive_id']}.mp4"
                with open(saida, "rb") as arq:
                    supabase(
                        "POST",
                        f"/storage/v1/object/cortes/{destino}",
                        arq.read(),
                        {"Content-Type": "video/mp4", "x-upsert": "true", "cache-control": "31536000"},
                        bruto=True,
                    )
                url = f"{SUPABASE_URL}/storage/v1/object/public/cortes/{destino}"
                atualizar("cortes", {"id": f"eq.{corte['id']}"}, {"video_url": url, "video_web_url": None, "erro": None})
                print(f"Vídeo reduzido: {destino} ({os.path.getsize(saida) / 1024 / 1024:.0f} MB)")
            except Exception as erro:  # noqa: BLE001 - registra e segue para o próximo
                print(f"Falha ao reduzir {corte['titulo']}: {erro}")
                atualizar(
                    "cortes",
                    {"id": f"eq.{corte['id']}"},
                    {"tentativas": corte["tentativas"] + 1, "erro": str(erro)[:500]},
                )


def main():
    reduzir_grandes()
    cortar()
    otimizar()


def escolher_fontes(cortes, envios):
    """Agrupa os cortes pela gravação de onde vieram e acha, para cada grupo, a transcrição e o vídeo.

    Cada palestrante pode ter a própria gravação (envio com palestrante_id): o vídeo usado é o
    dessa mesma pessoa. Cortes antigos, sem envio_id, usam a gravação geral do painel.
    """
    por_id = {e["id"]: e for e in envios}
    grupos = {}
    for corte in cortes:
        grupos.setdefault(corte.get("envio_id"), []).append(corte)
    for envio_id, lista in grupos.items():
        base = por_id.get(envio_id) if envio_id else None
        if not base:
            base = next((e for e in envios if e["etapa"] == "pronto" and e.get("transcricao") and not e.get("palestrante_id")), None)
        if not base or not base.get("transcricao"):
            yield lista, None, None
            continue
        if base["tipo"] == "video":
            yield lista, base, [base]  # transcrito do próprio vídeo: não precisa sincronizar
            continue
        videos = [e for e in envios if e["tipo"] == "video" and e.get("palestrante_id") == base.get("palestrante_id")]
        # A câmera costuma gravar em vários arquivos: todos entram, o de mesmo nome do áudio primeiro
        # (ex.: painel.mp3 e painel.mp4); depois na ordem do nome. Cada corte usa o vídeo onde o trecho está.
        radical = os.path.splitext(base["nome"] or "")[0]
        videos.sort(key=lambda v: (os.path.splitext(v["nome"] or "")[0] != radical, v["nome"] or ""))
        yield lista, base, videos


def cortar():
    cortes = consulta(
        "cortes",
        {
            "painel_slug": f"eq.{PAINEL}",
            "origem": "eq.auto",
            "video_url": "is.null",
            "tentativas": f"lt.{MAX_TENTATIVAS}",
            "select": "id,inicio_ms,fim_ms,tentativas,envio_id,foco_x,foco_y,foco_zoom,palestrante_id",
            "order": "ordem",
        },
    )
    if not cortes:
        print("Nenhum corte pendente.")
        return

    envios = consulta(
        "envios",
        {
            "painel_slug": f"eq.{PAINEL}",
            "etapa": "neq.erro",
            "select": "id,tipo,nome,origem_drive_id,etapa,transcricao,palestrante_id",
            "order": "criado_em.desc",
        },
    )
    nomes = {p["id"]: p["nome"] for p in consulta("palestrantes", {"painel_slug": f"eq.{PAINEL}", "select": "id,nome"})}
    for corte in cortes:
        corte["nome"] = nomes.get(corte.get("palestrante_id"))
    for lista, base, videos in escolher_fontes(cortes, envios):
        if not base or not videos:
            print(f"Falta o vídeo ou a transcrição de {len(lista)} corte(s); ficam esperando.")
            continue
        cortar_grupo(lista, base, videos, envios)


CONFIANCA_RELOGIO = 4  # com a pista do relógio a busca é estreita, então o pico pode ser mais baixo


def pista_do_relogio(base, video, caminho_video):
    """Atraso aproximado pelo relógio: o nome do áudio é a hora de início (ex.: 16-39-46.wav) e o Drive guarda
    a hora em que a câmera fechou o arquivo; menos a duração do vídeo dá a hora de início do vídeo."""
    import datetime as dt
    import re
    m = re.match(r"(\d{2})-(\d{2})-(\d{2})", base.get("nome") or "")
    if not m:
        return None
    try:
        req = urllib.request.Request(
            f"https://www.googleapis.com/drive/v3/files/{video['origem_drive_id']}?fields=modifiedTime&supportsAllDrives=true")
        req.add_header("Authorization", f"Bearer {token_drive()}")
        with urllib.request.urlopen(req, timeout=60) as r:
            fim = dt.datetime.fromisoformat(json.loads(r.read())["modifiedTime"].replace("Z", "+00:00"))
    except Exception as erro:
        print(f"Sem a hora do vídeo no Drive: {erro}")
        return None
    fim_local = fim.astimezone(dt.timezone(dt.timedelta(hours=-3)))  # Brasília
    fim_s = fim_local.hour * 3600 + fim_local.minute * 60 + fim_local.second
    inicio_audio = int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3])
    return inicio_audio - (fim_s - duracao(caminho_video))


def atraso_de_parte(parte, caminho, caminho_video, video):
    """Atraso de uma parte do áudio no vídeo, pelo som ou pelo relógio da câmera; None se não bater."""
    atraso, confianca = atraso_video(caminho, caminho_video)
    if confianca >= CONFIANCA_MINIMA:
        return atraso
    pista = pista_do_relogio(parte, video, caminho_video) if video is not None else None
    if pista is None:
        return None
    atraso, confianca = atraso_video(caminho, caminho_video, perto=pista)
    print(f"Parte {parte['nome']} pelo relógio: {atraso:+.2f}s (confiança {confianca:.2f})")
    return atraso if confianca >= CONFIANCA_RELOGIO else None


def atraso_pela_vizinha(base, caminho_audio, caminho_video, envios, pasta, cache, video=None):
    """Quando esta parte não bate sozinha com o vídeo, usa outra parte da mesma gravação: as partes são
    contínuas, então o atraso desta = atraso da outra ∓ a soma das durações entre as duas. Tenta da mais
    perto para a mais longe. O ajuste fino de cada corte (ajuste_fino) corrige a pequena diferença de
    relógio entre gravador e câmera."""
    irmas = sorted(
        (e for e in envios if e["tipo"] == "audio" and e.get("palestrante_id") == base.get("palestrante_id")
         and e.get("origem_drive_id")),
        key=lambda e: e["nome"] or "",
    )
    i = next((k for k, e in enumerate(irmas) if e["id"] == base["id"]), None)
    if i is None:
        return None
    cache[base["id"]] = caminho_audio

    def baixar(parte):
        caminho = cache.get(parte["id"])
        if not caminho:
            caminho = os.path.join(pasta, f"vizinha-{parte['id']}")
            print(f"Baixando a parte vizinha para sincronizar: {parte['nome']}…")
            baixar_drive(parte["origem_drive_id"], caminho)
            cache[parte["id"]] = caminho
        return caminho

    ordem = sorted((k for k in range(len(irmas)) if k != i), key=lambda k: (abs(k - i), k < i))
    for k in ordem:
        outra = irmas[k]
        atraso = atraso_de_parte(outra, baixar(outra), caminho_video, video)
        if atraso is None:
            continue
        entre = range(i, k) if k > i else range(k, i)
        soma = sum(duracao(baixar(irmas[j])) for j in entre)
        resultado = atraso - soma if k > i else atraso + soma
        print(f"Atraso desta parte pela parte {outra['nome']}: {resultado:+.2f}s")
        return resultado
    return None


def ajuste_fino(caminho_audio, caminho_video, atraso, inicio, fim, pasta):
    """Acerta o atraso só no trecho do corte (o relógio do gravador e o da câmera andam um pouco diferente)."""
    a0 = max(0.0, inicio - 30)
    v0 = max(0.0, inicio + atraso - 45)
    trecho_a = os.path.join(pasta, "fino-a.wav")
    trecho_v = os.path.join(pasta, "fino-v.wav")
    try:
        for origem, comeco, dur, destino in ((caminho_audio, a0, fim - inicio + 60, trecho_a),
                                             (caminho_video, v0, fim - inicio + 90, trecho_v)):
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(comeco), "-t", str(dur), "-i", origem,
                            "-vn", "-ac", "1", "-ar", "8000", destino], check=True)
        desloc, confianca = atraso_video(trecho_a, trecho_v, perto=(inicio + atraso - v0) - (inicio - a0), janela=15)
    except subprocess.CalledProcessError:
        return atraso
    novo = v0 + desloc - a0
    print(f"Ajuste fino no trecho: {atraso:+.2f}s → {novo:+.2f}s (confiança {confianca:.2f})")
    return novo if confianca >= 6 and abs(novo - atraso) <= 15 else atraso


def cortar_grupo(cortes, base, videos, envios=()):
    """Corta os trechos de uma gravação. Com vários vídeos, cada corte sai do vídeo que contém o trecho."""
    cache_vizinhas = {}
    pendentes = list(cortes)
    with tempfile.TemporaryDirectory() as pasta:
        caminho_audio = None
        if base["tipo"] == "audio":
            caminho_audio = os.path.join(pasta, "mesa")
            print(f"Baixando o áudio para sincronizar: {base['nome']}…")
            baixar_drive(base["origem_drive_id"], caminho_audio)
        frases = base["transcricao"].get("falas", [])
        for video in videos:
            if not pendentes:
                break
            caminho_video = os.path.join(pasta, "painel.mp4")
            print(f"Baixando vídeo do Drive: {video['nome']}…")
            baixar_drive(video["origem_drive_id"], caminho_video)
            total = duracao(caminho_video)
            print(f"Vídeo: {video['nome']} ({total / 60:.1f} min)")
            atraso = 0.0
            if caminho_audio:
                atraso, confianca = atraso_video(caminho_audio, caminho_video)
                print(f"Atraso calculado: {atraso:+.2f}s (confiança {confianca:.2f})")
                if confianca < CONFIANCA_MINIMA:
                    atraso = atraso_pela_vizinha(base, caminho_audio, caminho_video, envios, pasta, cache_vizinhas, video)
                if atraso is None:
                    pista = pista_do_relogio(base, video, caminho_video)
                    if pista is not None:
                        atraso, confianca = atraso_video(caminho_audio, caminho_video, perto=pista)
                        print(f"Pelo relógio da câmera: perto de {pista:+.0f}s → {atraso:+.2f}s (confiança {confianca:.2f})")
                        if confianca < CONFIANCA_RELOGIO:
                            atraso = None
                if atraso is None:
                    print(f"“{video['nome']}” não parece ser da mesma gravação de “{base['nome']}”; tentando o próximo.")
                    os.remove(caminho_video)
                    continue
            cabem = [c for c in pendentes if c["inicio_ms"] / 1000 + atraso >= 0 and c["fim_ms"] / 1000 + atraso <= total]
            for corte in cabem:
                pendentes.remove(corte)
                proprio = atraso
                if caminho_audio:
                    proprio = ajuste_fino(caminho_audio, caminho_video, atraso,
                                          corte["inicio_ms"] / 1000, corte["fim_ms"] / 1000, pasta)
                cortar_trecho(corte, frases, caminho_video, proprio, pasta, tamanho_video(caminho_video), caminho_audio)
            os.remove(caminho_video)
        if pendentes:
            nomes = ", ".join(v["nome"] or "?" for v in videos)
            falhar_todos(
                pendentes,
                f"O trecho não está em nenhum vídeo que bate com o áudio “{base['nome']}” (vídeos: {nomes}). "
                "Confira se o vídeo dessa parte foi enviado.",
            )


def tamanho_video(caminho):
    """Largura e altura do vídeo como ele aparece (já contando a rotação do celular)."""
    saida = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation",
         "-of", "json", caminho],
        capture_output=True, check=True, text=True,
    ).stdout
    v = json.loads(saida)["streams"][0]
    w, h = v["width"], v["height"]
    if any(abs(d.get("rotation", 0)) == 90 for d in v.get("side_data_list", [])):
        w, h = h, w
    return w, h


# Quanto da altura do corte a pessoa deve ocupar, e até quanto aproximar (zoom digital: acima disso borra).
ALTURA_ALVO = 0.6
ZOOM_MAXIMO = 2.6
ROSTO_NO_QUADRO = 0.36  # o rosto fica a 36% do topo; a legenda vai embaixo


def janela(tamanho, zoom, fx, fy):
    """Recorte 9:16 no vídeo original: (largura, altura, x, y) em pixels pares."""
    iw, ih = tamanho
    h = ih / zoom
    w = min(iw, h * 9 / 16)
    x = (iw - w) * fx
    y = (ih - h) * fy
    par = lambda v: int(v) // 2 * 2  # noqa: E731
    return par(w), par(h), par(x), par(y)


_token = None


def token_site():
    global _token
    if _token is None:
        linhas = consulta("segredos", {"chave": "eq.sync_token", "select": "valor"})
        _token = linhas[0]["valor"] if linhas else ""
    return _token


def quadro(caminho_video, segundo, destino, largura):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, segundo):.2f}", "-i", caminho_video, "-frames:v", "1",
         "-vf", f"scale={largura}:-2", "-q:v", "4", destino],
        check=True,
    )


def onde_esta_quem_fala(corte, caminho_video, ini, fim, pasta):
    """Pergunta à IA (pelo site) onde está o rosto de quem fala, de 0 a 1. None se não souber."""
    imagens = []
    for i, fracao in enumerate((0.25, 0.5, 0.75)):
        arq = os.path.join(pasta, f"ia-{i}.jpg")
        quadro(caminho_video, ini + (fim - ini) * fracao, arq, 1024)
        with open(arq, "rb") as f:
            imagens.append(base64.b64encode(f.read()).decode())
    req = urllib.request.Request(
        f"{SITE_URL}/api/ia/enquadrar",
        data=json.dumps({"imagens": imagens, "palestrante": corte.get("nome")}).encode(),
        headers={"Content-Type": "application/json", "x-sync-token": token_site()},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=150) as r:
            resposta = json.loads(r.read())
        print(f"IA: quem fala está em x={resposta.get('centro_x')} y={resposta.get('centro_y')}, "
              f"ocupa {resposta.get('altura_pessoa')} da altura (achou: {resposta.get('achou')})")
        return resposta if resposta.get("achou") else None
    except Exception as erro:  # noqa: BLE001 - sem a IA, corta no meio
        print(f"Não consegui perguntar à IA onde está quem fala: {erro}")
        return None


def enquadrar(corte, tamanho, caminho_video, ini, fim, pasta):
    """Zoom e posição do quadro 9:16: guardados no corte (ajuste da equipe) ou perguntados à IA."""
    iw, ih = tamanho
    if corte.get("foco_x") is not None and corte.get("foco_zoom"):
        return corte["foco_zoom"], corte["foco_x"], corte.get("foco_y") or 0.0
    if corte.get("foco_x") is not None:  # ajuste antigo, só horizontal
        return 1.0, corte["foco_x"], 0.0
    if iw / ih <= 9 / 16 + 0.01:  # vídeo já em pé: não há o que escolher
        return 1.0, 0.5, 0.0
    r = onde_esta_quem_fala(corte, caminho_video, ini, fim, pasta)
    if not r:
        return 1.0, 0.5, 0.0
    cx, cy = float(r["centro_x"]), float(r.get("centro_y") or 0.4)
    pessoa = float(r.get("altura_pessoa") or 0)
    zoom = min(ZOOM_MAXIMO, max(1.0, ALTURA_ALVO / pessoa)) if pessoa > 0.02 else 1.0
    h = ih / zoom
    w = min(iw, h * 9 / 16)
    # Do centro do rosto para a posição da janela (0 = encostada à esquerda/topo, 1 = à direita/embaixo).
    fx = min(1.0, max(0.0, (cx * iw - w / 2) / (iw - w))) if iw > w else 0.5
    fy = min(1.0, max(0.0, (cy * ih - h * ROSTO_NO_QUADRO) / (ih - h))) if ih > h else 0.0
    return zoom, fx, fy


# Som do corte: o da mesa de som (limpo, direto dos microfones) quando houver; senão o da câmera, que pega
# o ambiente e chia. Nos dois: corta o grave do ar-condicionado, tira o chiado e iguala o volume.
FILTRO_SOM = "highpass=f=80,afftdn=nr=12:nf=-40:tn=1,loudnorm=I=-16:TP=-1.5:LRA=11"
# Redutor de ruído de voz (RNNoise, modelo "conjoined-burgers" de GregorR/rnnoise-models): tira o chiado forte
# que sobra em alguns painéis. Baixado na hora; se não vier, fica o filtro simples acima.
MODELO_VOZ = "https://raw.githubusercontent.com/GregorR/rnnoise-models/master/conjoined-burgers-2018-08-28/cb.rnnn"
_filtro_som = None


def filtro_som():
    global _filtro_som
    if _filtro_som is None:
        destino = os.path.join(tempfile.gettempdir(), "voz.rnnn")
        try:
            if not os.path.exists(destino):
                urllib.request.urlretrieve(MODELO_VOZ, destino)
            # Duas passadas do redutor, chiado restante e corte acima de 8 kHz (voz não precisa); por fim, volume
            # igual em todos os cortes. Sem portão de ruído: ele cortava palavras ditas mais baixo.
            # O volume é acertado antes: gravação baixa da mesa não pode ser confundida com fundo pelo portão.
            _filtro_som = (f"highpass=f=100,loudnorm=I=-20:TP=-3:LRA=11,arnndn=m={destino}:mix=1,arnndn=m={destino}:mix=0.8,"
                           "afftdn=nr=20:nf=-35:tn=1,lowpass=f=8000,"
                           "loudnorm=I=-16:TP=-1.5:LRA=11")
        except Exception as erro:  # noqa: BLE001
            print(f"Sem o redutor de ruído de voz ({erro}); usando o filtro simples.")
            _filtro_som = FILTRO_SOM
    return _filtro_som


def voz_limpa(caminho_audio, inicio, duracao_s, pasta, nome):
    """Trecho do áudio da mesa limpo pelo DeepFilterNet (IA que separa a voz do ruído). None se não der."""
    import shutil
    if not shutil.which("deepFilter"):
        return None
    bruto = os.path.join(pasta, f"{nome}-bruto.wav")
    saida = os.path.join(pasta, f"{nome}-df")
    try:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{inicio:.2f}", "-t", f"{duracao_s:.2f}", "-i", caminho_audio,
                        "-vn", "-ac", "1", "-ar", "48000", bruto], check=True)
        subprocess.run(["deepFilter", bruto, "-o", saida], check=True, capture_output=True, timeout=900)
        pronto = [os.path.join(saida, f) for f in os.listdir(saida) if f.endswith(".wav")]
        return pronto[0] if pronto else None
    except Exception as erro:  # noqa: BLE001
        print(f"DeepFilterNet não funcionou ({erro}); usando o filtro de voz simples.")
        return None


def cortar_trecho(corte, frases, caminho_video, atraso, pasta, tamanho, caminho_audio=None):
    try:
        inicio = corte["inicio_ms"] / 1000
        fim = corte["fim_ms"] / 1000
        # Imagem do plano aberto (para o ajuste manual no /admin) e posição do quadro vertical.
        imagem = os.path.join(pasta, f"{corte['id']}-quadro.jpg")
        quadro(caminho_video, inicio + atraso + (fim - inicio) / 2, imagem, 960)
        zoom, foco, foco_y = enquadrar(corte, tamanho, caminho_video, inicio + atraso, fim + atraso, pasta)
        w, h, x, y = janela(tamanho, zoom, foco, foco_y)
        ass = os.path.join(pasta, f"{corte['id']}.ass")
        saida = os.path.join(pasta, f"{corte['id']}.mp4")
        legenda_ass(frases, inicio, fim, ass)
        limpo = voz_limpa(caminho_audio, inicio, fim - inicio, pasta, corte["id"]) if caminho_audio else None
        if limpo:
            print("Som limpo pelo DeepFilterNet.")
        subprocess.run(
            [
                "ffmpeg", "-v", "error", "-y",
                "-ss", f"{max(0, inicio + atraso):.2f}", "-i", caminho_video,
                *(["-i", limpo] if limpo else ["-ss", f"{inicio:.2f}", "-i", caminho_audio] if caminho_audio else []),
                "-t", f"{fim - inicio:.2f}",
                "-map", "0:v:0", "-map", "1:a:0" if caminho_audio else "0:a:0?",
                "-vf", f"crop={w}:{h}:{x}:{y},scale=1080:1920:flags=lanczos,setsar=1,subtitles={ass}",
                "-af", "highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11" if limpo else filtro_som(),
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-maxrate", "5M", "-bufsize", "10M",
                *COMPATIVEL, "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", saida,
            ],
            check=True,
        )
        if os.path.getsize(saida) < 200_000:
            raise ValueError("O corte saiu vazio.")
        destino = f"{PAINEL}/auto-{corte['id']}.mp4"
        with open(saida, "rb") as arq:
            supabase(
                "POST",
                f"/storage/v1/object/cortes/{destino}",
                arq.read(),
                {"Content-Type": "video/mp4", "x-upsert": "true", "cache-control": "31536000"},
                bruto=True,
            )
        url = f"{SUPABASE_URL}/storage/v1/object/public/cortes/{destino}"
        destino_quadro = f"{PAINEL}/{corte['id']}-quadro.jpg"
        with open(imagem, "rb") as arq:
            supabase(
                "POST",
                f"/storage/v1/object/cortes/{destino_quadro}",
                arq.read(),
                {"Content-Type": "image/jpeg", "x-upsert": "true", "cache-control": "60"},
                bruto=True,
            )
        atualizar(
            "cortes",
            {"id": f"eq.{corte['id']}"},
            {
                "video_url": url, "video_web_url": None, "capa_url": None, "erro": None, "status": "rascunho",
                "foco_x": foco, "foco_y": foco_y, "foco_zoom": zoom, "quadro_url": f"{SUPABASE_URL}/storage/v1/object/public/cortes/{destino_quadro}?v={int(os.path.getmtime(imagem))}",
            },
        )
        print(f"Corte pronto: {destino} (zoom {zoom:.2f}, quadro em x={foco:.2f} y={foco_y:.2f})")
    except Exception as erro:  # noqa: BLE001 - registra e segue para o próximo corte
        print(f"Falha no corte {corte['id']}: {erro}")
        atualizar(
            "cortes",
            {"id": f"eq.{corte['id']}"},
            {"tentativas": corte["tentativas"] + 1, "erro": str(erro)[:500]},
        )


if __name__ == "__main__":
    main()
