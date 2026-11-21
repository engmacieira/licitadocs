# 🗺️ Sprint 26: Backend Hardening & Clean Code (LicitaDocs)

**Objetivo:** Refatorar o Backend para o padrão MVC/Repository, garantindo tipagem forte, documentação de rotas e persistência robusta, espelhando a organização do Frontend.
**Status:** Planejamento
**Tecnologia Principal:** FastAPI, SQLAlchemy, Pydantic e Alembic.

---

## 🎯 Backlog de Refatoração (Escopo)

### 📦 1. Módulo de Core & Configuração
* **[US-2601] Centralização de Configurações:** Isolar variáveis de ambiente e constantes no `app/core/config.py`.
* **[US-2602] Padronização de Respostas:** Criar Schemas Pydantic globais para respostas de erro e sucesso.

### 📦 2. Persistência & Modelagem (Models & Repositories)
* **[US-2603] Implementação de Soft Delete:** Garantir que todos os Models SQLAlchemy herdem uma classe base com `deleted_at`.
* **[US-2604] Camada de Repository:** Isolar toda a lógica de `db.query` em `app/repositories/`. O Router nunca deve falar diretamente com o Banco.

### 📦 3. Organização de Rotas (Routers)
* **[US-2605] Documentação de Endpoints:** Adicionar Docstrings e `responses` às rotas para que o Swagger (`/docs`) seja o manual vivo do sistema.

---

## 🛠️ Plano Técnico de Execução

1.  **Infra:** Validar a conexão com o Banco e configurar o `app/core/database.py` para suportar SQLite/PostgreSQL.
2.  **Modelagem:** Revisar `app/models/` para garantir que os campos batem 100% com o que o Frontend envia (visto na Sprint 25).
3.  **Refatoração CRUD:** Migrar lógica solta nas rotas para `app/repositories/base_repository.py`.
4.  **Alembic:** Gerar a primeira migration de "Limpeza" para garantir que o banco reflita os novos modelos.

---

## 📝 Definição de Pronto (DoD)
* [ ] Nenhuma lógica de banco de dados dentro dos arquivos em `app/routers/`.
* [ ] Todas as funções de serviço/repositório com Docstrings explicativas.
* [ ] Schemas Pydantic validados e sem uso de `Any`.
* [ ] Código seguindo o PEP8 (Linting OK).

---
**Assinatura:** Mark Construtor & Matheus