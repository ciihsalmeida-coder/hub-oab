import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { Rodape } from "@/components/Marca";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hub-oab.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "XIV Congresso OAB · Hub",
  description:
    "Programação, palestrantes, fotos e cortes do XIV Congresso Nacional de Direito Marítimo, Portuário e Aduaneiro.",
  // Prévia do link no WhatsApp, LinkedIn etc. (a imagem vem de opengraph-image.tsx)
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "XIV Congresso OAB",
    title: "XIV Congresso Nacional de Direito Marítimo, Portuário e Aduaneiro",
    description: "Resumos, cortes em vídeo e fotos de cada painel, publicados no mesmo dia.",
  },
  appleWebApp: { capable: true, title: "Congresso OAB", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#111c2e" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} font-sans antialiased`}>
        {children}
        <Rodape />
      </body>
    </html>
  );
}
