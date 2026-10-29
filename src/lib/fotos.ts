import "server-only";
import sharp from "sharp";

// "Modo automático" das fotos: relight + enhance + colorgrade, iguais em todas as fotos.
// Os valores são suaves de propósito: as fotos já chegam tratadas pela Central de Mídia.
export async function tratarFoto(original: Buffer, auto: boolean) {
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
  const grande = await base.jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  const mini = await sharp(grande).resize(640, 640, { fit: "inside" }).jpeg({ quality: 76, mozjpeg: true }).toBuffer();
  return { grande, mini };
}
