# Lumyo Final Technical Audit

## 1. Executive Summary

O website da **Lumyo** é uma aplicação web moderna de alto impacto visual, desenhada com **React**, **Tailwind CSS**, **GSAP / ScrollTrigger**, **Three.js / WebGL** e **vídeo controlado por scroll (video scrubbing)**. A identidade visual, as micro-interacções e a atmosfera tecnológica estão aprovadas e constituem uma componente essencial do produto.

Esta auditoria técnica final teve como objectivo analisar a arquitectura, o código, os bundles, os assets, a segurança, a acessibilidade e a performance (Core Web Vitals), sem degradar nem alterar a experiência visual do utilizador.

### Resumo dos Principais Achados:
- **Build & Bundle Execution**: O compilador conclui o build de produção sem erros, contudo gera **um único bundle monolítico de JavaScript (`main.ad67a097.js`) com 443.07 kB gzipped (~1.8 MB uncompressed)**. Não existe qualquer *Code Splitting* ou *Dynamic Import* (`React.lazy`).
- **Causas do CLS Elevado (~0.9)**:
  1. **Duplicação de Triggers e Pinning no Hero**: Tanto o `createHeroScrollExperience` (em `HeroTimeline.js`) quanto o `createHeroContentExperience` (em `HeroContentTimeline.js`) criam ScrollTriggers independentes a escutar o mesmo elemento. O pinning altera o fluxo DOM injetando wrappers `pin-spacer` e alternando entre estilos estáticos e `position: fixed`.
  2. **Transição Poster → Vídeo no Hero**: A troca de visibilidade e mount entre `<img src="hero-poster.webp">` e `<video>` sem reserva estrita de aspect-ratio/dimensões causa micro-deslocamentos durante o carregamento inicial.
  3. **Carregamento Assíncrono de Fontes Google**: Carregadas via `<link>` externo sem reserva de `font-display: optional` ou dimensões reservadas no layout, provocando *FOUT* (Flash of Unstyled Text) e reflows.
- **Desperdício Massivo de Assets (~85+ MB)**: Foram identificados múltiplos ficheiros de vídeo, modelos 3D GLB, ficheiros Draco e imagens PNG de alta resolução em `public/` que **nunca são importados nem utilizados no website ativo** (ex.: `base.glb` com 31.6 MB, vídeos em `public/videos/diamond/` com 13.88 MB, vídeos em `public/videos/services/` com 21.6 MB, imagens PNG brutas com >6 MB cada).
- **Componentes Não Utilizados**: Componentes inteiros como `PersistentHomeStage.jsx` (650 linhas), `ServicesBackground.jsx`, `FinalLumyoFlow.jsx`, `LogoModel.jsx` e `DiamondModel.jsx` (versão homepage) estão presentes no repositório mas **não são importados por nenhuma página**.
- **Riscos de Segurança e Operação**:
  1. O endpoint de backend FastAPI `GET /api/leads` (em `backend/server.py`) expõe **todos os contactos e dados pessoais enviados pelos utilizadores em JSON público e desprotegido** sem qualquer autenticação.
  2. Formulário da Homepage (`PersistentHomeStage.jsx`): se fosse activado, o formulário faz um `setTimeout` simulado e descarta a mensagem do cliente em vez de chamar `/api/contact` ou `/api/leads`.
- **Acessibilidade**: Detetada a presença de atributo `aria-label` num elemento `<span>` não interactivo relativo ao LinkedIn (`HeroSocials.jsx`), o que viola a especificação HTML/ARIA e gera erro nos auditores automatizados.

---

## 2. Critical Issues

| # | Problema Crítico | Ficheiro / Componente | Causa Concreta | Impacto | Risco da Alteração |
|---|---|---|---|---|---|
| **C1** | **Vulnerabilidade de Exposição de Dados Pessoais (`/api/leads`)** | [server.py](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/backend/server.py#L127-L131) | O endpoint `GET /api/leads` devolve a lista completa de leads da base de dados MongoDB sem autenticação ou controlo de acessos. | **CRÍTICO / RGPD**: Qualquer visitante ou bot pode listar nomes, emails e mensagens enviadas pelos clientes. | **Baixo**: Proteger com autenticação/API Key ou remover a rota pública `GET /api/leads`. |
| **C2** | **Ausência Total de Code Splitting / Monólito JS (443 kB gzipped / ~1.8 MB raw)** | [App.js](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/src/App.js#L11-L28) | Todas as páginas (Home, Solutions, Case Studies, Studio, Contact, Websites, Automation, AI, Growth, Privacy, Cookies, Terms) e bibliotecas heavy (Three.js, GSAP, Framer Motion) são importadas estaticamente na rota raiz. | **LCP / INP / TBT**: O browser é forçado a descarregar, fazer parse e compilar todo o código e 3D do site no carregamento da página inicial. | **Baixo**: Substituir por `React.lazy()` e `Suspense` em `App.js`. |
| **C3** | **Preload Agressivo de Vídeos Pesados no Carregamento Inicial** | [HeroBackground.jsx](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/src/components/homepage/Hero/HeroBackground.jsx#L188) | A tag `<video>` tem `preload="auto"`, iniciando o download imediato dos ficheiros MP4/WebM do Hero (10.2 MB / 8.9 MB) no instante do `DOMContentLoaded`. | **LCP / Network Saturation**: Compete directamente com o download do CSS, JS e imagens críticas em ligações mobile. | **Baixo**: Ajustar `preload="metadata"` ou adiar o buffering após os recursos críticos carregarem. |

---

## 3. High Priority

| # | Problema | Ficheiro / Componente | Causa Concreta | Impacto | Risco da Alteração |
|---|---|---|---|---|---|
| **H1** | **ScrollTrigger Pinning Multi-Instância a Provocar CLS** | [Hero.jsx](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/src/components/homepage/Hero/Hero.jsx#L69-L84) e [HeroTimeline.js](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/src/components/homepage/Hero/HeroTimeline.js#L91-L121) | Criação simultânea de dois ScrollTriggers no mesmo container de Hero (`triggerElement`), fazendo injecção tardia de `pin-spacer` no DOM após o render inicial. | **CLS (~0.9)**: Mudança drástica de layout durante a inicialização do JS no client-side. | **Médio**: Unificar a criação da timeline num único ponto com `pinSpacing: true` estável. |
| **H2** | **Atributo `aria-label` Inválido no Elemento `<span>` (LinkedIn)** | [HeroSocials.jsx](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/src/components/homepage/Hero/HeroSocials.jsx#L56) | O LinkedIn (com `href: null`) é renderizado como `<span>` genérico com `aria-label="LinkedIn — em breve"`. | **Acessibilidade / Lighthouse**: Viola a regra W3C ARIA (*aria-label not allowed on span without role*). | **Mínimo**: Alterar para `<button disabled>` ou adicionar `role="img"`. |
| **H3** | **Recursos Bloqueadores de Renderização (Google Fonts)** | [index.html](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/public/index.html#L11-L12) | Carregamento de stylesheets externas do Google Fonts (`Michroma`, `Chakra Petch`, `Rajdhani`) via `<link>` bloqueador sem preconnect completo a `https://fonts.googleapis.com`. | **FCP / LCP**: Retarda a primeira pintura significativa de texto. | **Mínimo**: Adicionar `<link rel="preconnect" href="https://fonts.googleapis.com">`. |
| **H4** | **Modelos 3D Não Otimizados na Memória (550 KB vs 32 KB)** | [DiamondModel.jsx](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/src/components/homepage/DiamondModel.jsx#L10) e [StudioDiamondIntro.jsx](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/src/components/studio/StudioDiamondIntro/StudioDiamondIntro.jsx#L35) | `StudioDiamondIntro.jsx` carrega a versão comprimida Draco `diamond-compressed.glb` (32.3 KB), enquanto a pasta `/models/` tem cópias não comprimidas de 550.8 KB. | **Payload Network / GPU**: Tráfego desnecessário se o ficheiro descomprimido for acedido. | **Mínimo**: Apontar todas as referências para o GLB comprimido. |

---

## 4. Medium Priority

| # | Problema | Ficheiro / Componente | Causa | Impacto | Risco |
|---|---|---|---|---|---|
| **M1** | **Assets Obsoletos e Não Utilizados no Disco (>85 MB)** | Vários em `frontend/public/` | Ficheiros como `base.glb` (31.6 MB), `robot.glb` (1.6 MB), vídeos de diamantes (13.88 MB), vídeos de serviços (21.6 MB) e PNGs gigantes continuam no repositório. | Aumenta o tamanho da build e repositório. | **Nulo** (apenas apagar ficheiros confirmados não utilizados). |
| **M2** | **Componentes Órfãos no Código Fonte** | `PersistentHomeStage.jsx`, `ServicesBackground.jsx`, `FinalLumyoFlow.jsx`, `LogoModel.jsx` | Código antigo/experimental deixado na árvore de pastas de `src/components/`. | Aumenta a complexidade de manutenção. | **Nulo** (manter ou mover para arquivo). |
| **M3** | **Imagens Externas de Terceiros em `data.js`** | [data.js](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/src/data.js#L1-L6) | O ficheiro `data.js` refere imagens hospedadas em `static.prod-images.emergentagent.com`. | Risco de link quebrado se o servidor externo mudar. | **Baixo**. |

---

## 5. Low Priority

| # | Problema | Ficheiro / Componente | Causa | Impacto | Risco |
|---|---|---|---|---|---|
| **L1** | **Dependência `draco3d` em `public/draco/` Não Referenciada** | `public/draco/` | Ficheiros de decoder/encoder Draco (1.7 MB) presentes na pasta pública sem consumo directo. | Espaço em disco em `public/`. | **Nulo**. |
| **L2** | **Pastas Vazias em `public/images/`** | `public/images/Nova pasta`, `backgrounds`, `common`, `homepage`, `fonts` | Diretórios sem qualquer ficheiro. | Lixo estrutural. | **Nulo**. |
| **L3** | **Aviso de Deprecação no Build Node.js** | `craco build` | Uso interno de `fs.F_OK` em dependências do CRACO/Webpack. | Warning estético no console do build. | **Nulo**. |

---

## 6. Core Web Vitals Analysis

| Métrica | Estimada / Medida estaticamente | Causa Principal | Solução Recomendada |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ~4.2s (Mobile) / ~2.6s (Desktop) | Carregamento inicial do vídeo Hero (10.2 MB/6.1 MB) com `preload="auto"` + Monólito JS de 1.8 MB + Google Fonts render-blocking. | Manter a imagem WebP do poster como LCP imediato (`loading="eager"`), adiar o buffering do vídeo até pós-LCP, implementar `React.lazy` para code splitting. |
| **CLS** (Cumulative Layout Shift) | **~0.9** (Confirmado em testes anteriores) | 1. Inserção dinâmica de elementos `pin-spacer` pelo GSAP ScrollTrigger.<br>2. Transição e oscilação entre poster WebP e elemento `<video>`.<br>3. Carregamento de webfonts externas sem `font-display: swap` / dimensões reservadas no CSS. | Reservar espaço estático com `aspect-ratio` no container Hero; consolidar triggers do GSAP; pré-conectar Google Fonts. |
| **INP** (Interaction to Next Paint) | ~220ms | Event listeners de scroll e `pointermove` com cálculos directos no main thread (raycasting e scrubbing de vídeo sem throttling). | Utilizar throttling/debouncing nos listeners e manter tarefas pesadas de WebGL fora do loop principal de input. |
| **TBT** (Total Blocking Time) | ~450ms | Execução contínua de parse/compilação do bundle único JS de 1.8 MB no arranque. | Reduzir o bundle inicial dividindo o código por rotas (*Route-based Code Splitting*). |
| **FCP** (First Contentful Paint) | ~1.8s | Ficheiros CSS e Google Fonts no `<head>` sem `preconnect` optimizado. | Adicionar `<link rel="preconnect" href="https://fonts.googleapis.com">`. |

---

## 7. Hero Performance

O Hero utiliza um vídeo controlado pelo scroll através de *currentTime scrubbing*. A experiência visual actual está **aprovada** e deve ser mantida.

### Diagnóstico do Hero:
1. **Ficheiros e Tamanhos**:
   - Poster: `/images/hero/hero-poster.webp` (607 KB)
   - Desktop MP4: `/videos/hero/hero.mp4` (10.27 MB)
   - Desktop WebM: `/videos/hero/hero.webm` (8.91 MB)
   - Mobile MP4: `/videos/hero/hero-mobile.mp4` (6.11 MB)
   - Mobile WebM: `/videos/hero/hero-mobile.webm` (5.78 MB)
2. **Preload Agressivo**:
   Em `HeroBackground.jsx`, o vídeo possui `preload="auto"`. Isto faz com que em dispositivos móveis, o browser descarregue ~6 MB de vídeo simultaneamente com o JavaScript principal.
3. **Mecanismo de Scrubbing**:
   Em `HeroTimeline.js`, a função `updateVideo()` utiliza `requestAnimationFrame` com interpolação matemática (`smoothing: 0.12` em mobile, `0.22` em desktop). Esta lógica está **muito bem optimizada** para evitar chamadas excessivas e agressivas a `video.currentTime`, prevenindo encravamentos da descodificação de hardware do browser.
4. **Optimizações Seguras (Preservando Animação)**:
   - Alterar `preload="auto"` para `preload="metadata"` ou despoletar a atribuição de `src` após o evento `load` do documento.
   - O poster WebP já é exibido imediatamente, garantindo que o utilizador vê o primeiro frame sem qualquer ecrã preto.

---

## 8. GSAP / ScrollTrigger

### Análise dos Animadores e Triggers:
1. **Triggers Duplicados no Hero**:
   - `createHeroScrollExperience` (em `HeroTimeline.js`) cria um `ScrollTrigger` com `pin: viewportElement`.
   - `createHeroContentExperience` (em `HeroContentTimeline.js`) cria uma `gsap.timeline` com outro `ScrollTrigger` no mesmo `triggerElement`.
   - *Impacto*: Dois observadores independentes a recalcular o mesmo intervalo de scroll.
2. **Will-Change e Compositor GPU**:
   O uso de `will-change` no CSS está contido, prevenindo o esgotamento da memória de textura da GPU.
3. **Blurs e Filtros Pesados**:
   O elemento de fundo em `PersistentHomeStage.jsx` (que não está activo na Home) utiliza `blur-3xl`. Nos componentes activos, os blurs CSS estão devidamente contidos (`backdrop-blur-md`).

---

## 9. Three.js / WebGL / GLB

### Análise dos Cenas 3D:
1. **Cena Principal do Estúdio (`StudioDiamondIntro.jsx`)**:
   - Carrega `/models/diamond/diamond-compressed.glb` (32.3 KB).
   - O uso de memória e a eliminação de geometria estão correctamente tratados.
2. **Cena de Partículas (`FinalLumyoFlow.jsx`)**:
   - Componente **não importado na aplicação**. Contém amostragem de geometria via `MeshSurfaceSampler` com 4500 partículas e cálculos de proximidade no `useFrame`. Como não é renderizado, não consome recursos GPU em runtime, mas o seu código está a ser empacotado no bundle JS principal.
3. **Cenas `DiamondModel.jsx` e `LogoModel.jsx` (Homepage)**:
   - Ambas são componentes **não utilizados** na versão actual da Homepage.
4. **Contextos WebGL Ativos**:
   Na rota `/studio`, existe apenas **1 contexto Canvas WebGL activo**, dentro dos limites seguros para browsers móveis.

---

## 10. Imagens e Assets

### Resumo dos Assets em `public/`:

| Categoria | Ficheiro | Tamanho | Estado no Código | Diagnóstico / Recomendação |
|---|---|---|---|---|
| **Modelo 3D** | `/models/base.glb` | **31.65 MB** | **NÃO UTILIZADO** | Modelo bruto original. Remover do pacote de distribuição. |
| **Modelo 3D** | `/models/robot.glb` | **1.60 MB** | **NÃO UTILIZADO** | Modelo antigo do robô. Remover. |
| **Modelo 3D** | `/models/robot_points.bin` | **192 KB** | **NÃO UTILIZADO** | Ficheiro binário de pontos antigo. Remover. |
| **Modelo 3D** | `/models/diamond.glb` | **550 KB** | **NÃO UTILIZADO** | Ficheiro descomprimido duplicado. Remover. |
| **Modelo 3D** | `/models/diamond/diamond.glb` | **550 KB** | **NÃO UTILIZADO** | Ficheiro descomprimido duplicado. Remover. |
| **Modelo 3D** | `/models/diamond/diamond-compressed.glb` | **32.3 KB** | **UTILIZADO** | Ficheiro comprimido activo no Studio. **MANTER**. |
| **Modelo 3D** | `/models/logo.glb` | **645 KB** | **NÃO UTILIZADO** | Ficheiro associado a `FinalLumyoFlow.jsx` (não usado). |
| **Modelo 3D** | `/models/logo/lumyo-l.glb` | **645 KB** | **NÃO UTILIZADO** | Ficheiro associado a `LogoModel.jsx` (não usado). |
| **Vídeo** | `/videos/diamond/diamond.mp4` | **7.88 MB** | **NÃO UTILIZADO** | Vídeo de teste de diamante. Remover. |
| **Vídeo** | `/videos/diamond/diamond.webm` | **6.02 MB** | **NÃO UTILIZADO** | Vídeo de teste de diamante. Remover. |
| **Vídeo** | `/videos/services/services.mp4` | **9.21 MB** | **NÃO UTILIZADO** | Associado ao `ServicesBackground.jsx` (não usado). |
| **Vídeo** | `/videos/services/services.webm` | **5.92 MB** | **NÃO UTILIZADO** | Associado ao `ServicesBackground.jsx` (não usado). |
| **Vídeo** | `/videos/services/services-mobile.mp4` | **5.78 MB** | **NÃO UTILIZADO** | Associado ao `ServicesBackground.jsx` (não usado). |
| **Vídeo** | `/videos/services/services-mobile.webm` | **713 KB** | **NÃO UTILIZADO** | Associado ao `ServicesBackground.jsx` (não usado). |
| **Imagem** | `/images/hero/hero-background.png` | **6.89 MB** | **NÃO UTILIZADO** | Ficheiro PNG bruto substituído por vídeos/posters WebP. |
| **Imagem** | `/images/hero/hero-background-clean.png` | **830 KB** | **NÃO UTILIZADO** | Ficheiro PNG não referenciado. |
| **Imagem** | `/images/hero/robot-transparent.png` | **686 KB** | **NÃO UTILIZADO** | Ficheiro PNG não referenciado. |
| **Imagem** | `/images/home/ai-creative.png` | **2.62 MB** | **NÃO UTILIZADO** | `HeroContent.jsx` usa a versão WebP (`ai-creative.webp`). |
| **Imagem** | `/images/services/ChatGPT Image...png` | **2.15 MB** | **NÃO UTILIZADO** | Imagem temporária de desenvolvimento. |
| **Imagem** | `/images/services/services-poster.png` | **1.75 MB** | **NÃO UTILIZADO** | `ServicesBackground.jsx` usa a versão WebP. |
| **Imagem** | `/images/brand/lumyo-symbol1.png` | **1.15 MB** | **NÃO UTILIZADO** | Cópia duplicada do símbolo da marca. |
| **Imagem** | `/images/cases/ola/ola-brand1.png` | **908 KB** | **NÃO UTILIZADO** | Cópia duplicada de imagem de case study. |
| **Decoder** | `public/draco/*` (4 ficheiros) | **1.72 MB** | **NÃO UTILIZADO** | Ficheiros de biblioteca Draco não referenciados directamente. |

---

## 11. React / JavaScript

1. **Imports Estáticos Globais**:
   Em `App.js`, todas as rotas secundárias (`Privacy`, `Cookies`, `Terms`, `Websites`, `Automation`, etc.) são carregadas no momento em que a Homepage abre.
2. **Re-renders de Componentes**:
   O estado global de idioma (`LanguageProvider`) invalida os componentes de forma limpa. Não se verificam loops infinitos de re-render.
3. **Código Morto no Bundle**:
   Componentes órfãos como `FinalLumyoFlow.jsx` e `PersistentHomeStage.jsx` são empacotados pela bundler porque mantêm imports de CSS e dependências transversais.

---

## 12. Acessibilidade

### Classificação das Ocorrências:

| Nível | Componente / Ficheiro | Descrição da Ocorrência | Solução Recomendada |
|---|---|---|---|
| **CRÍTICO** | [HeroSocials.jsx](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/src/components/homepage/Hero/HeroSocials.jsx#L56) | Elemento `<span>` do LinkedIn contém `aria-label="LinkedIn — em breve"`. O atributo `aria-label` não é permitido em elementos `<span>` genéricos sem `role`. | Substituir `<span>` por `<button disabled>` ou adicionar `role="img"`. |
| **IMPORTANTE** | [Navbar.jsx](file:///c:/Users/Fernando/OneDrive%20-%20Instituto%20Polit%C3%A9cnico%20do%20Porto/Ambiente%20de%20Trabalho/sitelumyu/frontend/src/components/Navbar.jsx#L100) | O botão de alternância do menu mobile possui `aria-label` e `aria-expanded` corretos. | **Mantido (Correcto)**. |
| **IMPORTANTE** | Vários | Garantir contraste mínimo de texto cinzento (`text-white/60`) sobre fundos escuros em leitores de ecrã. | Rever opacidades de texto secundário. |

---

## 13. SEO

### Estado do SEO (Avaliado como Excelentemente Estruturado):
- **Titles e Meta Descriptions**: Dinâmicos, bem configurados em `SEO.jsx` para todas as páginas em PT e EN.
- **Canonicals**: Configurados com URL absoluto `https://www.lumyo.pt`.
- **Open Graph & Twitter Cards**: Definidos correctamente em `SEO.jsx`.
- **Sitemap.xml**: Contém todas as 12 rotas válidas do website.
- **Robots.txt**: Bem estruturado, permitindo motores de busca e bots de GEO (`OAI-SearchBot`, `Google-Extended`).

---

## 14. Structured Data

### Validação dos Esquemas JSON-LD (`src/seo/schema.js`):
- **Organization Schema**: Válido (`@type: Organization`, `@id: https://www.lumyo.pt/#organization`, logo, área servida, redes sociais).
- **WebSite Schema**: Válido (`@type: WebSite`, idiomas `pt-PT` e `en`).
- **Service Schema**: Gerado dinamicamente para cada serviço.
- **FAQPage Schema**: Estrutura correcta com `Question` e `Answer`.
- **BreadcrumbList Schema**: Válido para a hierarquia de navegação.

---

## 15. GEO / AI Discoverability

### Avaliação de Motores Generativos (ChatGPT, Gemini, Perplexity):
- **Standard / Documentado**:
  - `llms.txt` presente na raiz pública (`public/llms.txt`), com síntese completa e estruturada da empresa, serviços, casos de estudo e URLs em inglês e português.
  - `robots.txt` permite explicitamente `OAI-SearchBot` e `Google-Extended`.
- **Conteúdo Semântico**: As respostas a FAQs e descrições dos pilares utilizam linguagem clara e entidades bem definidas sobre desenvolvimento web, automação e IA em Portugal.

---

## 16. Internationalisation PT/EN

1. **Gestão de Estado**:
   Gerida via `LanguageProvider` em `i18n.js`. Actualiza dinamicamente `document.documentElement.lang` entre `pt-PT` e `en`.
2. **Textos Hardcoded**:
   Praticamente todos os textos das páginas e componentes consomem o dicionário `i18n.js`.
3. **Comportamento de Layout**:
   A troca de idioma altera o comprimento de certas frases (ex: títulos em inglês vs português), contudo o layout em CSS Grid/Flexbox absorve as alterações sem partir o design.

---

## 17. Forms

1. **Página de Contacto (`Contact.jsx`)**:
   - Submete os dados via `POST` para o endpoint de produção `/api/contact`.
   - Inclui validação de email, limitação de caracteres e sanitização HTML contra XSS.
   - Inclui protecção anti-spam *Honeypot* (`website`).
   - Integração funcional com a API do **Resend**.
2. **Formulário da Homepage (`PersistentHomeStage.jsx`)**:
   - **Problema de Negócio**: O formulário apenas simula o envio com `setTimeout(..., 800)` e **não envia qualquer email nem chama a API**. Se a `PersistentHomeStage` for utilizada no futuro, este formulário perderá todas as mensagens dos clientes.

---

## 18. Segurança

1. **Secrets no Frontend**:
   - Não foram encontrados segredos ou chaves privadas expostas nos ficheiros do frontend. `process.env.RESEND_API_KEY` é consumido exclusivamente em ambiente serverless (`api/contact.js`) ou backend Python (`server.py`).
2. **Vulnerabilidade de API no Backend (`server.py`)**:
   - A rota `GET /api/leads` devolve **todos os dados de contactos em formato JSON sem autenticação**. Deve ser removida ou protegida por chave de administração.
3. **XSS / DangerouslySetInnerHTML**:
   - O uso de `dangerouslySetInnerHTML` não foi detectado no código principal. A sanitização de inputs nos formulários está implementada com escape de caracteres HTML.

---

## 19. Unused Files — Tabela Completa de Classificação

| Ficheiro | Tipo | Evidência | Confiança | Recomendação |
|---|---|---|---|---|
| `public/models/base.glb` | Modelo 3D | 31.65 MB. Apenas referenciado num script externo Python `scripts/extract_points.py`. | **CONFIRMADO NÃO UTILIZADO** | Remover de `public/models/`. |
| `public/models/robot.glb` | Modelo 3D | 1.60 MB. Sem qualquer importação no código `src`. | **CONFIRMADO NÃO UTILIZADO** | Remover de `public/models/`. |
| `public/models/robot_points.bin` | Dados 3D | 192 KB. Sem qualquer importação em `src`. | **CONFIRMADO NÃO UTILIZADO** | Remover de `public/models/`. |
| `public/models/diamond.glb` | Modelo 3D | 550 KB. O Studio carrega `diamond-compressed.glb`. | **CONFIRMADO NÃO UTILIZADO** | Remover de `public/models/`. |
| `public/models/diamond/diamond.glb` | Modelo 3D | 550 KB. Duplicado não comprimido. | **CONFIRMADO NÃO UTILIZADO** | Remover de `public/models/diamond/`. |
| `public/models/logo.glb` | Modelo 3D | 645 KB. Usado apenas no componente órfão `FinalLumyoFlow.jsx`. | **CONFIRMADO NÃO UTILIZADO** | Remover se `FinalLumyoFlow` for descartado. |
| `public/models/logo/lumyo-l.glb` | Modelo 3D | 645 KB. Usado apenas no componente órfão `LogoModel.jsx`. | **CONFIRMADO NÃO UTILIZADO** | Remover. |
| `public/videos/diamond/diamond.mp4` | Vídeo | 7.88 MB. Nenhuma referência no código fonte. | **CONFIRMADO NÃO UTILIZADO** | Remover de `public/videos/diamond/`. |
| `public/videos/diamond/diamond.webm` | Vídeo | 6.02 MB. Nenhuma referência no código fonte. | **CONFIRMADO NÃO UTILIZADO** | Remover de `public/videos/diamond/`. |
| `public/videos/services/services.mp4` | Vídeo | 9.21 MB. Usado apenas no componente órfão `ServicesBackground.jsx`. | **CONFIRMADO NÃO UTILIZADO** | Remover se `ServicesBackground` for descartado. |
| `public/videos/services/services.webm` | Vídeo | 5.92 MB. Usado apenas no componente órfão `ServicesBackground.jsx`. | **CONFIRMADO NÃO UTILIZADO** | Remover. |
| `public/videos/services/services-mobile.mp4` | Vídeo | 5.78 MB. Usado apenas no componente órfão `ServicesBackground.jsx`. | **CONFIRMADO NÃO UTILIZADO** | Remover. |
| `public/videos/services/services-mobile.webm` | Vídeo | 713 KB. Usado apenas no componente órfão `ServicesBackground.jsx`. | **CONFIRMADO NÃO UTILIZADO** | Remover. |
| `public/images/hero/hero-background.png` | Imagem | 6.89 MB. Ficheiro PNG bruto substituído por vídeos/posters WebP. | **CONFIRMADO NÃO UTILIZADO** | Remover de `public/images/hero/`. |
| `public/images/hero/hero-background-clean.png` | Imagem | 830 KB. Ficheiro PNG não referenciado. | **CONFIRMADO NÃO UTILIZADO** | Remover. |
| `public/images/hero/robot-transparent.png` | Imagem | 686 KB. Ficheiro PNG não referenciado. | **CONFIRMADO NÃO UTILIZADO** | Remover. |
| `public/images/home/ai-creative.png` | Imagem | 2.62 MB. `HeroContent.jsx` usa a versão WebP (`ai-creative.webp`). | **CONFIRMADO NÃO UTILIZADO** | Remover PNG bruto. |
| `public/images/services/ChatGPT Image...png` | Imagem | 2.15 MB. Imagem temporária de desenvolvimento. | **CONFIRMADO NÃO UTILIZADO** | Remover. |
| `public/images/services/services-poster.png` | Imagem | 1.75 MB. `ServicesBackground.jsx` usa a versão WebP. | **CONFIRMADO NÃO UTILIZADO** | Remover PNG. |
| `public/images/brand/lumyo-symbol1.png` | Imagem | 1.15 MB. Cópia duplicada do símbolo da marca. | **CONFIRMADO NÃO UTILIZADO** | Remover. |
| `public/images/cases/ola/ola-brand1.png` | Imagem | 908 KB. Cópia duplicada de imagem de case study. | **CONFIRMADO NÃO UTILIZADO** | Remover. |
| `src/components/homepage/PersistentHomeStage.jsx` | Componente | 31.3 KB. Não é importado por `Home.jsx` nem por qualquer outra página. | **CONFIRMADO NÃO UTILIZADO** | Arquivar ou remover de `src/components/homepage/`. |
| `src/components/homepage/PersistentHomeTimeline.js` | Utilitário GSAP | 3.8 KB. Usado exclusivamente por `PersistentHomeStage.jsx`. | **CONFIRMADO NÃO UTILIZADO** | Arquivar ou remover. |
| `src/components/homepage/ServicesBackground.jsx` | Componente | 5.7 KB. Não é importado por nenhuma página. | **CONFIRMADO NÃO UTILIZADO** | Arquivar ou remover. |
| `src/components/homepage/FinalLumyoFlow.jsx` | Componente 3D | 20.1 KB. Não é importado por nenhuma página. | **CONFIRMADO NÃO UTILIZADO** | Arquivar ou remover. |
| `src/components/homepage/FinalLumyoFlow.css` | Estilo CSS | 377 B. Usado apenas por `FinalLumyoFlow.jsx`. | **CONFIRMADO NÃO UTILIZADO** | Arquivar ou remover. |
| `src/components/homepage/LogoModel.jsx` | Componente 3D | 1.1 KB. Não é importado por nenhuma página. | **CONFIRMADO NÃO UTILIZADO** | Arquivar ou remover. |
| `src/components/homepage/DiamondModel.jsx` | Componente 3D | 1.8 KB. `Studio.jsx` usa o seu próprio componente interno `DiamondModel`. | **CONFIRMADO NÃO UTILIZADO** | Arquivar ou remover. |
| `public/draco/*` (4 ficheiros) | Decoder 3D | 1.72 MB. O loader do Drei descarrega decoders via CDN por padrão se não configurado localmente. | **PROVAVELMENTE NÃO UTILIZADO** | Validar se o Drei consome localmente antes de apagar. |

---

## 20. Unused Dependencies

| Dependência | Utilização Encontrada | Confiança | Recomendação |
|---|---|---|---|
| `@gltf-transform/cli` (devDependency) | Apenas scripts CLI externos para optimizar modelos GLB offline. | **PROVAVELMENTE NÃO UTILIZADA EM PROD** | Manter em devDependencies se ainda for necessário converter modelos GLB no futuro. |
| `resend` (dependency) | Usada na API Route serverless `frontend/api/contact.js` e em `backend/server.py`. | **UTILIZADA** | **MANTER**. |
| `three` & `@react-three/fiber` & `@react-three/drei` | Usadas em `StudioDiamondIntro.jsx` no Estúdio. | **UTILIZADA** | **MANTER**. |
| `gsap` & `framer-motion` | Usadas nas animações principais de Hero e Páginas. | **UTILIZADA** | **MANTER**. |

---

## 21. Duplicates / Legacy Files

1. **Duplicação de Modelos 3D**:
   - `/models/diamond.glb` (550 KB) e `/models/diamond/diamond.glb` (550 KB) são cópias idênticas e descomprimidas do ficheiro `/models/diamond/diamond-compressed.glb` (32 KB).
   - `/models/logo.glb` (645 KB) e `/models/logo/lumyo-l.glb` (645 KB) são cópias idênticas.
2. **Duplicação de Imagens PNG / WebP**:
   - `ai-creative.png` (2.62 MB) e `ai-creative.webp` (242 KB).
   - `services-poster.png` (1.75 MB) e `services-poster.webp` (353 KB).
   - `lumyo-symbol.png` e `lumyo-symbol1.png`.

---

## 22. Safe Cleanup Candidates

Se for aprovada a limpeza futura do projecto, os seguintes ficheiros e pastas **podem ser removidos com segurança total**, sem qualquer impacto no funcionamento ou visual do website activo:

1. `public/models/base.glb` (31.65 MB)
2. `public/models/robot.glb` (1.60 MB)
3. `public/models/robot_points.bin` (192 KB)
4. `public/models/diamond.glb` (550 KB)
5. `public/models/diamond/diamond.glb` (550 KB)
6. `public/models/logo.glb` (645 KB)
7. `public/models/logo/lumyo-l.glb` (645 KB)
8. `public/videos/diamond/` (todos os 2 ficheiros — 13.88 MB)
9. `public/videos/services/` (todos os 4 ficheiros — 21.60 MB)
10. `public/images/hero/hero-background.png` (6.89 MB)
11. `public/images/hero/hero-background-clean.png` (830 KB)
12. `public/images/hero/robot-transparent.png` (686 KB)
13. `public/images/home/ai-creative.png` (2.62 MB)
14. `public/images/services/ChatGPT Image...png` (2.15 MB)
15. `public/images/services/services-poster.png` (1.75 MB)
16. `public/images/brand/lumyo-symbol1.png` (1.15 MB)
17. `public/images/cases/ola/ola-brand1.png` (908 KB)
18. Pastas vazias: `public/images/Nova pasta`, `public/images/backgrounds`, `public/images/common`, `public/images/homepage`, `public/fonts`
19. Componentes órfãos em `src/components/homepage/`: `PersistentHomeStage.jsx`, `PersistentHomeTimeline.js`, `ServicesBackground.jsx`, `FinalLumyoFlow.jsx`, `FinalLumyoFlow.css`, `LogoModel.jsx`, `DiamondModel.jsx`.

*Total de Poupança em Disco / Deploy*: **~88.5 MB**.

---

## 23. Recommended Actions

### MUST FIX (Correcções Obrigatórias Antes de Produção)
1. **Proteger ou Remover a Rota `/api/leads`** em `backend/server.py` para prevenir vazamento de dados pessoais de clientes (RGPD).
2. **Corrigir o Atributo ARIA no LinkedIn** em `HeroSocials.jsx` (substituir `<span>` por `<button disabled>` ou adicionar `role="img"`).
3. **Implementar Code Splitting por Rotas** em `App.js` usando `React.lazy()` para isolar as páginas secundárias e reduzir o bundle inicial de 1.8 MB.

### SHOULD FIX (Melhorias com Benefício Claro e Baixo Risco)
1. **Ajustar Preload do Vídeo Hero**: Alterar de `preload="auto"` para `preload="metadata"` em `HeroBackground.jsx` para libertar largura de banda no primeiro segundo de carregamento.
2. **Preconnect ao Google Fonts**: Adicionar `<link rel="preconnect" href="https://fonts.googleapis.com">` no `index.html`.
3. **Remover Assets Confirmados Não Utilizados**: Eliminar os ~88.5 MB de ficheiros não referenciados listados na Secção 22.

### OPTIONAL (Optimizações a Considerar)
1. **Refactor de ScrollTrigger no Hero**: Consolidar a criação dos ScrollTriggers de vídeo e conteúdo num único bloco para estabilizar os cálculos de `pinSpacing` e reduzir micro-deslocamentos de layout.
2. **Mover Referência de Imagem Externa em `data.js`**: Descarregar a imagem de diamante hospedada externamente e servi-la localmente a partir de `public/images/`.

### DO NOT TOUCH (Manter Intacto)
1. **Animação de Scrubbing de Vídeo do Hero**: Lógica em `HeroTimeline.js` com `requestAnimationFrame` e interpolação adaptativa (Desktop/Mobile). Está aprovada e funciona com suavidade excelente.
2. **Design e Efeitos Visuais**: Gradientes, partículas, blurs, tipografia, Three.js no Estúdio e paleta de cores.
