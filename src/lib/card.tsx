import { ImageResponse } from "next/og";
import { LOGO_OAB_AZUL, LOGO_OAB_BRANCO } from "@/lib/logo-oab";

type Pessoa = {
  nome: string;
  cargo: string;
  foto?: string | null;
  /** Foto do evento (já embutida) para o fundo; sem ela, o degradê do cartaz. */
  fundo?: string | null;
};

// Cards do Instagram (1080x1350) na identidade do congresso. Troca de layout: só aqui.
// - frase: a fala aprovada do palestrante;
// - participacao: "palestrante no painel", sem frase (serve antes e depois do evento);
// - fundo: só a moldura do evento, com o meio livre para o palestrante escrever no Instagram ou no Canva.
export type Modelo =
  | ({ modelo: "frase"; texto: string } & Pessoa)
  | ({ modelo: "participacao"; painel: string; quando: string } & Pessoa)
  | { modelo: "fundo" };

// Feed (4:5, 1080x1350) ou Story (9:16, 1080x1920). No Story o conteúdo fica longe do topo e da base,
// onde o Instagram põe a barra de progresso e o campo de resposta.
export type Formato = "feed" | "story";
const ALTURA: Record<Formato, number> = { feed: 1350, story: 1920 };
const MARGEM_STORY = 200;

export function gerarCard(dados: Modelo, formato: Formato = "feed") {
  if (dados.modelo !== "fundo" && dados.fundo)
    return cardComFoto({ ...dados, fundo: dados.fundo }, formato);
  const altura = ALTURA[formato];
  const story = formato === "story";
  const fundo = dados.modelo === "fundo" ? null : dados.fundo;
  // Sobre foto, tudo em branco, com sombra escura em cima e embaixo para o texto ler bem.
  const tinta = fundo ? "#ffffff" : "#0f2a44";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        paddingTop: story ? MARGEM_STORY - 72 : 0,
        paddingBottom: story ? MARGEM_STORY : 0,
        background: fundo
          ? "#0f2a44"
          : "linear-gradient(180deg, #f4f6f8 0%, #dfe6ec 28%, #9fb3c4 50%, #3d6585 74%, #17344f 100%)",
        color: tinta,
      }}
    >
      {fundo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fundo}
          width={1080}
          height={altura}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
          alt=""
        />
      )}
      {fundo && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            background:
              "linear-gradient(180deg, rgba(10,28,46,0.82) 0%, rgba(10,28,46,0.25) 26%, rgba(10,28,46,0.15) 42%, rgba(10,28,46,0.78) 64%, rgba(10,28,46,0.94) 100%)",
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px 0",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fundo ? LOGO_OAB_BRANCO : LOGO_OAB_AZUL}
          width={152}
          height={80}
          style={{ marginBottom: 28 }}
          alt=""
        />
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          XIV CONGRESSO NACIONAL DE DIREITO MARÍTIMO, PORTUÁRIO E ADUANEIRO
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            marginTop: 8,
            color: fundo ? "#7cc7ee" : "#8e1b1b",
            fontWeight: 700,
          }}
        >
          DAS SECCIONAIS OAB 2026
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: fundo ? "flex-end" : "center",
          padding: fundo ? "0 80px 56px" : "0 80px",
        }}
      >
        {dados.modelo === "frase" && <Frase texto={dados.texto} cor={tinta} />}
        {dados.modelo === "participacao" && (
          <Participacao
            painel={dados.painel}
            quando={dados.quando}
            sobreFoto={Boolean(fundo)}
          />
        )}
        {dados.modelo !== "fundo" && (
          <Assinatura nome={dados.nome} cargo={dados.cargo} foto={dados.foto} />
        )}
      </div>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
        <div style={{ display: "flex", width: 40, background: "#8e1b1b" }} />
        <div
          style={{
            display: "flex",
            flex: 1,
            background: "#0f2a44",
            color: "#2fa9df",
            padding: "26px 32px",
          }}
        >
          COSTÃO DO SANTINHO · FLORIANÓPOLIS
        </div>
        <div
          style={{
            display: "flex",
            background: "#2fa9df",
            color: "#0f2a44",
            padding: "26px 32px",
          }}
        >
          11 A 13/11
        </div>
      </div>
    </div>,
    { width: 1080, height: altura },
  );
}

function Frase({ texto, cor }: { texto: string; cor: string }) {
  const tamanho = texto.length > 180 ? 50 : texto.length > 110 ? 58 : 66;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          fontSize: 160,
          lineHeight: 0.6,
          color: "#2fa9df",
          fontWeight: 700,
        }}
      >
        “
      </div>
      <div
        style={{
          display: "flex",
          fontSize: tamanho,
          fontWeight: 700,
          lineHeight: 1.18,
          color: cor,
        }}
      >
        {texto}
      </div>
    </div>
  );
}

function Participacao({
  painel,
  quando,
  sobreFoto,
}: {
  painel: string;
  quando: string;
  sobreFoto: boolean;
}) {
  const tamanho = painel.length > 90 ? 52 : painel.length > 55 ? 60 : 70;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 6,
          color: sobreFoto ? "#7cc7ee" : "#8e1b1b",
        }}
      >
        PALESTRANTE
      </div>
      <div
        style={{
          display: "flex",
          fontSize: tamanho,
          fontWeight: 700,
          lineHeight: 1.12,
          marginTop: 20,
        }}
      >
        {painel}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 32,
          fontWeight: 700,
          marginTop: 24,
          color: sobreFoto ? "rgba(255,255,255,0.85)" : "#2c5878",
        }}
      >
        {quando}
      </div>
    </div>
  );
}

function Assinatura({ nome, cargo, foto }: Pessoa) {
  const iniciais = nome
    .replace(/,.*$/, "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join("");
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 56 }}>
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto}
          width={140}
          height={140}
          style={{ borderRadius: 28, objectFit: "cover" }}
          alt=""
        />
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginLeft: 32,
          color: "white",
          maxWidth: 700,
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
          {nome}
        </div>
        <div style={{ display: "flex", fontSize: 26, opacity: 0.85 }}>
          {cargo}
        </div>
      </div>
    </div>
  );
}

// Altura da foto no card com foto (o resto é a faixa azul com o texto). A rota usa o mesmo valor ao recortar.
export const ALTURA_FOTO = 720;
export const ALTURA_FOTO_STORY = 1040;

// Card com foto do palestrante: a foto em cima, inteira (nada escrito sobre o rosto), e o texto numa faixa
// azul embaixo. Só o logo da OAB fica sobre a foto, no canto, com uma sombra leve.
function cardComFoto(
  dados: Exclude<Modelo, { modelo: "fundo" }> & { fundo: string },
  formato: Formato,
) {
  const story = formato === "story";
  const frase = dados.modelo === "frase" ? dados.texto : null;
  const alturaFoto = story
    ? frase && frase.length > 160
      ? 900
      : ALTURA_FOTO_STORY
    : frase && frase.length > 160
      ? 600
      : ALTURA_FOTO;
  const tamanhoFrase = !frase
    ? 0
    : frase.length > 200
      ? 38
      : frase.length > 120
        ? 44
        : 52;
  const tamanhoPainel =
    dados.modelo === "participacao"
      ? dados.painel.length > 90
        ? 40
        : dados.painel.length > 55
          ? 46
          : 54
      : 0;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0f2a44",
        color: "white",
        paddingBottom: story ? MARGEM_STORY - 80 : 0,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          width: 1080,
          height: alturaFoto,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dados.fundo}
          width={1080}
          height={alturaFoto}
          style={{ objectFit: "cover" }}
          alt=""
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: alturaFoto,
            background:
              "linear-gradient(180deg, rgba(10,28,46,0.55) 0%, rgba(10,28,46,0) 22%, rgba(10,28,46,0) 82%, rgba(15,42,68,1) 100%)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_OAB_BRANCO}
          width={130}
          height={68}
          style={{
            position: "absolute",
            top: story ? MARGEM_STORY - 40 : 48,
            left: 64,
          }}
          alt=""
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
          padding: story ? "36px 72px 48px" : "28px 72px 36px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#7cc7ee",
          }}
        >
          XIV CONGRESSO NACIONAL DE DIREITO MARÍTIMO, PORTUÁRIO E ADUANEIRO
        </div>
        {frase ? (
          <div
            style={{
              display: "flex",
              fontSize: tamanhoFrase,
              fontWeight: 700,
              lineHeight: 1.18,
            }}
          >
            “{frase}”
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 6,
                color: "#7cc7ee",
              }}
            >
              PALESTRANTE
            </div>
            <div
              style={{
                display: "flex",
                fontSize: tamanhoPainel,
                fontWeight: 700,
                lineHeight: 1.12,
                marginTop: 12,
              }}
            >
              {dados.modelo === "participacao" ? dados.painel : ""}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                marginTop: 14,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {dados.modelo === "participacao" ? dados.quando : ""}
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700 }}>
            {dados.nome}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {dados.cargo}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
        <div style={{ display: "flex", width: 40, background: "#8e1b1b" }} />
        <div
          style={{
            display: "flex",
            flex: 1,
            background: "#0a1f33",
            color: "#2fa9df",
            padding: "22px 32px",
          }}
        >
          COSTÃO DO SANTINHO · FLORIANÓPOLIS
        </div>
        <div
          style={{
            display: "flex",
            background: "#2fa9df",
            color: "#0f2a44",
            padding: "22px 32px",
          }}
        >
          11 A 13/11
        </div>
      </div>
    </div>,
    { width: 1080, height: ALTURA[formato] },
  );
}
