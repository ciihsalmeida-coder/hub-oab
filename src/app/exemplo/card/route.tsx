import { ImageResponse } from "next/og";
import { falas } from "../dados";

// Card pronto para o Instagram (1080x1350) com a fala do palestrante.
export function GET(request: Request) {
  const i = Number(new URL(request.url).searchParams.get("i") ?? 0);
  const fala = falas[i] ?? falas[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #f4f6f8 0%, #dfe6ec 28%, #9fb3c4 50%, #3d6585 74%, #17344f 100%)",
          color: "#0f2a44",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", padding: "80px 80px 0" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>
            XIV CONGRESSO NACIONAL DE DIREITO MARÍTIMO, PORTUÁRIO E ADUANEIRO
          </div>
          <div style={{ display: "flex", fontSize: 26, marginTop: 8, color: "#8e1b1b", fontWeight: 700 }}>
            DAS SECCIONAIS OAB 2026
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: "0 80px" }}>
          <div style={{ display: "flex", fontSize: 160, lineHeight: 0.6, color: "#2fa9df", fontWeight: 700 }}>“</div>
          <div style={{ display: "flex", fontSize: 62, fontWeight: 700, lineHeight: 1.18, color: "#0f2a44" }}>
            {fala.texto}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 56 }}>
            <div
              style={{
                display: "flex",
                width: 120,
                height: 120,
                borderRadius: 24,
                background: "#2c5878",
                color: "white",
                fontSize: 44,
                fontWeight: 700,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {fala.quem
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 32, color: "white" }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{fala.quem}</div>
              <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>{fala.cargo}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
          <div style={{ display: "flex", width: 40, background: "#8e1b1b" }} />
          <div style={{ display: "flex", flex: 1, background: "#0f2a44", color: "#2fa9df", padding: "26px 32px" }}>
            COSTÃO DO SANTINHO · FLORIANÓPOLIS
          </div>
          <div style={{ display: "flex", background: "#2fa9df", color: "#0f2a44", padding: "26px 32px" }}>
            11 A 13/11
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 },
  );
}
