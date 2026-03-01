# 🤖 Contexto de Continuidade: LicitaDocs (Cofre Digital)

> **PARA O AGENTE/DESENVOLVEDOR (MARK):**
> Este arquivo é o seu Ponto de Restauração. Antes de processar qualquer novo prompt, analise este estado para garantir consistência com a sessão anterior e aplique o protocolo de "Tolerância Zero para Adivinhação".

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Escalada e Funcionalidades Core.
* **Sprint Atual:** **Aguardando Planejamento da Sprint 21**.
* **Última Ação Realizada:** Finalização da Sprint 20 (Faxina Arquitetural). O backend está com RBAC centralizado, Fail Fast no `.env`, testes de integração 100% cobrindo a lógica matemática de CPF/CNPJ, e mocks de pagamentos blindados.
* **PRÓXIMO PASSO IMEDIATO:** O desenvolvedor (Matheus) deve propor o tema e escopo da Sprint 21 (Ex: Billing real, novos recursos de IA, ou polimento de Frontend).

## 🏗️ Definições Arquiteturais (Não Quebrar)
* **Backend (FastAPI + SQLAlchemy + Alembic):**
    * *Banco de Dados:* PostgreSQL obrigatório. O sistema implementa Fail Fast se não houver `.env` válido local ou em prod.
    * *Segurança:* RBAC centralizado via `Depends(require_role)`. Validação de Pydantic usando matemática real para documentos BR.
* **Frontend (React + TypeScript + Vite):**
    * *Regra:* Componentes 100% tipados. 

## 🧭 Mapa da Verdade (Onde buscar detalhes)
* **O que fazer agora:** Aguardar o escopo da Sprint 21.
* **O que consertar (Débitos):** Consulte `docs/DividasTecnicas.md`.
* **Histórico recente:** Consulte `docs/Sprints/SPRINT_20_CONCLUSAO.md`.