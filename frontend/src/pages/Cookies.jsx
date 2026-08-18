import React from 'react';
import SEO from '../components/seo/SEO';

export default function Cookies() {
  return (
    <>
      <SEO
        title="Política de Cookies | Lumyo"
        description="Consulta a Política de Cookies da Lumyo e percebe que tecnologias podem ser utilizadas neste website."
        canonical="/cookies"
      />

      <main
  className="min-h-screen text-white"
  style={{
    background:
      'radial-gradient(circle at 15% 20%, rgba(255, 31, 143, 0.08), transparent 32%), radial-gradient(circle at 85% 65%, rgba(62, 72, 255, 0.10), transparent 35%), #070512',
  }}
>
        <article className="mx-auto max-w-3xl px-6 pb-24 pt-40 md:px-10 md:pt-48">

          <header className="mb-16">
            <p className="mb-5 text-xs uppercase tracking-[0.35em] text-[#ff1f8f]">
              LEGAL
            </p>

            <h1 className="text-4xl font-light md:text-6xl">
              Política de Cookies
            </h1>

            <p className="mt-6 text-sm text-white/40">
              Última atualização: agosto de 2026
            </p>
          </header>

          <div className="space-y-12 text-base leading-8 text-white/65">

            <section>
              <h2 className="mb-4 text-xl text-white">
                1. O que são cookies?
              </h2>

              <p>
                Cookies são pequenos ficheiros ou tecnologias semelhantes que
                podem ser armazenados ou consultados no dispositivo utilizado
                para aceder a um website.
              </p>

              <p className="mt-4">
                Podem ser utilizados para assegurar funcionalidades técnicas,
                guardar preferências, compreender a utilização do website ou
                medir a eficácia de ações de marketing.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl text-white">
                2. Cookies estritamente necessários
              </h2>

              <p>
                O website pode utilizar cookies ou tecnologias estritamente
                necessárias ao seu funcionamento, segurança, gestão de sessão ou
                prestação de funcionalidades expressamente solicitadas pelo
                utilizador.
              </p>

              <p className="mt-4">
                Estas tecnologias não dependem de consentimento quando são
                estritamente necessárias para fornecer o serviço solicitado.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl text-white">
                3. Cookies de análise
              </h2>

              <p>
                No futuro, a Lumyo poderá utilizar ferramentas de análise, como
                Google Analytics, para compreender de forma agregada como o
                website é utilizado, que páginas são visitadas e como os
                utilizadores chegam ao website.
              </p>

              <p className="mt-4">
                Estas tecnologias apenas serão ativadas quando exista uma base
                legal adequada e, quando exigido, após obtenção do consentimento
                do utilizador.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl text-white">
                4. Publicidade e medição
              </h2>

              <p>
                A Lumyo poderá futuramente utilizar tecnologias de publicidade e
                medição, incluindo Meta Pixel e ferramentas associadas a
                plataformas publicitárias, para medir campanhas, atribuir
                conversões e melhorar a relevância das ações de marketing.
              </p>

              <p className="mt-4">
                Estas tecnologias não deverão ser carregadas antes da obtenção do
                consentimento quando este seja legalmente necessário.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl text-white">
                5. Chatbot e serviços externos
              </h2>

              <p>
                Algumas funcionalidades, como um chatbot, poderão recorrer a
                tecnologias de armazenamento local, cookies ou serviços externos
                necessários ao funcionamento da conversa.
              </p>

              <p className="mt-4">
                Quando esta funcionalidade for ativada, esta política será
                atualizada para identificar as tecnologias relevantes e indicar
                a sua finalidade e duração, quando aplicável.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl text-white">
                6. Consentimento
              </h2>

              <p>
                Quando o website utilizar cookies ou tecnologias não estritamente
                necessárias, será solicitado consentimento antes da sua ativação,
                de acordo com as opções apresentadas no mecanismo de gestão de
                cookies.
              </p>

              <p className="mt-4">
                O utilizador poderá aceitar ou rejeitar as categorias opcionais e
                alterar posteriormente a sua escolha.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl text-white">
                7. Alterar ou retirar o consentimento
              </h2>

              <p>
                Quando forem utilizados cookies sujeitos a consentimento, será
                disponibilizado um mecanismo que permita rever ou retirar as
                preferências anteriormente definidas.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl text-white">
                8. Cookies de terceiros
              </h2>

              <p>
                Algumas funcionalidades poderão ser fornecidas por terceiros e
                implicar a utilização das suas próprias tecnologias. Quando estas
                forem ativadas, a informação relevante será apresentada nesta
                política e no mecanismo de gestão de consentimento.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl text-white">
                9. Atualizações
              </h2>

              <p>
                Esta Política de Cookies será atualizada sempre que sejam
                adicionadas, removidas ou alteradas tecnologias utilizadas pelo
                website.
              </p>
            </section>

          </div>
        </article>
      </main>
    </>
  );
}