# Noma — Conciliação Contábil e Financeira

> Plataforma completa de **conciliação contábil e financeira** com integração a dados ERP, controle por centro de custo, mapeamento DE/PARA, auditoria e aprovações em tempo real.

Criado de ponta a ponta com o [Skip](https://goskip.dev).

---

## 📌 Visão Geral

O **Noma** é um sistema web voltado para equipes financeiras e contábeis que precisam:

- Importar e processar extratos/lançamentos de sistemas ERP
- Mapear contas financeiras às contas contábeis (DE/PARA)
- Conciliar movimentos financeiros por empresa, departamento e centro de custo
- Acompanhar divergências, pendências e aprovações em um fluxo rastreável
- Auditar todas as operações com log completo de alterações
- Exportar relatórios gerenciais em PDF e CSV

---

## 🚀 Stack Tecnológica

### Frontend
| Tecnologia | Função |
|---|---|
| **React 19** | Biblioteca principal de UI |
| **TypeScript** | Tipagem estática |
| **Vite** | Build tool e servidor de desenvolvimento |
| **React Router v7** | Roteamento SPA |
| **Tailwind CSS** | Estilização utility-first |
| **Shadcn UI + Radix UI** | Componentes acessíveis e reutilizáveis |
| **React Hook Form + Zod** | Formulários e validação de schemas |
| **Recharts** | Gráficos e visualizações financeiras |
| **date-fns** | Manipulação de datas |
| **xlsx / jsPDF** | Exportação de relatórios Excel e PDF |

### Backend / Infraestrutura
| Tecnologia | Função |
|---|---|
| **Supabase** | Banco de dados PostgreSQL, autenticação, Storage e Edge Functions |
| **Supabase Realtime** | Atualizações em tempo real (lançamentos, aprovações) |
| **Row Level Security (RLS)** | Isolamento de dados por organização |
| **Supabase Storage** | Upload de avatares e arquivos |

### Qualidade de Código
| Ferramenta | Função |
|---|---|
| **Oxlint** | Linter ultrarrápido para TypeScript/JavaScript |
| **Oxfmt** | Formatação automática de código |

---

## 🗂️ Módulos da Aplicação

### 🏠 Landing Page
Página de apresentação da plataforma com seções Hero, Funcionalidades, Confiança e CTA.

### 🔐 Autenticação
- Cadastro de usuário (`/signup`)
- Login (`/login`)
- Recuperação de senha (`/forgot-password`, `/reset-password`)
- Autenticação gerenciada pelo Supabase Auth com JWT

### 📊 Dashboard (`/dashboard`)
Painel de auditoria e conciliação ERP com:
- Saldo por conta bancária (gráfico de pizza)
- Processamento por centro de custo (gráfico de barras)
- Auditoria de fluxo mensal (gráfico de linha)
- Detecção de divergências e alertas de inconsistências
- Filtros por período e status
- Exportação PDF e CSV
- Atualização em tempo real via Supabase Realtime

### 🏢 Empresas (`/empresas`)
Cadastro e gestão das organizações que utilizam o sistema.

### 🏭 Departamentos (`/departamentos`)
Estrutura departamental vinculada à organização.

### 👤 Usuários (`/usuarios`)
Gestão de usuários, permissões e funções (roles).

### 📥 Importação (`/import`)
Importação de extratos e lançamentos de sistemas ERP com histórico de importações.

### 🗺️ Mapeamento DE/PARA (`/mapeamento`)
Regras de mapeamento entre contas financeiras/centros de custo e o Plano de Contas contábil.

### 📑 Lançamentos (`/lancamentos`)
Listagem e gestão detalhada dos movimentos financeiros importados.

### 🏷️ Centros de Custo (`/centros-de-custo`)
Cadastro de centros de custo com suporte a campos de contabilização e observações.

### 📒 Plano de Contas (`/plano-de-contas`)
Gestão do plano de contas contábil com classificação, importação em massa e replicação.

### 📈 Análises (`/analises`)
Módulo de análise avançada de dados financeiros.

### ✅ Aprovações (`/aprovacoes`)
Fluxo de aprovação de lançamentos e alterações com notificações em tempo real.

### 🏦 Tipo de Conta TGA (`/tipo-conta-tga`)
Cadastro de tipos de conta com código gerado automaticamente.

### 🔗 Consultas Compartilhadas (`/compartilhamentos`, `/consulta/:id`)
Geração e gestão de links compartilháveis para consultas financeiras, com suporte a senha, visualização única e revogação.

### 🔍 Auditoria
- **Usuários** (`/auditoria/usuarios`): Log de ações realizadas por cada usuário
- **Central de Auditoria** (`/auditoria/central`): Visão consolidada de todas as operações auditáveis com snapshots e configuração por entidade

---

## 📁 Estrutura do Projeto

```
.
├── src/
│   ├── pages/               # Páginas da aplicação (uma por rota)
│   │   ├── auditoria/       # Módulo de auditoria
│   │   ├── Dashboard.tsx
│   │   ├── Entries.tsx
│   │   ├── Mapping.tsx
│   │   └── ...
│   ├── components/          # Componentes reutilizáveis
│   │   ├── landing/         # Seções da landing page
│   │   ├── approvals/       # Componentes de aprovação
│   │   ├── entries/         # Componentes de lançamentos
│   │   ├── AuditLog/        # Componentes de auditoria
│   │   └── ui/              # Shadcn UI components
│   ├── hooks/               # Custom React Hooks
│   ├── lib/                 # Utilitários e cliente Supabase
│   ├── types/               # Definições de tipos TypeScript
│   ├── App.tsx              # Roteamento principal
│   └── main.tsx             # Entry point
├── supabase/
│   ├── migrations/          # Migrações SQL do banco de dados
│   └── functions/           # Edge Functions (ex: export-dashboard)
├── public/                  # Arquivos estáticos
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🗄️ Banco de Dados

O banco de dados é gerenciado pelo **Supabase (PostgreSQL)** com as seguintes entidades principais:

- `organizations` — Organizações/empresas
- `employees` / `departments` — Usuários e estrutura departamental
- `bank_accounts` — Contas bancárias
- `financial_movements` — Movimentos financeiros (lançamentos)
- `account_mapping` — Regras de mapeamento DE/PARA
- `cost_centers` — Centros de custo
- `chart_of_accounts` — Plano de contas contábil
- `tipo_conta_tga` — Tipos de conta TGA
- `import_history` — Histórico de importações ERP
- `shared_queries` — Consultas compartilhadas
- `audit_logs` — Log completo de auditoria
- `pending_changes` — Alterações pendentes de aprovação

Todas as tabelas possuem **Row Level Security (RLS)** para isolamento por organização.

---

## 📋 Pré-requisitos

- **Node.js 18+**
- **npm**, **pnpm** ou **bun**
- Projeto Supabase configurado (variáveis de ambiente necessárias)

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-chave-anon>
```

---

## 🔧 Instalação

```bash
npm install
```

---

## 💻 Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm start
# ou
npm run dev
```

Abre a aplicação em [http://localhost:5173](http://localhost:5173).

### Build

```bash
# Build para produção
npm run build

# Build para ambiente de desenvolvimento
npm run build:dev
```

Os arquivos otimizados são gerados na pasta `dist/`.

### Preview

```bash
# Visualizar build de produção localmente
npm run preview
```

### Linting e Formatação

```bash
# Executar linter
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Formatar código
npm run format

# Verificar formatação sem alterar arquivos
npm run format:check
```

---

## 🔄 Workflow de Desenvolvimento

1. Configure as variáveis de ambiente (`.env.local`)
2. Instale as dependências: `npm install`
3. Configure o banco Supabase com as migrações em `supabase/migrations/`
4. Inicie o servidor: `npm start`
5. Faça suas alterações no código
6. Verifique a qualidade: `npm run lint && npm run format:check`
7. Gere a build: `npm run build`
8. Visualize antes do deploy: `npm run preview`

---

## 📦 Deploy

```bash
npm run build
```

A pasta `dist/` gerada pode ser publicada em qualquer CDN ou serviço de hospedagem estática (Vercel, Netlify, Cloudflare Pages, etc.).

---

## 🎨 Componentes UI

A aplicação usa a biblioteca **Shadcn UI** (baseada em Radix UI), incluindo:

Accordion · Alert Dialog · Avatar · Badge · Button · Calendar · Card · Checkbox · Command · Context Menu · Dialog · Dropdown Menu · Form · Hover Card · Input · Label · Menubar · Navigation Menu · Popover · Progress · Radio Group · Scroll Area · Select · Separator · Sheet · Skeleton · Slider · Switch · Table · Tabs · Toast · Toggle · Tooltip · e mais.

---

## 🔒 Segurança

- Autenticação via **Supabase Auth** (JWT)
- **Row Level Security** em todas as tabelas — dados isolados por organização
- Controle de permissões por papel (role) do usuário
- Links compartilhados com suporte a senha e revogação
- Log de auditoria completo com snapshots de estado antes/depois

---

*Criado de ponta a ponta com o [Skip](https://goskip.dev).*
