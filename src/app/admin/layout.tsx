export const metadata = {
  title: "Área de controle · XIV Congresso OAB",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="tema-app min-h-screen">{children}</div>;
}
