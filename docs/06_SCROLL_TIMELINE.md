# 06_SCROLL_TIMELINE.md

# Scroll Timeline

## Objetivo

Este documento define como o scroll controla a experiência.

O utilizador nunca muda diretamente de secção.

O scroll apenas controla a evolução da narrativa.

A Timeline é a única responsável por decidir o estado atual da experiência.

---

# Filosofia

A homepage representa uma única linha temporal.

Cada posição do scroll corresponde a um momento dessa narrativa.

Todos os sistemas utilizam a mesma Timeline.

Nunca devem existir timelines independentes.

---

# Fluxo

```text
Scroll

↓

Scroll Controller

↓

Normalized Progress (0 → 1)

↓

Timeline Controller

↓

Current State

↓

Experience Engine

↓

Systems
```

---

# Scroll

O scroll apenas fornece um valor contínuo.

Exemplo:

```text
0.000

↓

0.153

↓

0.417

↓

0.682

↓

1.000
```

Este valor nunca deve conter lógica da experiência.

---

# Progress

Todo o progresso deve ser normalizado.

```text
0.0 = início

1.0 = fim
```

Nenhum sistema deve depender de pixels.

Nunca utilizar:

```javascript
scrollY > 2500
```

Sempre utilizar:

```text
progress = 0.42
```

---

# Timeline

A Timeline divide a narrativa em estados.

## Estado 01

Progress

0.00 → 0.10

Robot

---

## Estado 02

0.10 → 0.20

Robot Dissolve

---

## Estado 03

0.20 → 0.35

Digital Fiber

---

## Estado 04

0.35 → 0.45

Premium Websites

---

## Estado 05

0.45 → 0.55

Automation

---

## Estado 06

0.55 → 0.65

Artificial Intelligence

---

## Estado 07

0.65 → 0.78

Solutions

---

## Estado 08

0.78 → 0.88

Lumyo Logo

---

## Estado 09

0.88 → 0.96

Diamond

---

## Estado 10

0.96 → 1.00

Galaxy

---

# Transições

Os estados nunca mudam instantaneamente.

Cada estado possui uma zona de transição.

Exemplo:

```text
Robot

↓

Dissolve

↓

Fiber
```

Durante essa transição ambos os estados coexistem.

Nunca existe um corte brusco.

---

# Overlap

Cada estado pode sobrepor-se ao seguinte.

Exemplo:

```text
35%

Robot termina

38%

Fiber aparece

42%

Robot desaparece completamente
```

Esta sobreposição torna a experiência contínua.

---

# Interpolação

Todos os sistemas devem trabalhar por interpolação.

Exemplos:

- posição;
- escala;
- opacidade;
- intensidade;
- energia;
- emissão;
- partículas.

Nunca utilizar mudanças instantâneas.

---

# Eventos

A Timeline pode emitir eventos.

Exemplos:

```text
Robot Started

Robot Dissolving

Fiber Active

Card Building

Card Destroying

Logo Forming

Diamond Crystalized

Galaxy Started
```

Os sistemas reagem a estes eventos.

Nunca os criam autonomamente.

---

# Reversibilidade

A Timeline deve funcionar em ambas as direções.

Se o utilizador subir o scroll:

Galaxy

↓

Diamond

↓

Logo

↓

Fiber

↓

Robot

Todas as transições devem funcionar corretamente em forward e reverse.

---

# Independência

Os sistemas nunca devem perguntar:

"Estamos na secção dos cartões?"

Devem perguntar apenas:

"Qual é o progresso da Timeline?"

ou

"Qual é o estado atual?"

---

# Performance

A Timeline deve calcular apenas:

- estado atual;
- progresso do estado;
- progresso global.

Toda a lógica pesada pertence aos sistemas.

---

# Extensibilidade

Novos estados podem ser adicionados.

Exemplo:

```text
Robot

↓

Fiber

↓

Cloud

↓

AI

↓

Logo

↓

Diamond

↓

Galaxy
```

A arquitetura deve permitir acrescentar estados sem reescrever os existentes.

---

# Regras

Nunca:

- utilizar pixels como referência;
- criar múltiplas timelines;
- sincronizar sistemas manualmente;
- utilizar timers para controlar a narrativa.

Sempre:

- utilizar progresso normalizado;
- interpolar valores;
- permitir reversibilidade;
- manter todos os sistemas sincronizados através da mesma Timeline.

---

# Filosofia

O scroll não controla animações.

O scroll controla o tempo.

A Timeline transforma esse tempo numa narrativa contínua.

Todos os sistemas devem seguir essa narrativa.