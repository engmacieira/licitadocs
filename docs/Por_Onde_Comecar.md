# 🚀 Guia de Início Rápido (Contexto do Projeto)

**Projeto:** LicitaDoc (SaaS de Gestão de Documentos para Licitações)
**Versão Atual:** v0.6.0 (Admin Module Stable)
**Data:** 30/01/2026

## 🏗️ Status Atual
O sistema é um Monorepo (Frontend React + Backend FastAPI).
* **Frontend:** Rodando na porta 5173. Usa Tailwind v4, React Hook Form, Zod e Axios.
* **Backend:** Rodando na porta 8000. Usa SQLAlchemy (SQLite), Pydantic v2 e Pytest.

## 🏆 Últimas Conquistas (Sprint 06)
1.  **CRUD de Empresas:** Completo (Create, Read, Update, Delete) em `/admin/companies`.
2.  **Testes Automatizados:** Backend coberto por testes em `app/tests/test_companies.py`.
3.  **Correções:** Ajuste de CORS e mapeamento de campos (`name` -> `razao_social`).

## 📍 Onde Paramos?
Acabamos de finalizar a **Gestão de Empresas**. O Admin consegue criar empresas, mas elas ainda estão "soltas". Os usuários não estão vinculados a elas, e os documentos também não.

## 🎯 Objetivo Imediato (Sprint 07)
**Implementar Multi-Tenancy Lógico.**
1.  Precisamos alterar o modelo de `User` para ter um `company_id`.
2.  Precisamos alterar a listagem de documentos para filtrar pelo `company_id` do usuário logado.
3.  Precisamos remover as URLs hardcoded (`127.0.0.1`) do frontend.

## 📂 Arquivos Chave para Leitura
* `frontend/src/services/companyService.ts` (Exemplo de serviço atual)
* `app/models/user_model.py` (Estrutura do banco que precisará mudar)
* `app/routers/documents.py` (Onde aplicaremos o filtro de empresa)
* `app/tests/test_companies.py` (Exemplo de teste funcional)

---
*Este documento serve para orientar a próxima sessão de desenvolvimento.*