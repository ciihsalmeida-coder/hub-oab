import { ImageResponse } from "next/og";
import { MONTSERRAT } from "@/lib/fonte-montserrat";
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
    { width: 1080, height: altura, fonts: MONTSERRAT },
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

// Card com foto (modelo da designer): moldura azul, a foto ocupando o quadro, e no canto inferior esquerdo
// o logo da OAB, um traço azul, as aspas e a frase; embaixo, uma faixa clara com o nome do congresso.
// No Story a faixa é mais alta, para o nome do congresso não ficar atrás do campo de resposta do Instagram.
const MOLDURA = 25;
const FAIXA: Record<Formato, number> = { feed: 155, story: 330 };
// Tamanho da área da foto: a rota recorta a foto do evento exatamente nesse tamanho.
export const FOTO_CARD: Record<Formato, { largura: number; altura: number }> = {
  feed: { largura: 1080 - 2 * MOLDURA, altura: 1350 - MOLDURA - FAIXA.feed },
  story: { largura: 1080 - 2 * MOLDURA, altura: 1920 - MOLDURA - FAIXA.story },
};
const AZUL_MOLDURA = "#0b1866";

function cardComFoto(
  dados: Exclude<Modelo, { modelo: "fundo" }> & { fundo: string },
  formato: Formato,
) {
  const { largura, altura } = FOTO_CARD[formato];
  const frase = dados.modelo === "frase" ? dados.texto : null;
  const tamanhoFrase = !frase
    ? 0
    : frase.length > 220
      ? 26
      : frase.length > 140
        ? 30
        : frase.length > 80
          ? 34
          : 40;
  const tamanhoPainel =
    dados.modelo === "participacao"
      ? dados.painel.length > 90
        ? 32
        : dados.painel.length > 55
          ? 38
          : 44
      : 0;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: AZUL_MOLDURA,
        fontFamily: "Montserrat",
        padding: `${MOLDURA}px ${MOLDURA}px 0`,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          width: largura,
          height: altura,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dados.fundo}
          width={largura}
          height={altura}
          style={{ objectFit: "cover" }}
          alt=""
        />
        {/* Sombra azul de baixo para cima e da esquerda, onde fica o texto */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: largura,
            height: altura,
            background:
              "linear-gradient(180deg, rgba(11,24,102,0) 38%, rgba(11,24,102,0.55) 62%, rgba(9,18,80,0.92) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: largura,
            height: altura,
            background:
              "linear-gradient(90deg, rgba(9,18,80,0.45) 0%, rgba(9,18,80,0) 55%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: largura,
            display: "flex",
            flexDirection: "column",
            padding: "0 96px 64px",
            color: "white",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_OAB_BRANCO} width={124} height={65} alt="" />
          <div
            style={{
              display: "flex",
              width: 132,
              height: 4,
              background: "#5fb8d9",
              marginTop: 34,
              marginBottom: 30,
            }}
          />
          {frase ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 120,
                  fontWeight: 800,
                  lineHeight: 0.7,
                  height: 64,
                }}
              >
                “
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: tamanhoFrase,
                  fontWeight: 500,
                  lineHeight: 1.28,
                  marginTop: 18,
                  maxWidth: 850,
                }}
              >
                {frase}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 6,
                  color: "#8fd0ee",
                }}
              >
                PALESTRANTE
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: tamanhoPainel,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  marginTop: 14,
                  maxWidth: 860,
                }}
              >
                {dados.modelo === "participacao" ? dados.painel : ""}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 500,
                  marginTop: 14,
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {dados.modelo === "participacao" ? dados.quando : ""}
              </div>
            </div>
          )}
          <div
            style={{ display: "flex", flexDirection: "column", marginTop: 30 }}
          >
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
              {dados.nome}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 19,
                fontWeight: 400,
                color: "rgba(255,255,255,0.8)",
                marginTop: 4,
              }}
            >
              {dados.cargo}
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: formato === "story" ? "flex-start" : "center",
          paddingTop: formato === "story" ? 64 : 0,
          margin: `0 -${MOLDURA}px`,
          height: FAIXA[formato],
          background: "#eef0f3",
          color: "#0f1f5c",
          fontSize: 27,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex" }}>
          <span style={{ fontWeight: 800 }}>XIV CONGRESSO</span>
          <span style={{ fontWeight: 500, marginLeft: 8 }}>
            NACIONAL DE DIREITO MARÍTIMO, PORTUÁRIO
          </span>
        </div>
        <div style={{ display: "flex" }}>
          <span style={{ fontWeight: 500 }}>E ADUANEIRO DAS</span>
          <span style={{ fontWeight: 800, marginLeft: 8 }}>
            SECCIONAIS OAB 2026
          </span>
        </div>
      </div>
    </div>,
    { width: 1080, height: ALTURA[formato], fonts: MONTSERRAT },
  );
}
