export const metadata = {
  title: "Kit do palestrante · XIV Congresso OAB",
  robots: { index: false, follow: false },
  // Prévia no WhatsApp quando o kit é enviado
  openGraph: {
    title: "Seu kit do XIV Congresso OAB",
    description: "Cards prontos para postar, seus cortes em vídeo e suas fotos do painel.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
