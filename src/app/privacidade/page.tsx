import { Assinatura, Voltar } from "@/components/Marca";

export const metadata = { title: "Aviso de privacidade · XIV Congresso OAB" };

// Rascunho: texto a ser validado pelo jurídico da OAB/SC antes do evento.
const CONTATO_PRIVACIDADE = "o canal de privacidade da OAB/SC (contato a confirmar)";

export default function Privacidade() {
  return (
    <main>
      <header className="ceu-mar px-4 pt-6 pb-10">
        <div className="mx-auto max-w-2xl">
          <Voltar />
          <div className="mt-5">
            <Assinatura />
          </div>
          <h1 className="mt-8 text-3xl font-extrabold text-navy">Aviso de privacidade</h1>
        </div>
      </header>
      <article className="mx-auto max-w-2xl space-y-5 px-4 py-8 leading-relaxed">
        <Bloco titulo="Quem cuida dos seus dados">
          A Ordem dos Advogados do Brasil, Seccional de Santa Catarina (OAB/SC), é a controladora dos dados coletados
          neste site. A Mzen Films opera o site e trata os dados apenas em nome da OAB/SC e segundo as instruções dela.
        </Bloco>
        <Bloco titulo="O que coletamos">
          Somente se você preencher o formulário opcional: nome, e-mail e, se quiser, WhatsApp. O conteúdo do site é
          aberto e não exige cadastro.
        </Bloco>
        <Bloco titulo="Contagem de acessos">
          O site conta, de forma anônima, quantas vezes as páginas são abertas e os materiais baixados (sem nome, e-mail,
          endereço IP ou qualquer dado que identifique você), para medir o alcance do congresso.
        </Bloco>
        <Bloco titulo="Para que usamos">
          Para enviar a você os resumos, vídeos e materiais do XIV Congresso Nacional de Direito Marítimo, Portuário e
          Aduaneiro. A base legal é o seu consentimento (art. 7º, I, da LGPD). Não vendemos nem compartilhamos seus
          dados para outras finalidades.
        </Bloco>
        <Bloco titulo="Por quanto tempo">
          Mantemos os dados enquanto houver envio de conteúdos do congresso, ou até você pedir a exclusão.
        </Bloco>
        <Bloco titulo="Fotos com selfie">
          A busca de fotos por selfie acontece na plataforma de galeria contratada, e não neste site. Ela é opcional, e a
          galeria também pode ser vista sem selfie.
        </Bloco>
        <Bloco titulo="Seus direitos">
          Você pode pedir acesso, correção ou exclusão dos seus dados e retirar o consentimento a qualquer momento, pelo{" "}
          {CONTATO_PRIVACIDADE}.
        </Bloco>
      </article>
    </main>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-extrabold tracking-[0.15em] text-navy uppercase">{titulo}</h2>
      <p className="mt-2 text-navy/90">{children}</p>
    </section>
  );
}
