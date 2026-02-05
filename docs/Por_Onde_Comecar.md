# 🤖 Contexto de Continuidade: LicitaDocs

> **PARA O AGENTE/DESENVOLVEDOR (MARK):**
> Este arquivo é o seu Ponto de Restauração. Antes de processar qualquer novo prompt, analise este estado.

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Consolidação do Produto SaaS.
* **Sprint Atual:** **Sprint 14 - Painel Administrativo & Gestão** (Iniciando).
* **Sprint Anterior:** Sprint 13 (Concluída com sucesso - Fluxo de Onboarding Self-Service).
* **Última Ação Realizada:** Planejamento do Kanban da Sprint 14 e geração dos Release Notes v1.0.2.

---


## 🏗️ Arquitetura & Infraestrutura (Atualizado v0.13.0)
* **Backend:** FastAPI + SQLAlchemy + Alembic.
    * **Porta:** `8000`.
    * **Storage:** Local (`app/storage/uploads`). **Atenção:** Arquivos salvos em disco.
    * **Auth:** JWT. Fluxo de cadastro cria usuários `client` inativos (`is_active=False`) até pagamento.
* **Banco de Dados:** PostgreSQL (Docker).
    * **Porta Externa:** `5433` (Mapeada para evitar conflito com 5432).
    * **Conexão:** Hardcoded em `database.py` (Workaround para erro de encoding Windows `0xe7`).
* **Frontend:** React + Vite + Tailwind + Shadcn/ui.
    * **Porta:** `5173`.
    * **Rotas:** Públicas (Landing, Register, Contract, Payment) e Privadas (Dashboard).

## 🧭 Mapa da Verdade (Onde estamos?)

### 1. O que acabou de acontecer (Contexto Recente)
Finalizamos o fluxo onde a empresa se cadastra sozinha.
* O Backend agora aceita Upload Multipart no registro.
* Temos problemas de nomenclatura: Frontend manda inglês (`legal_name`), Banco espera português (`razao_social`). O Router faz essa tradução manualmente.

### 2. O que estamos fazendo AGORA (Foco Imediato)
Estamos iniciando a **Sprint 14**. O objetivo é preparar o terreno para o Administrador trabalhar.
* **Tarefa Atual:** **[Card 01] Sidebar & Menus Dinâmicos**.
* **Problema a Resolver:** O Admin loga mas vê links misturados ou incorretos. Precisamos separar o menu de `admin` do menu de `client`.

### 3. Backlog Priorizado (Kanban Sprint 14)
Consulte `docs/KANBAN_SPRINT_14.md` para o board detalhado.
1.  **[DOING]** Refatorar `Sidebar.tsx` (Separar links por Role).
2.  **[TODO]** Melhorar `CompaniesPage` (Ativar/Inativar empresas).
3.  **[TODO]** Criar `CompanyDetails` (Visão do Admin sobre o Cliente).

## ⚠️ Pontos de Atenção (Armadilhas)
* **Models vs Schemas:** Não tente adivinhar nomes de colunas. Consulte `app/models/` antes de criar queries. O banco tem termos em português (`razao_social`), o código em inglês (`legal_name`).
* **Permissões:** Usuários criados pelo site são `CLIENT`. Usuários `ADMIN` só existem se criados via script ou seed (por enquanto).
* **Dívidas Técnicas:** Consulte `docs/DividasTecnicas.md` antes de fazer refatorações grandes.

---
**Próximo Comando Sugerido:** "Vamos começar o Card 01 do Kanban da Sprint 14: Refatorar a Sidebar."