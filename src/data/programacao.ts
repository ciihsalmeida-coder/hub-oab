// Programação e carômetro do XIV Congresso (fonte: plano de cobertura Mzen Films).
// Nomes e cargos seguem o carômetro aprovado pela OAB. Itens com `pendente`
// ainda precisam de conferência antes de publicar.

export type Palestrante = {
  nome: string;
  cargo: string;
  foto?: string;
  pendente?: string;
};

export type Painel = {
  slug: string;
  numero: number | null;
  titulo: string;
  area: "Abertura" | "Aduaneiro" | "Portuário" | "Marítimo";
  data: string; // AAAA-MM-DD
  horario: string;
  palestrantes: Palestrante[];
};

export const congresso = {
  nome: "XIV Congresso Nacional de Direito Marítimo, Portuário e Aduaneiro",
  datas: "11 a 13 de novembro de 2026",
  local: "Costão do Santinho · Florianópolis",
  galeriaUrl: "", // link da galeria com busca por selfie (a definir)
};

export const paineis: Painel[] = [
  {
    slug: "abertura",
    numero: null,
    titulo: "Solenidade de abertura e palestra magna",
    area: "Abertura",
    data: "2026-11-11",
    horario: "17h30",
    palestrantes: [{ nome: "Amyr Klink", cargo: "Palestra magna, 18h30" }],
  },
  {
    slug: "painel-1",
    numero: 1,
    titulo: "Questões Legais do Novo Processo de Importação",
    area: "Aduaneiro",
    data: "2026-11-12",
    horario: "10h00",
    palestrantes: [
      { nome: "Bruno Barcellos", cargo: "Advogado e Presidente da Comissão de Direito Aduaneiro da OAB/ES" },
      { nome: "Fernanda Kotzias", cargo: "Advogada" },
      { nome: "Carmem Grasiele Silva", cargo: "Advogada" },
      { nome: "Yuri da Cunha", cargo: "Gestor" },
      { nome: "Rosaldo Trevisan", cargo: "Conselheiro do CARF" },
    ],
  },
  {
    slug: "painel-2",
    numero: 2,
    titulo: "O Plano Nacional de Logística 2050 e os Desafios do Setor Privado",
    area: "Portuário",
    data: "2026-11-12",
    horario: "11h15",
    palestrantes: [
      { nome: "Alexandre Moreira Lopes", cargo: "Advogado e Presidente da Comissão de Direito Portuário e Marítimo da OAB/DF" },
      { nome: "Fabio Moya Diez", cargo: "Advogado e Coordenador do Comitê Jurídico da Associação de Terminais Portuários Privados (ATP)" },
      { nome: "Murillo Barbosa", cargo: "Diretor-Presidente da Associação de Terminais Portuários Privados (ATP)" },
      { nome: "Sérgio Aquino", cargo: "Presidente da Federação Nacional dos Operadores Portuários (FENOP)" },
      { nome: "Angelino Caputo e Oliveira", cargo: "Presidente Executivo da Associação Brasileira de Terminais e Recintos Alfandegados (ABTRA)" },
      { nome: "André de Seixas", cargo: "Diretor-Presidente da Associação Logística Brasil" },
      { nome: "Jesualdo Silva", cargo: "Diretor-Presidente da Associação Brasileira dos Terminais Portuários (ABTP)" },
      { nome: "Caio Marcelo Morel Correa", cargo: "Diretor Executivo da Associação Brasileira dos Terminais de Contêineres (ABRATEC)" },
    ],
  },
  {
    slug: "painel-3",
    numero: 3,
    titulo: "Lex Maritima e Segurança Jurídica",
    area: "Marítimo",
    data: "2026-11-12",
    horario: "14h00",
    palestrantes: [
      { nome: "Rizieri César Mezadri", cargo: "Advogado e Presidente da Comissão de Direito Portuário e Marítimo da OAB/SC" },
      { nome: "Arthur Rocha Baptista", cargo: "Advogado e Conselheiro da APL Cluster Marítimo do RS e do Sul Export" },
      { nome: "Rodrigo Vaz Sampaio", cargo: "Advogado, Árbitro e Livre-Docente da USP" },
      { nome: "Marcelo David Gonçalves", cargo: "Desembargador e Vice-Presidente do Tribunal Marítimo" },
      { nome: "Pedro Calmon Neto", cargo: "Advogado e Professor" },
      { nome: "Gustavo Alexandre da Câmara Leal Belluzzo", cargo: "Juiz do Núcleo Especializado de Justiça 4.0 – Direito Marítimo" },
    ],
  },
  {
    slug: "painel-4",
    numero: 4,
    titulo: "Limites do Poder Sancionador Aduaneiro",
    area: "Aduaneiro",
    data: "2026-11-12",
    horario: "16h00",
    palestrantes: [
      { nome: "Raquel Segalla Reis", cargo: "Advogada" },
      { nome: "Simone Cristine Davel", cargo: "Advogada e Secretária da Comissão de Direito Aduaneiro da OAB/SC" },
      { nome: "Diogo Bianchi Fazolo", cargo: "Advogado", pendente: "Cargo incompleto e marcado para revisão no carômetro" },
      { nome: "Solon Sehn", cargo: "Advogado e Professor" },
      { nome: "Maria Noel Lascano", cargo: "Advogada e Professora" },
    ],
  },
  {
    slug: "painel-5",
    numero: 5,
    titulo: "Portos e Terminais Privados e Arrendados: Segurança Jurídica, Legislação e Regulação",
    area: "Portuário",
    data: "2026-11-12",
    horario: "17h15",
    palestrantes: [
      { nome: "Jorge Dantas Jr.", cargo: "Advogado e Gerente Executivo Jurídico da JBS Terminais" },
      { nome: "Luciana Mattar Vilela Nemer", cargo: "Advogada e Professora" },
      { nome: "Beatriz Gallotti", cargo: "Advogada e Coordenadora Jurídica da ABEPH, Associação Brasileira das Entidades Portuárias e Hidroviárias" },
      { nome: "Gabriela Costa", cargo: "Diretora Executiva da Associação de Terminais Portuários Privados (ATP)" },
      { nome: "Gabriel Jacques de Moura", cargo: "Advogado e Diretor Jurídico da Santos Brasil" },
      { nome: "Eduardo Gaban", cargo: "Diretor de Relações Institucionais do Instituto Brasileiro de Concorrência e Inovação (IBCI)" },
    ],
  },
  {
    slug: "painel-6",
    numero: 6,
    titulo: "Ratificação das Convenções Internacionais pelo Brasil: Estamos Atrasados ou Não Temos Interesse?",
    area: "Marítimo",
    data: "2026-11-13",
    horario: "10h00",
    palestrantes: [
      { nome: "Camila Brandão da Costa", cargo: "Advogada e Vice-Presidente da Comissão de Direito Aduaneiro, Marítimo e Portuário da OAB/BA" },
      { nome: "Rafael Prado, PhD, LLD", cargo: "Nippon Foundation Lecturer em Governança Global dos Oceanos no IMO-IMLI" },
      { nome: "Bernardo Mendes Vianna", cargo: "Advogado e Vice-Presidente da ABDM e do IIDM" },
      { nome: "Beatriz Frambach", cargo: "Advogada" },
      { nome: "Eliane Maria Octaviano Martins", cargo: "Jurista e Diretora da Maritime Law Academy (MLAW)" },
      { nome: "Ingrid Zanella Andrade Campos", cargo: "Advogada e Presidente da OAB/PE" },
      { nome: "Luiz Felipe Galante", cargo: "Advogado e Presidente da ABDM" },
    ],
  },
  {
    slug: "painel-7",
    numero: 7,
    titulo: "Modelagem Portuária: Legislação x Desafios",
    area: "Portuário",
    data: "2026-11-13",
    horario: "11h15",
    palestrantes: [
      { nome: "Flávia Fardim", cargo: "Advogada e Presidente da Comissão de Direito Marítimo e Portuário da OAB/ES" },
      { nome: "Luis Felipe Salomão", cargo: "Advogado" },
      { nome: "Mário Povia", cargo: "Diretor-Presidente do Instituto Brasileiro de Infraestrutura da Frente Parlamentar Mista de Portos e Aeroportos" },
      { nome: "Wilson Pereira de Lima Filho", cargo: "Diretor da ANTAQ" },
      { nome: "Diego de Paula", cargo: "Advogado e Diretor Jurídico e de Assuntos Corporativos da TIL Panama" },
      { nome: "Guilherme Mendes Resende", cargo: "Advogado e Professor do IDP" },
      { nome: "Bruno Neri", cargo: "Diretor do Departamento de Novas Outorgas e Políticas Regulatórias Portuárias da Secretaria Nacional de Portos" },
      { nome: "Celso Ricardo Furtado Peel", cargo: "Relator da Comissão de Juristas para Revisão do Marco Legal Portuário (CEPORTOS)" },
    ],
  },
  {
    slug: "painel-8",
    numero: 8,
    titulo: "A Prova no Contencioso Aduaneiro",
    area: "Aduaneiro",
    data: "2026-11-13",
    horario: "14h00",
    palestrantes: [
      { nome: "Alessandra Carioni", cargo: "Advogada, Professora e Presidente da Comissão de Direito Aduaneiro da OAB/SC" },
      { nome: "Claudio Gonçalves Pereira", cargo: "Advogado e Vice-Presidente da Comissão de Direito Aduaneiro da OAB/SC" },
      { nome: "Luciane Amaral Corrêa Münch", cargo: "Desembargadora Federal do Tribunal Regional Federal da 4ª Região (TRF4)" },
      { nome: "Daniela Floriano", cargo: "Advogada e Professora" },
      { nome: "Regis Holanda Xavier", cargo: "Presidente da 3ª Seção do CARF" },
      { nome: "José Antônio Homerich Valduga", cargo: "Advogado" },
    ],
  },
  {
    slug: "painel-9",
    numero: 9,
    titulo: "Tópicos Especiais da Regulação da ANTAQ",
    area: "Marítimo",
    data: "2026-11-13",
    horario: "16h00",
    palestrantes: [
      { nome: "Najla Buhatem Maluf", cargo: "Advogada e Presidente da Comissão de Direito Marítimo e Portuário da OAB/MA" },
      { nome: "Bruno Tussi", cargo: "Advogado e Professor" },
      { nome: "João Paulo Braun", cargo: "Advogado e Professor" },
      { nome: "Frederico Carvalho Dias", cargo: "Diretor-Geral da ANTAQ" },
      { nome: "Bruno Burini", cargo: "Advogado e Professor" },
      { nome: "Rafael Silva Ferreira", cargo: "Advogado" },
      { nome: "Marcelo Sammarco", cargo: "Advogado e Vice-Presidente da ABDM" },
    ],
  },
];

export const dias = [
  { data: "2026-11-11", rotulo: "Quarta, 11/11" },
  { data: "2026-11-12", rotulo: "Quinta, 12/11" },
  { data: "2026-11-13", rotulo: "Sexta, 13/11" },
];

export function getPainel(slug: string) {
  return paineis.find((p) => p.slug === slug);
}
