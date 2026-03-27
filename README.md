# LicitaDoc: Cofre Digital Inteligente 🚀

> Sistema de alta performance para gestão de documentos de licitação, unificando inteligência artificial, segurança relacional e uma experiência de usuário fluida.

---

## 📍 Estado Atual: Sprint 19 (Fortaleza Digital)
O sistema encontra-se em fase de **Hardening (Endurecimento)**. Após a conclusão da Sprint 18, alcançamos autonomia total na gestão do catálogo administrativo e integração com armazenamento em nuvem.

## 🌟 Funcionalidades Principais

### 🛡️ Cofre Inteligente (Digital Vault)
- **Unificação de Dados:** Interface única para arquivos legados e certidões estruturadas via *Unified DTO*.
- **Storage Escalável:** Integração direta com **AWS S3** para armazenamento e recuperação segura de documentos.

### ⚙️ Gestão de Catálogo (Admin Settings)
- **Controle Total:** CRUD completo de Categorias e Tipos de Documentos sem necessidade de acesso manual ao banco de dados.
- **Integridade Relacional:** Travas de segurança avançadas que impedem a exclusão de categorias com tipos vinculados ou tipos com certidões ativas.

### 🤖 Inteligência Artificial & Segurança
- **IA Consultant:** Módulo integrado para auxílio na análise e extração de dados documentais.
- **ACL (Access Control List):** Proteção de rotas e interface baseada em perfis de acesso (Admin/Client) via JWT.

---

## 🛠️ Stack Tecnológica

### Backend (A Fundação)
- **Core:** Python 3.8+ com **FastAPI**.
- **Banco de Dados:** SQLAlchemy ORM com suporte a PostgreSQL/SQLite.
- **Migrações:** Gestão de esquema e versionamento via **Alembic**.

### Frontend (A Experiência)
- **Interface:** React (Vite) + TypeScript.
- **Estilização:** TailwindCSS para um design responsivo, limpo e moderno.
- **Formulários:** React Hook Form + Zod para validações rigorosas e performáticas no client-side.
- **Feedback:** Notificações em tempo real com **Sonner**.

---

## 📦 Estrutura do Ecossistema

```text
├── app/                # Backend (FastAPI)
│   ├── core/           # Configurações, Segurança (JWT) e S3
│   ├── models/         # Definições de Tabelas (SQLAlchemy)
│   ├── repositories/   # Lógica de persistência e Integridade
│   ├── routers/        # Endpoints da API (Auth, Doc, Admin, AI)
│   └── schemas/        # DTOs e Validação Pydantic
├── frontend/           # Frontend (React)
│   ├── src/services/   # Integração com API (Axios)
│   └── src/pages/      # Interfaces (Dashboard, Settings, Vault)
└── docs/               # Documentação técnica e histórico de Sprints
```

---

## 📈 Próximos Passos (Roadmap)
- [ ] **Dashboard de Métricas:** Visualização gráfica de documentos a vencer.
- [ ] **Sistema de Notificações:** Alertas preventivos para usuários sobre vencimentos.
- [ ] **QA Senior:** Expansão da cobertura de testes com Vitest (Frontend) e testes de estresse para validação de segurança (Backend).

---
**Desenvolvido por:** Matheus & Equipe LicitaDoc (Sprint 18/19)