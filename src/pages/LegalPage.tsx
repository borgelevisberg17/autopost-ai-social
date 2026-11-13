import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react";
import { BrandMark } from "@/components/site/BrandMark";
import { SiteFooter } from "@/components/site/SiteFooter";

const CONTACT_EMAIL = "borgeruy@gmail.com";
const UPDATED_AT = "13 de novembro de 2026";

type Section = { title: string; paragraphs: string[]; bullets?: string[] };
type LegalDocument = { eyebrow: string; title: string; intro: string; sections: Section[] };

const documents: Record<string, LegalDocument> = {
  "/policy": {
    eyebrow: "Informações legais · Privacidade",
    title: "Política de Privacidade",
    intro: "Esta política explica como a Vendora trata informações quando você visita o site, cria uma conta ou utiliza os recursos de gestão comercial, loja e integrações da plataforma.",
    sections: [
      { title: "1. Quem somos e como falar conosco", paragraphs: [`A Vendora é uma plataforma de operações de comércio. Para dúvidas ou solicitações sobre privacidade e dados pessoais, escreva para ${CONTACT_EMAIL}.` ] },
      { title: "2. Dados que podemos tratar", paragraphs: ["O tipo de informação depende dos recursos que você utiliza. Podemos tratar dados de cadastro e autenticação, como nome, e-mail e identificadores da conta; dados da empresa e da equipa; catálogo, inventário, pedidos, pagamentos e informações de clientes inseridas pela empresa; e dados de canais e integrações que o titular decide conectar.", "Também podemos tratar mensagens, instruções e conteúdo fornecido para funcionalidades assistidas por IA, bem como informações técnicas necessárias para segurança, diagnóstico e funcionamento do serviço. A empresa que usa a Vendora é responsável por informar seus próprios clientes sobre os dados que insere ou recebe na plataforma." ] },
      { title: "3. Para que usamos os dados", paragraphs: ["Usamos as informações para fornecer e proteger a conta e os recursos contratados; organizar catálogo, pedidos e operações; habilitar integrações escolhidas pelo titular; responder a pedidos de suporte; prevenir fraude e uso indevido; manter registros de segurança e auditoria; e cumprir obrigações legais.", "Recursos automatizados ou de IA processam as informações necessárias para executar a solicitação feita pelo usuário. A disponibilidade, o tratamento e os resultados de serviços externos dependem também dos seus próprios termos e políticas." ] },
      { title: "4. Cookies e armazenamento local", paragraphs: ["O site pode utilizar armazenamento local do navegador para guardar a escolha feita no aviso de cookies. O aviso da Vendora apresenta opções para aceitar todos os cookies ou manter apenas os essenciais. Cookies ou tecnologias não essenciais somente devem ser utilizados de acordo com as escolhas e configurações aplicáveis. Você pode apagar os dados locais nas configurações do navegador; isso poderá fazer o aviso de preferências aparecer novamente." ] },
      { title: "5. Compartilhamento e prestadores", paragraphs: ["Não vendemos dados pessoais. Podemos compartilhar informações com prestadores que hospedam ou processam dados necessários à plataforma, com provedores de IA usados para atender solicitações e com serviços externos que o titular conecta (por exemplo, canais sociais, mensageria ou pagamentos). O compartilhamento é limitado ao funcionamento, à segurança ou à instrução do titular, sujeito aos termos aplicáveis desses serviços.", "Também poderemos divulgar informações quando exigido por lei, para responder a solicitações válidas de autoridades ou para proteger direitos, usuários e a segurança do serviço." ] },
      { title: "6. Retenção e segurança", paragraphs: ["Mantemos os dados enquanto forem necessários para prestar o serviço, cumprir obrigações legais, resolver disputas e proteger a plataforma. Os prazos variam conforme a categoria de dados e as obrigações aplicáveis. Aplicamos controles técnicos e organizacionais destinados a proteger as informações; nenhum método de transmissão ou armazenamento é totalmente isento de risco." ] },
      { title: "7. Seus direitos e solicitações", paragraphs: [`Conforme a legislação aplicável, você poderá solicitar acesso, correção, portabilidade, oposição ou eliminação de dados pessoais. Envie sua solicitação para ${CONTACT_EMAIL}, informando o e-mail da conta, a empresa relacionada e o pedido pretendido. Poderemos solicitar informações razoáveis para confirmar sua identidade e responderemos nos prazos legais. A eliminação pode ser limitada quando a conservação for exigida por lei ou necessária para exercício de direitos.`] },
      { title: "8. Dados de menores e alterações", paragraphs: ["A plataforma é destinada a empresas e não é dirigida a crianças. Se acredita que uma criança forneceu dados pessoais à Vendora, entre em contato para que possamos analisar o caso. Podemos atualizar esta política; a versão publicada nesta página indicará a data da última atualização." ] },
    ],
  },
  "/terms": {
    eyebrow: "Informações legais · Serviço",
    title: "Termos de Serviço",
    intro: "Estes termos regem o acesso e o uso da Vendora. Ao criar uma conta ou utilizar a plataforma, você declara que leu e aceita estas condições em nome próprio ou da empresa que representa.",
    sections: [
      { title: "1. O serviço", paragraphs: ["A Vendora oferece ferramentas de gestão comercial, incluindo recursos de catálogo, inventário, pedidos, clientes, canais, automações e funcionalidades assistidas por IA. Os recursos disponíveis podem variar conforme o plano, a configuração da conta e a disponibilidade de serviços externos." ] },
      { title: "2. Conta e autorização", paragraphs: ["Você deve fornecer informações corretas, manter as credenciais em segurança e atualizar os dados da conta quando necessário. Se criar ou administrar uma conta em nome de uma empresa, declara ter autorização para vinculá-la a estes termos. Você é responsável pelas atividades realizadas por usuários a quem conceder acesso e deve nos avisar prontamente sobre uso não autorizado." ] },
      { title: "3. Uso aceitável e conteúdo", paragraphs: ["Você mantém os direitos sobre o conteúdo e os dados inseridos na plataforma. Concede à Vendora autorização limitada para hospedar, processar e transmitir esse conteúdo na medida necessária para fornecer, proteger e melhorar o serviço solicitado.", "Você é responsável por possuir os direitos, permissões e bases legais necessários para inserir dados de clientes, enviar comunicações, conectar canais e publicar conteúdo. Não utilize a Vendora para violar leis, direitos de terceiros, regras das plataformas conectadas ou para distribuir conteúdo fraudulento, abusivo ou ilícito." ] },
      { title: "4. Integrações e inteligência artificial", paragraphs: ["A conexão com redes sociais, mensageria, pagamentos ou outros serviços depende das permissões concedidas e dos termos dos respectivos provedores. Esses serviços podem alterar, limitar ou interromper suas APIs; a Vendora não controla sua disponibilidade nem suas decisões.", "Resultados gerados por IA podem conter erros e devem ser revisados antes de serem usados, enviados ou publicados. A IA não substitui sua verificação de preços, estoque, obrigações legais ou adequação do conteúdo. Você controla as ações que autoriza e continua responsável pelas comunicações e operações da sua empresa." ] },
      { title: "5. Planos, pagamentos e alterações", paragraphs: ["Os preços, limites, períodos de cobrança e condições de cancelamento aplicáveis são os apresentados no fluxo de contratação ou na conta. Quando um plano pago for oferecido, a contratação implica o pagamento dos valores informados pelo meio escolhido. Tributos eventualmente aplicáveis serão tratados conforme as informações exibidas e a legislação pertinente.", "Podemos alterar ou descontinuar recursos para manter a segurança e evolução do serviço. Quando uma alteração afetar materialmente o serviço contratado, procuraremos comunicá-la por meios razoáveis." ] },
      { title: "6. Disponibilidade, suspensão e encerramento", paragraphs: ["Buscamos manter o serviço disponível e seguro, mas não garantimos acesso ininterrupto ou livre de erros. Podemos suspender ou restringir acesso diante de risco de segurança, violação destes termos, obrigação legal ou uso que possa prejudicar usuários ou a plataforma. Você pode deixar de usar o serviço e solicitar a exclusão da conta conforme as instruções em /data-deletion." ] },
      { title: "7. Responsabilidade", paragraphs: ["Na medida permitida pela lei, a Vendora não responde por indisponibilidades de serviços externos, decisões de redes sociais, perdas decorrentes de credenciais comprometidas por falha do usuário, conteúdo fornecido pelo titular ou uso de resultados de IA sem revisão. Nada nestes termos exclui responsabilidade que não possa ser afastada por lei." ] },
      { title: "8. Lei aplicável e contato", paragraphs: [`Estes termos são aplicados em conjunto com a legislação obrigatória pertinente ao usuário e à operação do serviço; direitos indisponíveis por lei permanecem preservados. Para dúvidas, reclamações ou comunicações legais, escreva para ${CONTACT_EMAIL}.` ] },
    ],
  },
  "/data-deletion": {
    eyebrow: "Informações legais · Seus dados",
    title: "Exclusão de Dados do Usuário",
    intro: "Você pode solicitar a exclusão dos dados associados à sua conta Vendora. Esta página descreve como fazer o pedido e o que acontece depois que o recebemos.",
    sections: [
      { title: "Como solicitar", paragraphs: [`Envie um e-mail para ${CONTACT_EMAIL} com o assunto “Solicitação de exclusão de dados Vendora”. Para localizarmos a conta, inclua no corpo da mensagem:`], bullets: ["o endereço de e-mail usado na conta Vendora;", "o nome da empresa ou espaço de trabalho associado, se aplicável;", "a confirmação de que você solicita o encerramento da conta e a exclusão dos dados pessoais relacionados."] },
      { title: "Confirmação e processamento", paragraphs: ["Para proteger sua conta, poderemos pedir informações adicionais razoáveis para verificar sua identidade ou autoridade para agir em nome da empresa. Após a verificação, processaremos o pedido e enviaremos uma confirmação por e-mail. A exclusão poderá incluir a desativação da conta e a remoção ou anonimização de dados pessoais associados que já não sejam necessários para prestar o serviço." ] },
      { title: "Dados que podem ser mantidos", paragraphs: ["Alguns registros podem ser conservados pelo período necessário para cumprir obrigações legais, resolver disputas, prevenir fraude, manter segurança ou exercer e defender direitos. Esses dados serão mantidos apenas para essas finalidades e pelo tempo exigido ou permitido pela lei. Dados que pertençam a uma empresa ou que essa empresa tenha inserido sobre seus próprios clientes podem exigir uma solicitação do administrador responsável por essa empresa." ] },
      { title: "Integrações de terceiros", paragraphs: ["A exclusão na Vendora não necessariamente elimina dados mantidos por serviços externos conectados, como redes sociais, mensageria ou pagamentos. Para remover dados nesses serviços, faça também o pedido diretamente ao respectivo provedor e revogue as permissões da integração nas configurações da sua conta, quando disponíveis." ] },
      { title: "Dúvidas", paragraphs: [`Se não puder acessar sua conta ou precisar de ajuda para enviar o pedido, contate ${CONTACT_EMAIL}. A solicitação pode ser feita sem custo, sujeita à verificação de identidade e às exceções legais aplicáveis.`] },
    ],
  },
};

const legalLinks = [
  { path: "/policy", label: "Política de Privacidade" },
  { path: "/terms", label: "Termos de Serviço" },
  { path: "/data-deletion", label: "Exclusão de Dados" },
];

export default function LegalPage() {
  const { pathname } = useLocation();
  const page = documents[pathname] ?? documents["/policy"];

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f3ed] text-[#202522]">
      <header className="border-b border-[#e2ded5] bg-[#fffdf9]">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link to="/" aria-label="Vendora — página inicial" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="text-xl font-bold tracking-[-0.05em]">Vendora</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2c6457] hover:text-[#e36c3f]">
            <ArrowLeft className="h-4 w-4" /> Página inicial
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-12 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2" aria-label="Páginas legais">
          {legalLinks.map((item) => (
            <Link key={item.path} to={item.path} aria-current={pathname === item.path ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${pathname === item.path ? "border-[#2c6457] bg-[#2c6457] text-white" : "border-[#d8d3c8] bg-[#fffdf9] text-[#5f625d] hover:border-[#2c6457]"}`}>
              {item.label}
            </Link>
          ))}
        </div>

        <article className="rounded-2xl border border-[#e2ded5] bg-[#fffdf9] px-6 py-8 shadow-[0_18px_50px_rgba(32,37,34,0.05)] sm:px-10 sm:py-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2c6457]">{page.eyebrow}</div>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.07em] sm:text-5xl">{page.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#5f625d]">{page.intro}</p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8f8a80]">Última atualização: {UPDATED_AT}</p>

          <div className="mt-9 space-y-8 border-t border-[#e8e3da] pt-8">
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold tracking-[-0.04em]">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm leading-7 text-[#5f625d]">{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-[#5f625d]">
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-10 inline-flex items-center gap-2 border border-[#d8d3c8] bg-[#f6f3ed] px-4 py-3 text-sm font-semibold text-[#2c6457] transition hover:border-[#2c6457]">
            <Mail className="h-4 w-4" /> {CONTACT_EMAIL} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <p className="mt-5 text-xs leading-5 text-[#8f8a80]">Estas informações descrevem o funcionamento observado da plataforma e não substituem aconselhamento jurídico específico.</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
