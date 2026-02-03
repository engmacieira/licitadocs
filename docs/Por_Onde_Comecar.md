# 🤖 Contexto de Continuidade: LicitaDoc

> **PARA O AGENTE/DESENVOLVEDOR (MARK):**
> O projeto acaba de passar por uma REFATORAÇÃO MASSIVA (Sprint 10). O código está estável e testado. Não quebre o padrão estabelecido.

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Preparação para Produção (v0.9.0)
* **Sprint Concluída:** Sprint 10 (Refatoração & Documentação)
* **Próxima Sprint:** Sprint 11 (UX & Polimento Visual)
* **Última Ação:** Centralização dos serviços do Frontend (`api.ts`, `documentService.ts`) e validação total dos testes (Backend Green).

## 🏗️ Definições Arquiteturais (Obrigatórias)
* **Backend:** * Schemas Pydantic usam `populate_by_name=True`.
    * Rotas devem ter docstrings e anotações para o Swagger.
    * Lógica de IA deve residir em `AIService`, não no Router.
* **Frontend:**
    * **NUNCA** usar `fetch` ou `axios` direto nos componentes. Importe de `src/services/`.
    * Tipagem TypeScript estrita (nada de `any`).

## 🧭 Próximo Passo Imediato
Iniciar o planejamento da **Sprint 11**, focando em:
1. Melhorar o feedback visual de Upload (Toasts/Barra de progresso).
2. Refinar o Dashboard do Cliente (que hoje é apenas uma lista simples).

---
**Status dos Testes:** 🟢 PASSING (Sem Warnings Críticos)