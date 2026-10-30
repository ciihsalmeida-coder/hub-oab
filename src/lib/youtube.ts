// Aceita os formatos que o YouTube oferece para copiar (watch, youtu.be, live, shorts, embed).
export function idDoYoutube(url: string): string | null {
  const m = url
    .trim()
    .match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
