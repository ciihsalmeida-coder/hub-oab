import "server-only";
import heicConvert from "heic-convert";
import sharp from "sharp";

// Foto do iPhone (HEIC): o sharp do servidor não abre esse formato, então vira JPEG antes.
function eHeic(arquivo: Buffer) {
  const marca = arquivo.subarray(8, 12).toString("ascii");
  return arquivo.subarray(4, 8).toString("ascii") === "ftyp" && ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(marca);
}

async function paraJpegSeHeic(arquivo: Buffer) {
  if (!eHeic(arquivo)) return arquivo;
  const bytes = arquivo.buffer.slice(arquivo.byteOffset, arquivo.byteOffset + arquivo.byteLength);
  return Buffer.from(await heicConvert({ buffer: bytes, format: "JPEG", quality: 0.95 }));
}

// "Modo automático" das fotos: relight + enhance + colorgrade, iguais em todas as fotos.
// Os valores são suaves de propósito: as fotos já chegam tratadas pela Central de Mídia.
export async function tratarFoto(arquivo: Buffer, auto: boolean) {
  const original = await paraJpegSeHeic(arquivo);
  let base = sharp(original, { failOn: "none" }).rotate().resize(2400, 2400, { fit: "inside", withoutEnlargement: true });
  if (auto) {
    base = base
      // relight: contraste local, clareia sombras e rostos sem estourar as altas luzes
      .clahe({ width: 96, height: 96, maxSlope: 2 })
      // enhance: brilho e saturação levemente acima, nitidez fina
      .modulate({ brightness: 1.03, saturation: 1.08 })
      .sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 })
      // colorgrade: leve tom frio nas sombras, na linha do mar do cartaz do congresso
      .linear([0.99, 1.0, 1.03], [-1, 0, 3])
      .gamma(1.05);
  }
  // Qualidade de entrega: cor em sRGB, sem perder detalhe de cor (4:4:4).
  const grande = await base.toColorspace("srgb").jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
  const mini = await sharp(grande).resize(640, 640, { fit: "inside" }).jpeg({ quality: 76, mozjpeg: true }).toBuffer();
  return { grande, mini };
}
