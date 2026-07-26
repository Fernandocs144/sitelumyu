# 03_ASSET_PIPELINE.md

# Asset Pipeline

## Objetivo

Este documento define como todos os assets do website devem ser utilizados.

Todos os assets devem seguir o mesmo pipeline de desenvolvimento para garantir consistência visual, reutilização de código e elevada performance.

Nenhum asset deve ser integrado diretamente sem respeitar estas regras.

---

# Tipos de Assets

O projeto utiliza os seguintes tipos de assets:

- Modelos 3D (.glb)
- Texturas
- HDRI
- Imagens
- Vídeos (casos excecionais)
- Shaders
- Ícones SVG

Cada tipo de asset possui um ciclo de vida próprio.

---

# Fonte Oficial

Todos os assets utilizados na experiência devem existir dentro do repositório.

Nunca utilizar assets carregados dinamicamente a partir de serviços externos.

Todos os caminhos devem ser relativos ao projeto.

---

# Modelos 3D

Os modelos 3D representam a principal fonte de geometria da experiência.

Exemplos:

- Robot
- Logótipo Lumyo
- Diamante
- Satélite
- Cérebro
- Outros modelos futuros

Todos os modelos devem seguir exatamente o mesmo pipeline técnico.

---

# Texturas

As texturas devem ser utilizadas apenas quando realmente necessárias.

Evitar texturas de elevada resolução quando um shader consegue produzir o mesmo resultado.

Dar prioridade a materiais procedurais.

---

# HDRI

Os HDRI devem ser utilizados apenas para iluminação e reflexos.

Nunca devem ser utilizados como elemento principal da experiência.

---

# SVG

Os SVG destinam-se exclusivamente a elementos da interface.

Nunca devem substituir modelos 3D.

---

# Vídeos

Vídeos apenas serão utilizados quando uma animação em tempo real não for tecnicamente viável.

Sempre que possível deve ser utilizada animação em Three.js.

---

# Materiais

Dar prioridade a materiais físicos (PBR).

Sempre que possível utilizar shaders próprios para criar identidade visual.

Evitar materiais genéricos sem personalização.

---

# Organização

Todos os assets devem possuir nomes claros.

Exemplos:

robot.glb

diamond.glb

lumyo_logo.glb

brain.glb

satellite.glb

Nunca utilizar nomes como:

model.glb

scene.glb

novo.glb

teste.glb

---

# Otimização

Todos os assets devem ser otimizados antes de entrarem no projeto.

Objetivos:

- reduzir número de polígonos;
- remover geometria invisível;
- remover materiais não utilizados;
- remover animações desnecessárias;
- reduzir tamanho do ficheiro.

---

# Reutilização

Sempre que possível um asset deve servir vários propósitos.

Exemplo:

O mesmo modelo pode ser utilizado para:

- renderização;
- partículas;
- morph targets;
- efeitos de dissolução.

Não devem existir cópias do mesmo modelo apenas para funções diferentes.

---

# Consistência

Todos os assets devem seguir a mesma linguagem visual.

Devem parecer pertencer ao mesmo universo.

Misturar estilos visuais diferentes deve ser evitado.

---

# Evolução

Todos os novos assets adicionados ao projeto devem respeitar este documento.

Caso seja necessário alterar o pipeline, a documentação deve ser atualizada antes da implementação.