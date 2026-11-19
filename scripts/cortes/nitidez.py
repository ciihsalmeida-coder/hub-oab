"""Melhora a nitidez de um corte já publicado (sem cortar de novo): tira granulado, realça contornos e contraste.

Uso: python scripts/cortes/nitidez.py <id do corte>
Sobe o vídeo melhorado como nova original (<painel>/<id>-nitido.mp4) e refaz a versão leve.
O corte continua publicado.
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SECRET_KEY"]
COMPATIVEL = ["-pix_fmt", "yuv420p", "-profile:v", "high", "-level:v", "4.1", "-fpsmax", "30", "-ac", "2", "-ar", "48000"]
FILTRO = "nlmeans=s=2.5:p=7:r=15,unsharp=7:7:1.1:5:5:0,cas=strength=0.5,eq=contrast=1.06:saturation=1.08:gamma=0.98"


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


def subir(arquivo, destino):
    with open(arquivo, "rb") as arq:
        supabase(
            "POST",
            f"/storage/v1/object/cortes/{destino}",
            arq.read(),
            {"Content-Type": "video/mp4", "x-upsert": "true", "cache-control": "31536000"},
            bruto=True,
        )
    return f"{SUPABASE_URL}/storage/v1/object/public/cortes/{destino}?v={int(time.time())}"


def main(corte_id):
    corte = supabase("GET", f"/rest/v1/cortes?{urllib.parse.urlencode({'id': f'eq.{corte_id}', 'select': 'id,painel_slug,video_url'})}")[0]
    with tempfile.TemporaryDirectory() as pasta:
        entrada, saida, leve = (os.path.join(pasta, n) for n in ("entrada.mp4", "nitido.mp4", "leve.mp4"))
        urllib.request.urlretrieve(corte["video_url"].split("?")[0], entrada)
        subprocess.run(
            [
                "ffmpeg", "-nostdin", "-v", "error", "-y", "-i", entrada, "-vf", FILTRO,
                "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-maxrate", "12M", "-bufsize", "24M",
                *COMPATIVEL, "-c:a", "copy", "-movflags", "+faststart", saida,
            ],
            check=True,
        )
        escala = "scale=720:1280:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2"
        subprocess.run(
            [
                "ffmpeg", "-nostdin", "-v", "error", "-y", "-i", saida, "-vf", escala,
                "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-maxrate", "2500k", "-bufsize", "5000k",
                "-g", "48", *COMPATIVEL, "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", leve,
            ],
            check=True,
        )
        base = f"{corte['painel_slug']}/{corte['id']}"
        campos = {"video_url": subir(saida, f"{base}-nitido.mp4"), "video_web_url": subir(leve, f"{base}-web.mp4")}
        supabase("PATCH", f"/rest/v1/cortes?id=eq.{corte['id']}", campos)
        print(f"Pronto: {campos['video_url']} ({os.path.getsize(saida) / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main(sys.argv[1])
