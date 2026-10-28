import type { Metadata, Viewport } from "next";
import { DM_Sans, Poppins } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "XIV Congresso OAB · Hub",
  description:
    "Programação, palestrantes, fotos e cortes do XIV Congresso Nacional de Direito Marítimo, Portuário e Aduaneiro.",
};

export const viewport: Viewport = { themeColor: "#111c2e" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${poppins.variable} font-sans antialiased`}>
        {children}
        <footer className="px-4 py-8 text-center text-xs text-muted">
          Cobertura Mzen Films · XIV Congresso OAB 2026
        </footer>
      </body>
    </html>
  );
}
