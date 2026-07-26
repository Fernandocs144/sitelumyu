# 05_TECHNICAL_ARCHITECTURE.md

# Technical Architecture

## Objetivo

Este documento define a arquitetura técnica do Experience Engine.

O objetivo é garantir uma separação clara de responsabilidades, elevada reutilização de código e facilidade de manutenção.

Nenhum sistema deve assumir responsabilidades de outro sistema.

A arquitetura deve privilegiar simplicidade, modularidade e performance.

---

# Arquitetura Geral

A experiência é composta por vários sistemas independentes que colaboram entre si.

```text
Application

↓

Experience Engine

↓

State Machine

↓

Timeline Controller

↓

Scroll Controller

↓

Scene Manager

↓

Systems

↓

Renderer
```

Cada sistema possui apenas uma responsabilidade.

---

# Experience Engine

É o ponto central da experiência.

Responsabilidades:

- inicializar todos os sistemas;
- gerir o ciclo de vida da experiência;
- coordenar os diferentes módulos;
- distribuir eventos;
- controlar o estado global.

Nunca deve conter lógica de partículas, shaders ou animações específicas.

---

# State Machine

Responsável pelo estado atual da narrativa.

Exemplo:

Robot

↓

Dissolve

↓

Fiber

↓

Cards

↓

Logo

↓

Diamond

↓

Galaxy

Todos os sistemas consultam a State Machine.

Nunca criam estados próprios.

---

# Timeline Controller

Converte o progresso da narrativa em estados contínuos.

Responsabilidades:

- controlar transições;
- interpolar valores;
- sincronizar sistemas;
- expor progresso normalizado.

Nunca conhece detalhes de renderização.

---

# Scroll Controller

Única fonte oficial do scroll.

Responsabilidades:

- ler o scroll do utilizador;
- normalizar valores;
- suavizar movimento;
- informar a Timeline.

Nenhum outro sistema deve ler diretamente o scroll da página.

---

# Scene Manager

Responsável pela cena Three.js.

Responsabilidades:

- Scene;
- Camera;
- Renderer;
- Lights;
- Environment;
- Resize.

Nunca contém lógica narrativa.

---

# Systems

Cada sistema executa apenas uma função.

Exemplos:

Particle System

Fiber System

Robot System

Card System

Logo System

Diamond System

Galaxy System

Todos recebem informação da Timeline.

Nunca comunicam diretamente entre si.

---

# Particle System

Responsável apenas pelas partículas.

Inclui:

- buffers;
- atributos;
- atualização GPU;
- cores;
- tamanhos;
- visibilidade.

Não conhece scroll.

Não conhece estados.

---

# Fiber System

Responsável pela fibra digital.

Inclui:

- geração;
- curvas;
- fluxo;
- transporte de energia;
- comportamento.

Não cria cartões.

Não controla narrativa.

---

# Morph System

Responsável pelas transformações.

Exemplos:

Robot → Fiber

Fiber → Card

Fiber → Logo

Logo → Diamond

Diamond → Galaxy

Todo o código de morph deve existir aqui.

---

# Card System

Responsável pelos cartões da homepage.

Inclui:

- construção;
- dissolução;
- sincronização com a fibra.

Nunca aparecem através de fade.

---

# Logo System

Responsável apenas pelo "L" da Lumyo.

Inclui:

- construção;
- estabilização;
- cristalização.

---

# Diamond System

Responsável apenas pelo diamante.

Inclui:

- formação;
- energia;
- brilho;
- explosão.

---

# Galaxy System

Responsável pela cena final.

Inclui:

- órbitas;
- partículas;
- movimento contínuo;
- estado final.

---

# Shader Layer

Todos os shaders pertencem a uma camada independente.

Os sistemas utilizam shaders.

Nunca implementam shaders internamente.

---

# Asset Layer

Todos os assets são carregados apenas uma vez.

Os sistemas recebem referências.

Nunca carregam ficheiros diretamente.

---

# Event Flow

A comunicação deve seguir apenas esta direção.

```text
Browser

↓

Scroll Controller

↓

Timeline Controller

↓

State Machine

↓

Experience Engine

↓

Systems

↓

Renderer
```

Nunca utilizar comunicação inversa.

Nunca criar dependências circulares.

---

# Responsabilidades

Cada módulo deve responder apenas a uma pergunta.

Experience Engine

"Quem coordena tudo?"

State Machine

"Em que estado estamos?"

Timeline

"Quanto falta?"

Scroll

"Quanto scroll existe?"

Particle System

"Como se comportam as partículas?"

Fiber System

"Como se comporta a fibra?"

Morph System

"Como ocorre a transformação?"

Renderer

"Como desenhar tudo?"

---

# Regras

Nunca:

- misturar responsabilidades;
- criar dependências circulares;
- aceder diretamente ao scroll fora do Scroll Controller;
- carregar assets em múltiplos sistemas;
- colocar lógica narrativa dentro dos shaders.

Sempre:

- utilizar módulos independentes;
- reutilizar código;
- manter responsabilidades únicas;
- privilegiar composição em vez de duplicação.

---

# Filosofia

Cada sistema deve poder ser removido, substituído ou evoluído sem obrigar a alterações profundas nos restantes módulos.

Uma arquitetura modular é um requisito fundamental deste projeto.