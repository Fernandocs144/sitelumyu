# HOMEPAGE_EXPERIENCE_ARCHITECTURE.md

# Lumyo Homepage Experience Architecture
Version 1.0

---

# Introdução

A Homepage da Lumyo não é um website tradicional.

Também não é apenas uma Landing Page.

É uma experiência visual que conta uma história.

O utilizador não percorre apenas conteúdo.

O utilizador acompanha a transformação da energia desde a sua origem até ao núcleo da plataforma.

Toda a Homepage é construída em torno desta narrativa.

---

# Filosofia

Existem milhares de websites com:

- partículas
- gradientes
- glow
- scroll animations
- efeitos 3D

A Lumyo não pretende competir através desses elementos.

O elemento diferenciador da Lumyo são as fibras óticas.

As fibras representam:

- energia
- informação
- inteligência
- ligação
- transformação

Toda a Homepage deve existir como consequência do movimento dessas fibras.

Nunca o contrário.

---

# Conceito

A Homepage conta apenas uma história.

Robot

↓

Transformação

↓

Fibras

↓

Construção

↓

Sistema Lumyo

↓

Diamante

Não existem elementos independentes.

Tudo nasce desta sequência.

---

# Narrativa Completa

## Estado 1

Existe apenas o Robot.

O Robot encontra-se totalmente sólido.

Não existem fibras.

Não existem cartões.

Não existe interface.

Existe apenas potencial.

---

## Estado 2

Ao iniciar o scroll,

o Robot começa lentamente a transformar-se.

A região cervical inicia a transformação.

Os cabos físicos tornam-se fibras óticas.

A transformação deve parecer natural.

Nunca explosiva.

Nunca mágica.

---

## Estado 3

As fibras abandonam o Robot.

Inicialmente permanecem agrupadas.

Movem-se como um feixe único.

Apenas gradualmente começam a separar-se.

O movimento inspira-se diretamente na referência em vídeo.

---

## Estado 4

As fibras percorrem a Homepage.

Não seguem trajetórias aleatórias.

Cada fibra possui um destino.

O percurso das fibras constrói visualmente a interface.

---

## Estado 5

Sempre que um grupo de fibras atinge uma zona da Homepage,

essa zona nasce.

Nenhum componente aparece autonomamente.

Todos os componentes são consequência direta da chegada das fibras.

---

## Estado 6

Após construir toda a Homepage,

as fibras convergem.

Toda a energia acumulada dirige-se ao Diamante.

---

## Estado 7

O Diamante recebe toda a energia.

Não surge do nada.

É construído pela convergência das fibras.

Representa o núcleo tecnológico da Lumyo.

---

# Regra Principal

Nenhum elemento da Homepage pode aparecer por iniciativa própria.

Tudo deve surgir porque as fibras chegaram até esse ponto.

Esta regra nunca poderá ser quebrada.

---

# Estrutura Visual

Layer 0

Background Hero (PNG)

Imagem estática.

Inclui:

- iluminação
- robot
- atmosfera
- gradientes

Não deve ser recriada em CSS.

---

Layer 1

Neblina

Muito subtil.

Serve apenas para aumentar profundidade.

---

Layer 2

Optical Fiber Engine

Elemento principal da Homepage.

Responsável por toda a narrativa.

---

Layer 3

Componentes React

Headline

CTA

Cards

Our Solutions

Diamond

Todos dependem do Fiber Engine.

---

Layer 4

Micro Effects

Reflexos

Glow

Glass

Pequenas respostas luminosas

Nunca protagonistas.

---

# Fiber Engine

O Fiber Engine é o coração da Homepage.

Todas as animações dependem dele.

Nunca o contrário.

---

# Estrutura das Fibras

As fibras:

nascem agrupadas

↓

movem-se em conjunto

↓

abrem lentamente

↓

cada uma possui pequenas diferenças

↓

convergem novamente

Nunca devem parecer linhas SVG independentes.

Devem parecer um cabo físico composto por centenas de fibras.

---

# Movimento

Referência obrigatória:

vídeo aprovado.

Características:

movimento lento

orgânico

fluido

leve

natural

Nunca:

robótico

mecânico

caótico

---

# Luz

A luz encontra-se principalmente nas pontas.

As fibras devem permanecer discretas.

O olhar acompanha naturalmente os pontos luminosos.

---

# Scroll

O scroll controla apenas uma variável.

Progress.

Progress:

0

↓

1

Todo o restante sistema reage a este valor.

---

# Construção dos Componentes

Cada componente possui um ponto de ativação.

Exemplo.

Progress

↓

fibra chega

↓

componente nasce

↓

fibra continua

Nunca:

scroll

↓

fade in

---

# Hero

As fibras percorrem a Hero.

Passam sempre atrás do conteúdo.

Nunca reduzem legibilidade.

---

# CTA

O botão responde apenas quando as fibras passam.

Nunca possui animações permanentes.

---

# Cards

Os cartões são construídos pelas fibras.

Primeiro chega a fibra.

Depois:

glass

↓

conteúdo

↓

ícone

↓

texto

Nunca aparecem instantaneamente.

---

# Formação do L

O famoso L não é um layout.

É uma consequência do percurso das fibras.

As fibras definem a composição.

Nunca o contrário.

---

# Our Solutions

As fibras dividem-se.

Cada solução recebe parte da energia.

Todas continuam ligadas.

---

# Diamante

O Diamante não gera energia.

Recebe energia.

As fibras entram.

Desaparecem.

O núcleo ilumina-se.

O Diamante ganha vida.

---

# Tecnologia

Robot

PNG de alta resolução.

Background

PNG.

Fiber Engine

Arquitetura híbrida.

Zona do Robot:

Three.js apenas para o morph inicial (Robot → Fibras), se a complexidade justificar.

Percurso da Homepage:

SVG ou Canvas controlado por GSAP ScrollTrigger.

Microanimações:

Framer Motion.

Three.js apenas será utilizado novamente na zona final caso o Diamante necessite de um morph semelhante.

O objetivo é usar cada tecnologia apenas onde ela oferece uma vantagem clara.

---

# Performance

A Homepage deve manter 60 FPS.

Evitar animações permanentes.

Evitar cálculos desnecessários.

O Fiber Engine deve ser o único sistema complexo.

Todo o restante deve permanecer leve.

---

# Identidade

O utilizador deverá recordar-se de apenas uma coisa:

"Existe um feixe de fibras óticas que constrói toda a Homepage."

Se recordar apenas disso,

a Homepage cumpriu o seu objetivo.

---

# Regra Final

Sempre que surgir uma nova funcionalidade,

deve responder-se primeiro à seguinte pergunta:

"Esta funcionalidade nasce naturalmente das fibras?"

Se a resposta for não,

essa funcionalidade não pertence à Homepage.