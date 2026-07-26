# Decisões Arquiteturais

---

## 2026-07-26

### Experiência

A homepage é uma narrativa contínua.

Nunca existem secções independentes.

---

### Scroll

O scroll controla apenas a Timeline.

Nunca controla diretamente animações.

---

### GLB

Os modelos GLB são a fonte oficial de geometria.

Na maioria dos casos não são renderizados diretamente.

São utilizados para gerar partículas e morph targets.

---

### Fibra

A fibra digital é a entidade principal da experiência.

Todos os elementos importantes nascem e regressam à fibra.

---

### Desenvolvimento

Todo o projeto será desenvolvido por sprints pequenos.

Nenhum sprint deve implementar funcionalidades de sprints futuros.