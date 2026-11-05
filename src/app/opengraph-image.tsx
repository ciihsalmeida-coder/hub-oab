import { ImageResponse } from "next/og";
import { LOGO_OAB_BRANCO } from "@/lib/logo-oab";

// Imagem da prévia do link (WhatsApp, LinkedIn, iMessage). Vale para todas as páginas, inclusive o kit.
export const alt = "XIV Congresso Nacional de Direito Marítimo, Portuário e Aduaneiro";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Imagem() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(180deg, #4a7699 0%, #1d4566 55%, #0f2a44 100%)",
        color: "white",
        padding: "64px 72px 0",
      }}
    >
      <img src={LOGO_OAB_BRANCO} width={190} height={100} alt="" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.05 }}>XIV Congresso</div>
        <div style={{ display: "flex", fontSize: 38, lineHeight: 1.2, marginTop: 8 }}>
          Nacional de Direito Marítimo, Portuário e Aduaneiro
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 18, color: "#7cc7ee" }}>
          Resumos, cortes em vídeo e fotos de cada painel
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 26, fontWeight: 700, margin: "0 -72px" }}>
        <div style={{ display: "flex", width: 40, background: "#8e1b1b" }} />
        <div style={{ display: "flex", flex: 1, background: "#0a1f33", color: "#2fa9df", padding: "20px 32px" }}>
          COSTÃO DO SANTINHO · FLORIANÓPOLIS
        </div>
        <div style={{ display: "flex", background: "#2fa9df", color: "#0f2a44", padding: "20px 32px" }}>11 A 13/11/2026</div>
      </div>
    </div>,
    size,
  );
}
