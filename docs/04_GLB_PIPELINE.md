# 04_GLB_PIPELINE.md

# GLB Pipeline

## Objetivo

Este documento define como todos os modelos 3D (.glb) devem ser utilizados dentro do Experience Engine.

Os modelos GLB representam apenas a geometria base da experiência.

Na maioria dos casos, não devem ser renderizados diretamente.

Devem ser utilizados como fonte de dados para partículas, fibras, morph targets e outras transformações.

---

# Localização dos Modelos

Todos os modelos 3D encontram-se obrigatoriamente na seguinte pasta:

```text
frontend/public/models/
```

Esta pasta é a única fonte oficial de modelos 3D do projeto.

Nenhum modelo deve ser carregado a partir de outra localização sem atualização desta documentação.

---

# Carregamento

Todos os modelos devem ser carregados através do GLTFLoader.

Exemplo:

```text
/public/models/robot.glb
/public/models/lumyo_logo.glb
/public/models/diamond.glb
```

Os caminhos devem ser sempre relativos à pasta `public`.

Nunca utilizar caminhos absolutos.

---

# Inventário de Modelos

Cada novo modelo adicionado ao projeto deve ser registado.

Exemplo:

| Modelo | Função | Estado |
|---------|---------|--------|
| robot.glb | Hero inicial | Ativo |
| lumyo_logo.glb | Formação do logótipo | Ativo |
| diamond.glb | Cristalização final | Ativo |
| brain.glb | Futuro | Não utilizado |
| satellite.glb | Futuro | Não utilizado |

---

# Pipeline Geral

Todos os modelos devem seguir o mesmo ciclo de vida.

```text
GLB

↓

GLTFLoader

↓

Scene

↓

Mesh

↓

Geometry

↓

Surface Sampling

↓

Point Cloud

↓

Particle Buffer

↓

Morph Target

↓

Experience Engine
```

Este pipeline deve ser reutilizado por todos os modelos.

---

# Renderização Direta

Por defeito:

Os modelos **não devem ser renderizados diretamente**.

O Experience Engine deverá trabalhar preferencialmente sobre:

- Point Clouds
- Particle Systems
- Fiber Systems
- Morph Targets

A renderização direta apenas é permitida quando existir uma justificação técnica ou artística.

---

# Surface Sampling

Sempre que um modelo precisar de ser convertido em partículas deve ser utilizado um algoritmo de Surface Sampling.

O objetivo é distribuir partículas uniformemente pela superfície do modelo.

Nunca gerar partículas apenas pelos vértices da malha.

---

# Point Clouds

Todos os modelos devem poder ser convertidos para Point Clouds.

Uma Point Cloud representa a geometria através de milhares de pontos.

Essa representação será utilizada para:

- dissoluções;
- morphs;
- construção de objetos;
- explosões;
- transições.

---

# Morph Targets

Os modelos devem ser compatíveis entre si.

Sempre que possível deverão possuir o mesmo número de partículas.

Isto permite criar transições suaves entre:

Robot

↓

Fibra

↓

Logótipo

↓

Diamante

↓

Galáxia

sem necessidade de recriar buffers.

---

# Buffer Reutilizável

Os buffers de partículas devem ser criados apenas uma vez.

Nunca recriar:

- posições;
- cores;
- índices;
- atributos;

durante o render loop.

Todas as alterações devem ocorrer através da atualização dos atributos existentes.

---

# Materiais

Sempre que possível utilizar:

- ShaderMaterial
- Custom GLSL
- GPU Animation

Evitar materiais genéricos quando a identidade visual exigir comportamento personalizado.

---

# Animações

As animações nunca devem depender do modelo.

O GLB fornece apenas a geometria.

Toda a animação deve ser controlada pelo Experience Engine.

---

# Escalas

Cada modelo deve possuir uma escala consistente.

Evitar compensações de escala espalhadas pelo código.

Se um modelo necessitar de correção:

- aplicar uma única transformação durante o carregamento;
- reutilizar sempre essa versão.

---

# Novos Modelos

Sempre que for adicionado um novo GLB devem ser definidos:

- função narrativa;
- estado de utilização;
- possibilidade de morph;
- possibilidade de conversão para partículas;
- necessidade de renderização direta;
- escala de referência.

---

# Regras Absolutas

Nunca:

- renderizar um GLB diretamente sem necessidade;
- duplicar modelos para funções diferentes;
- criar geometrias equivalentes por código quando já existe um GLB;
- recriar buffers por frame;
- misturar pipelines diferentes para modelos semelhantes.

Sempre:

- utilizar o pipeline definido neste documento;
- reutilizar buffers;
- reutilizar partículas;
- reutilizar morph targets;
- manter consistência entre todos os modelos.

---

# Filosofia

Os ficheiros GLB representam apenas a matéria-prima.

A experiência visual nasce do Experience Engine.

O utilizador não deve sentir que está a ver modelos 3D.

Deve sentir que está a observar uma entidade digital viva que utiliza esses modelos apenas como base para a sua transformação.