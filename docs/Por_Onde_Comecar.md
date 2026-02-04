# 🤖 Contexto de Continuidade: Licitadocs

> **PARA O AGENTE/DESENVOLVEDOR (MARK):**
> Este arquivo é o seu Ponto de Restauração. Antes de processar qualquer novo prompt, analise este estado.

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Consolidação de Infraestrutura / Início de Features Avançadas (Certidões).
* **Sprint Atual:** Encerrando Sprint 12 -> **Indo para Sprint 13**.
* **Última Ação Realizada:** Migração completa para PostgreSQL (Docker porta 5433) e validação do Frontend/Login.
* **PRÓXIMO PASSO IMEDIATO:** Planejar a Sprint 13 (Backlog de Gestão de Certidões: Upload, Validade e Alertas).

## 🏗️ Definições Arquiteturais (Atualizado)
* **Backend:** Python (FastAPI) + SQLAlchemy + **Alembic** + **PostgreSQL (Docker :5433)**.
    * *Atenção:* O arquivo `database.py` possui um fallback hardcoded devido a erros de encoding do Windows.
* **Frontend:** React + TypeScript + Vite.
* **Infra:** Docker Compose (Service: `db`).

## 🧭 Mapa da Verdade
* **O que fazer:** Consulte `docs/SPRINT_12_CONCLUSAO.md` para ver o setup atual.
* **Dívidas:** Consulte `docs/DividasTecnicas.md` (Prioridade: Remover hardcode de senhas).