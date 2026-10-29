"""Robô de cortes: transforma os trechos escolhidos pela IA em vídeos verticais com legenda.

Roda no GitHub Actions (ver .github/workflows/cortes.yml), um painel por vez:
1. baixa o vídeo do painel do Google Drive;
2. acha o atraso entre o áudio da mesa de som (base dos tempos da transcrição) e o vídeo;
3. corta cada trecho em 9:16 com legenda na tela;
4. sobe o arquivo no Supabase e preenche o corte (continua como rascunho).
"""

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
PAINEL = sys.argv[1]
TAXA = 100  # quadros de energia por segundo para o alinhamento
MAX_TENTATIVAS = 3
CONFIANCA_MINIMA = 1.5  # abaixo disso o áudio e o vídeo provavelmente não são da mesma gravação


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
    req = urllib.request.Request(f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media")
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
    """Segundos a somar aos tempos do áudio da mesa para achar o mesmo instante no vídeo."""
    a = energia(audio, 25 * 60)
    v = energia(video, 25 * 60)
    tamanho = 1 << int(np.ceil(np.log2(len(a) + len(v))))
    corr = np.fft.irfft(np.fft.rfft(v, tamanho) * np.conj(np.fft.rfft(a, tamanho)), tamanho)
    # Procura até 20 minutos para cada lado, sem passar da metade do trecho analisado,
    # e divide pela sobreposição para não favorecer deslocamentos com pouca sobreposição.
    limite = min(20 * 60 * TAXA, min(len(a), len(v)) // 2)
    deslocamentos = np.concatenate([np.arange(0, limite + 1), np.arange(-limite, 0)])
    candidatos = np.concatenate([corr[: limite + 1], corr[-limite:]])
    sobreposicao = np.minimum(len(v) - deslocamentos, len(a) + deslocamentos).clip(min=1)
    sobreposicao = np.minimum(sobreposicao, min(len(a), len(v)))
    candidatos = candidatos / sobreposicao
    melhor = int(np.argmax(candidatos))
    confianca = float(candidatos[melhor] / (np.sort(candidatos)[-50:].mean() + 1e-6))
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


def main():
    cortes = consulta(
        "cortes",
        {
            "painel_slug": f"eq.{PAINEL}",
            "origem": "eq.auto",
            "video_url": "is.null",
            "tentativas": f"lt.{MAX_TENTATIVAS}",
            "select": "id,inicio_ms,fim_ms,tentativas",
            "order": "ordem",
        },
    )
    if not cortes:
        print("Nenhum corte pendente.")
        return

    envios = consulta(
        "envios",
        {"painel_slug": f"eq.{PAINEL}", "select": "tipo,nome,origem_drive_id,etapa,transcricao", "order": "criado_em.desc"},
    )
    base = next((e for e in envios if e["etapa"] == "pronto" and e.get("transcricao")), None)
    videos = [e for e in envios if e["tipo"] == "video"]
    # Se houver mais de um vídeo, prefere o de mesmo nome do áudio transcrito (ex.: painel.mp3 e painel.mp4).
    radical = os.path.splitext(base["nome"] or "")[0] if base else ""
    video = next((v for v in videos if os.path.splitext(v["nome"] or "")[0] == radical), videos[0] if videos else None)
    if not video or not base:
        print("Falta o vídeo ou a transcrição do painel.")
        return

    with tempfile.TemporaryDirectory() as pasta:
        caminho_video = os.path.join(pasta, "painel.mp4")
        print("Baixando vídeo do Drive…")
        baixar_drive(video["origem_drive_id"], caminho_video)
        total = duracao(caminho_video)
        print(f"Vídeo: {video['nome']} ({total / 60:.1f} min)")

        atraso = 0.0
        if base["tipo"] == "audio":
            caminho_audio = os.path.join(pasta, "mesa")
            print("Baixando áudio da mesa para sincronizar…")
            baixar_drive(base["origem_drive_id"], caminho_audio)
            atraso, confianca = atraso_video(caminho_audio, caminho_video)
            print(f"Atraso calculado: {atraso:+.2f}s (confiança {confianca:.2f})")
            if confianca < CONFIANCA_MINIMA:
                falhar_todos(
                    cortes,
                    f"Não consegui sincronizar o áudio “{base['nome']}” com o vídeo “{video['nome']}”. "
                    "Confira se são da mesma gravação.",
                )
                return

        frases = base["transcricao"].get("falas", [])
        for corte in cortes:
            try:
                inicio = corte["inicio_ms"] / 1000
                fim = corte["fim_ms"] / 1000
                if inicio + atraso < 0 or fim + atraso > total:
                    raise ValueError(f"O trecho ({inicio + atraso:.0f}s a {fim + atraso:.0f}s) fica fora do vídeo ({total:.0f}s).")
                ass = os.path.join(pasta, f"{corte['id']}.ass")
                saida = os.path.join(pasta, f"{corte['id']}.mp4")
                legenda_ass(frases, inicio, fim, ass)
                subprocess.run(
                    [
                        "ffmpeg", "-v", "error", "-y",
                        "-ss", f"{max(0, inicio + atraso):.2f}", "-i", caminho_video, "-t", f"{fim - inicio:.2f}",
                        "-vf", f"scale=-2:1920,crop=1080:1920,subtitles={ass}",
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-maxrate", "5M", "-bufsize", "10M",
                        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", saida,
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
                atualizar("cortes", {"id": f"eq.{corte['id']}"}, {"video_url": url, "erro": None})
                print(f"Corte pronto: {destino}")
            except Exception as erro:  # noqa: BLE001 - registra e segue para o próximo corte
                print(f"Falha no corte {corte['id']}: {erro}")
                atualizar(
                    "cortes",
                    {"id": f"eq.{corte['id']}"},
                    {"tentativas": corte["tentativas"] + 1, "erro": str(erro)[:500]},
                )


if __name__ == "__main__":
    main()
