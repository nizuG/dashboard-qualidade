# Dashboard Qualidade APS

Dashboard web para importar, armazenar, consultar e comparar indicadores de qualidade da APS a partir de arquivos CSV.

Este projeto foi desenvolvido com foco em uma necessidade real de análise de dados: transformar arquivos CSV em informações navegáveis, permitindo visualizar competências importadas, consultar indicadores por equipe e comparar a evolução entre períodos.

## Visão Geral

O sistema permite:

- importar múltiplos arquivos CSV;
- salvar os dados tratados em PostgreSQL;
- listar competências disponíveis;
- visualizar indicadores de uma competência específica;
- comparar duas competências lado a lado;
- filtrar informações por equipe, grupo de indicador e status de evolução;
- gerar visualizações em cards, tabela e formato compacto para impressão/PDF.

## Destaques Técnicos

- Backend em Node.js com Express.
- Banco PostgreSQL modelado com Prisma ORM.
- Upload de arquivos com Multer.
- Parser próprio para leitura e normalização de CSV.
- Frontend organizado em HTML, CSS e JavaScript separados.
- Estrutura de backend separada por responsabilidades: app, server, rotas, serviços e configurações.
- Docker Compose para subir PostgreSQL localmente.

## Stack

- Node.js
- Express
- Prisma
- PostgreSQL
- Docker
- HTML
- CSS
- JavaScript

## Estrutura do Projeto

```text
dashboard-qualidade/
|-- prisma/
|   |-- migrations/
|   `-- schema.prisma
|-- public/
|   |-- assets/
|   |   |-- css/
|   |   `-- js/
|   |-- comparativo.html
|   |-- competencia.html
|   |-- home.html
|   `-- upload.html
|-- src/
|   |-- config/
|   |-- routes/
|   |-- services/
|   |-- app.js
|   `-- server.js
|-- uploads/
|-- docker-compose.yml
|-- package.json
`-- README.md
```

## Funcionalidades

### Importação de CSV

Tela para envio de um ou mais arquivos CSV. O backend recebe os arquivos, processa os dados e salva as importações e seus indicadores no banco.

### Dashboard Inicial

Página com resumo das importações, quantidade de competências, competência mais recente e município de origem dos dados.

### Consulta por Competência

Permite selecionar uma competência e visualizar os indicadores agrupados por equipe, com filtros por equipe e grupo.

### Comparativo entre Competências

Permite comparar duas competências e acompanhar quais indicadores subiram, caíram, ficaram estáveis ou não possuem dados suficientes para comparação.

## Modelo de Dados

O banco possui duas entidades principais:

- `ImportacaoCsv`: representa cada arquivo CSV importado.
- `IndicadorEquipe`: representa os indicadores processados por equipe, competência e grupo.

Também foram criados índices para otimizar consultas por competência, equipe e código do indicador.

## Como Rodar Localmente

### 1. Clone o projeto

```bash
git clone https://github.com/nizuG/dashboard-qualidade/
cd dashboard-qualidade
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Suba o PostgreSQL com Docker

```bash
docker compose up -d
```

### 4. Configure o arquivo `.env`

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5438/dashboard_qualidade"
```

### 5. Rode as migrations do Prisma

```bash
npx prisma migrate dev
```

### 6. Inicie o servidor

```bash
npm run dev
```

Acesse:

```text
http://localhost:3333
```

## Rotas da API

```text
POST /api/importar-csv
GET  /api/competencias
GET  /api/competencia?competencia=JAN/26
GET  /api/comparativo?competenciaA=JAN/26&competenciaB=FEV/26
```

## Aprendizados Aplicados

Neste projeto pratiquei:

- criação de APIs REST com Express;
- organização de backend em camadas;
- modelagem de banco relacional com Prisma;
- relacionamento entre tabelas;
- upload e processamento de arquivos;
- manipulação e normalização de dados vindos de CSV;
- criação de dashboards com JavaScript puro;
- filtros, agrupamentos e renderização dinâmica no frontend;
- uso de Docker para ambiente local de banco de dados.

## Próximas Melhorias

- autenticação de usuários;
- exclusão e reprocessamento de importações;
- testes automatizados para serviços e rotas;
- validação mais rígida dos arquivos CSV;
- gráficos para evolução histórica dos indicadores;
- deploy em ambiente cloud.

## Sobre o Projeto

Este projeto faz parte do meu portfólio como desenvolvedor, demonstrando minha capacidade de construir uma aplicação full stack completa, desde a importação e persistência dos dados até a criação de telas úteis para análise e tomada de decisão.
