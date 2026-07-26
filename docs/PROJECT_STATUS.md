# PROJECT_STATUS.md

# Lumyo Website

## Estado Geral

**Versão:** 0.0.1

**Estado do Projeto:** Em desenvolvimento

---

# Documentação

| Documento | Estado |
|-----------|--------|
| 00_PROJECT_VISION.md | ✅ |
| 01_EXPERIENCE_ENGINE.md | ✅ |
| 02_STORYBOARD.md | ✅ |
| 03_ASSET_PIPELINE.md | ✅ |
| 04_GLB_PIPELINE.md | ✅ |
| 05_TECHNICAL_ARCHITECTURE.md | ✅ |
| 06_SCROLL_TIMELINE.md | ✅ |
| CHANGELOG.md | ✅ |
| DECISIONS.md | ✅ |
| KNOWN_ISSUES.md | ✅ |

---

# Sprints

| Sprint | Nome | Estado |
|---------|------|--------|
| Sprint 0 | Foundation & Legacy Isolation | ✅ Concluído |
| Sprint 1 | Experience Engine Bootstrap | ⏳ Em preparação |
| Sprint 2 | Resource Manager & GLB Loader | ⬜ |
| Sprint 3 | Scroll Timeline | ⬜ |
| Sprint 4 | Particle Engine | ⬜ |
| Sprint 5 | Fiber Engine | ⬜ |
| Sprint 6 | Robot Reconstruction | ⬜ |
| Sprint 7 | Card Builder | ⬜ |
| Sprint 8 | Logo Morph | ⬜ |
| Sprint 9 | Diamond | ⬜ |
| Sprint 10 | Galaxy | ⬜ |

---

# Sprint Atual

## Sprint 0 — Foundation & Legacy Isolation

### Estado

✅ Concluído

### Objetivos alcançados

- Criada a estrutura base do Experience Engine.
- Criados os controladores principais.
- Criado o ResourceManager.
- Criado o ExperienceProvider.
- Criado o ExperienceContext.
- Criada a estrutura modular definida na documentação.
- Mantida compatibilidade com o código Legacy.
- Nenhuma alteração visual ao website.

---

# Próximo Sprint

## Sprint 1 — Experience Engine Bootstrap

Objetivo:

Montar o Experience Engine dentro da aplicação, criar o Canvas principal e estabelecer a ligação entre:

Browser

↓

ScrollController

↓

TimelineController

↓

StateMachine

↓

ExperienceEngine

Sem introduzir ainda partículas, morphs, shaders ou lógica visual.

---

# Estado Geral

A documentação encontra-se estabilizada.

A arquitetura base foi criada.

O projeto está preparado para iniciar o desenvolvimento do novo Experience Engine.