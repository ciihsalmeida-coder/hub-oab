import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { Rodape } from "@/components/Marca";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "XIV Congresso OAB · Hub",
  description:
    "Programação, palestrantes, fotos e cortes do XIV Congresso Nacional de Direito Marítimo, Portuário e Aduaneiro.",
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
