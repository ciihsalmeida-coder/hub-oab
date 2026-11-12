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


def atraso_video(audio, video):
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
            "select": "id,inicio_ms,fim_ms,tentativas,envio_id,foco_x,palestrante_id",
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
        cortar_grupo(lista, base, videos)


def cortar_grupo(cortes, base, videos):
    """Corta os trechos de uma gravação. Com vários vídeos, cada corte sai do vídeo que contém o trecho."""
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
                    print(f"“{video['nome']}” não parece ser da mesma gravação de “{base['nome']}”; tentando o próximo.")
                    os.remove(caminho_video)
                    continue
            cabem = [c for c in pendentes if c["inicio_ms"] / 1000 + atraso >= 0 and c["fim_ms"] / 1000 + atraso <= total]
            for corte in cabem:
                pendentes.remove(corte)
                cortar_trecho(corte, frases, caminho_video, atraso, pasta, largura_vertical(caminho_video))
            os.remove(caminho_video)
        if pendentes:
            nomes = ", ".join(v["nome"] or "?" for v in videos)
            falhar_todos(
                pendentes,
                f"O trecho não está em nenhum vídeo que bate com o áudio “{base['nome']}” (vídeos: {nomes}). "
                "Confira se o vídeo dessa parte foi enviado.",
            )


def largura_vertical(caminho):
    """Largura do vídeo depois de escalado para 1920 de altura (o corte 9:16 pega 1080 dela)."""
    saida = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation",
         "-of", "json", caminho],
        capture_output=True, check=True, text=True,
    ).stdout
    v = json.loads(saida)["streams"][0]
    w, h = v["width"], v["height"]
    if any(abs(d.get("rotation", 0)) == 90 for d in v.get("side_data_list", [])):
        w, h = h, w
    return w * 1920 / h


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
        print(f"IA: quem fala está em {resposta.get('centro_x')} (achou: {resposta.get('achou')})")
        return resposta["centro_x"] if resposta.get("achou") else None
    except Exception as erro:  # noqa: BLE001 - sem a IA, corta no meio
        print(f"Não consegui perguntar à IA onde está quem fala: {erro}")
        return None


def cortar_trecho(corte, frases, caminho_video, atraso, pasta, largura):
    try:
        inicio = corte["inicio_ms"] / 1000
        fim = corte["fim_ms"] / 1000
        # Imagem do plano aberto (para o ajuste manual no /admin) e posição do quadro vertical.
        imagem = os.path.join(pasta, f"{corte['id']}-quadro.jpg")
        quadro(caminho_video, inicio + atraso + (fim - inicio) / 2, imagem, 960)
        foco = corte.get("foco_x")
        if foco is None and largura > 1080:
            centro = onde_esta_quem_fala(corte, caminho_video, inicio + atraso, fim + atraso, pasta)
            # De "onde está o rosto" para a posição do quadro (0 = encostado à esquerda, 1 = à direita).
            foco = 0.5 if centro is None else min(1.0, max(0.0, (centro * largura - 540) / (largura - 1080)))
        foco = 0.5 if foco is None else foco
        ass = os.path.join(pasta, f"{corte['id']}.ass")
        saida = os.path.join(pasta, f"{corte['id']}.mp4")
        legenda_ass(frases, inicio, fim, ass)
        subprocess.run(
            [
                "ffmpeg", "-v", "error", "-y",
                "-ss", f"{max(0, inicio + atraso):.2f}", "-i", caminho_video, "-t", f"{fim - inicio:.2f}",
                "-vf", f"scale=-2:1920,crop=1080:1920:(iw-1080)*{foco:.4f}:0,subtitles={ass}",
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
                "foco_x": foco, "quadro_url": f"{SUPABASE_URL}/storage/v1/object/public/cortes/{destino_quadro}?v={int(os.path.getmtime(imagem))}",
            },
        )
        print(f"Corte pronto: {destino} (quadro em {foco:.2f})")
    except Exception as erro:  # noqa: BLE001 - registra e segue para o próximo corte
        print(f"Falha no corte {corte['id']}: {erro}")
        atualizar(
            "cortes",
            {"id": f"eq.{corte['id']}"},
            {"tentativas": corte["tentativas"] + 1, "erro": str(erro)[:500]},
        )


if __name__ == "__main__":
    main()
