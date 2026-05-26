# 🤖 LicitaDocs: Cofre Digital Inteligente

> Sistema de alta performance para gestão de documentos de licitação, unificando inteligência artificial, segurança relacional e uma experiência de usuário fluida. Este é um repositório privado focado na excelência operacional para o mercado público brasileiro.

---

## 📍 Visão Geral
O LicitaDocs é um ecossistema SaaS projetado para automatizar a gestão de documentos e certidões necessárias para processos licitatórios. O sistema atua como um **Cofre Digital (Vault)**, capturando, organizando e monitorando a validade de documentos fiscais e técnicos, permitindo que empresas mantenham sua conformidade de forma autônoma e inteligente.

## 🛠️ Stack Tecnológica

### Backend (A Fundação)
- **Linguagem:** Python 3.10+
- **Framework:** FastAPI (Alta performance e tipagem forte)
- **Banco de Dados:** PostgreSQL (Single Source of Truth)
- **ORM:** SQLAlchemy com migrações via Alembic.
- **Segurança:** Autenticação JWT e RBAC (Admin/Client).

### Frontend (A Experiência)
- **Tecnologias:** React (Vite) + TypeScript.
- **Estilização:** TailwindCSS para design moderno e responsivo.
- **Gerenciamento de Estado:** Hooks customizados e extração de lógica de negócio de componentes (Pattern: Orchestrator/Feature).

---

## 🚀 Fluxo de Desenvolvimento (MCP & Linear)

Este projeto utiliza um fluxo de desenvolvimento moderno orquestrado via **MCP (Model Context Protocol)** e **Linear**.

### 1. Gestão de Tarefas (Linear)
Todo o trabalho é rastreado no workspace do Linear. As issues são organizadas por Sprints (Milestones) e Epics.
- **Sprint Atual:** Consulte o Milestone ativo no Linear.
- **ID da Issue:** Sempre utilize o ID da issue (ex: `LIC-123`) para referenciar seu trabalho.

### 2. Regras de Código (AGENTS.md)
O desenvolvimento é estritamente guiado pelas diretrizes contidas no arquivo `AGENTS.md`. É **obrigatório** seguir o protocolo de tolerância zero para adivinhação e as regras arquiteturais descritas.

### 3. Convenção de Commits
Todo commit realizado deve obrigatoriamente conter a tag da issue correspondente e o prefixo do agente AI, seguindo o padrão:
`🤖 AI (Jules): type(scope): [LIC-X] descrição curta`

Exemplo:
`🤖 AI (Jules): feat(auth): [LIC-42] implementa recuperação de senha via SES`

---

## 📦 Estrutura do Ecossistema

```text
├── app/                # Backend (FastAPI)
│   ├── core/           # Configurações, Segurança e Database Setup
│   ├── models/         # Entidades SQLAlchemy
│   ├── repositories/   # Lógica de persistência (Data Access)
│   ├── services/       # Regras de Negócio e Integrações (E-mail, PNCP)
│   └── routers/        # Endpoints da API (Auth, Vault, Admin, AI)
├── frontend/           # Frontend (React)
└── docs/               # Histórico de Sprints e Planejamento Estratégico
```

---
**Desenvolvido com ❤️ pela Equipe LicitaDocs.**
