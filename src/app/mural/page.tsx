import QRCode from "qrcode";
import { Mural } from "./Mural";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hub-oab.vercel.app";

// Mural para a TV/telão do saguão: abre em tela cheia e se atualiza sozinho.
export default async function MuralPage() {
  const qr = await QRCode.toString(SITE, { type: "svg", margin: 1, color: { dark: "#0f2a44", light: "#ffffff" } });
  return <Mural qr={qr} site={SITE.replace("https://", "")} />;
}
