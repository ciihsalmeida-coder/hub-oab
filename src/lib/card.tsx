import { ImageResponse } from "next/og";

// Card do Instagram (1080x1350) com a fala do palestrante. Troca de layout: só aqui.
export function gerarCard(dados: { texto: string; nome: string; cargo: string; foto?: string | null }) {
  const iniciais = dados.nome
    .replace(/,.*$/, "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join("");
  const tamanho = dados.texto.length > 180 ? 50 : dados.texto.length > 110 ? 58 : 66;

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
          <div style={{ display: "flex", fontSize: tamanho, fontWeight: 700, lineHeight: 1.18, color: "#0f2a44" }}>
            {dados.texto}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 56 }}>
            {dados.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dados.foto} width={140} height={140} style={{ borderRadius: 28, objectFit: "cover" }} alt="" />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 140,
                  height: 140,
                  borderRadius: 28,
                  background: "#2c5878",
                  color: "white",
                  fontSize: 50,
                  fontWeight: 700,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {iniciais}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 32, color: "white", maxWidth: 700 }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{dados.nome}</div>
              <div style={{ display: "flex", fontSize: 26, opacity: 0.85 }}>{dados.cargo}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
          <div style={{ display: "flex", width: 40, background: "#8e1b1b" }} />
          <div style={{ display: "flex", flex: 1, background: "#0f2a44", color: "#2fa9df", padding: "26px 32px" }}>
            COSTÃO DO SANTINHO · FLORIANÓPOLIS
          </div>
          <div style={{ display: "flex", background: "#2fa9df", color: "#0f2a44", padding: "26px 32px" }}>11 A 13/11</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 },
  );
}
