import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { paineis } from "@/data/programacao";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hub-oab.vercel.app";

// QR code do hub ou de um painel. ?simples=1 devolve só o código (PNG) para a designer usar.
export async function GET(request: Request, { params }: { params: Promise<{ alvo: string }> }) {
  const { alvo } = await params;
  const painel = paineis.find((p) => p.slug === alvo);
  if (alvo !== "hub" && !painel) return new NextResponse("Não encontrado", { status: 404 });
  const url = painel ? `${SITE}/paineis/${painel.slug}` : SITE;

  if (new URL(request.url).searchParams.get("simples")) {
    const png = await QRCode.toBuffer(url, { width: 1200, margin: 2, color: { dark: "#0f2a44", light: "#ffffff" } });
    return new NextResponse(new Uint8Array(png), {
      headers: { "content-type": "image/png", "content-disposition": `attachment; filename="qr-${alvo}.png"` },
    });
  }

  const qr = await QRCode.toDataURL(url, { width: 760, margin: 1, color: { dark: "#0f2a44", light: "#ffffff" } });
  const titulo = painel ? `${painel.numero ? `Painel ${painel.numero}` : "Abertura"} · ${painel.titulo}` : "Resumos, vídeos e suas fotos";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "linear-gradient(180deg, #f4f6f8 0%, #dfe6ec 25%, #9fb3c4 45%, #3d6585 70%, #17344f 100%)",
          color: "#0f2a44",
          padding: "70px 80px 0",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 2, textAlign: "center" }}>
          XIV CONGRESSO NACIONAL DE DIREITO MARÍTIMO, PORTUÁRIO E ADUANEIRO
        </div>
        <div style={{ display: "flex", fontSize: 54, fontWeight: 700, marginTop: 36, textAlign: "center", lineHeight: 1.15 }}>
          {titulo}
        </div>
        <div style={{ display: "flex", marginTop: 50, background: "white", borderRadius: 40, padding: 30 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} width={640} height={640} alt="" />
        </div>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "white", marginTop: 44 }}>Aponte a câmera do celular</div>
        <div style={{ display: "flex", fontSize: 28, color: "#cfe6f5", marginTop: 8 }}>{url.replace("https://", "")}</div>
      </div>
    ),
    { width: 1080, height: 1350 },
  );
}
