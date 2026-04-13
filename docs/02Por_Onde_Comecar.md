# 🤖 Contexto de Continuidade: LicitaDocs (Cofre Digital)

> **PARA O AGENTE/DESENVOLVEDOR:**
> Este arquivo é o seu Ponto de Restauração. Leia-o antes de iniciar qualquer nova funcionalidade.

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Otimização Operacional e Backoffice.
* **Sprint Atual:** **Sprint 29: Backoffice e Gestão Administrativa (Fase 3 do Roadmap)**.
* **Última Ação Realizada:** Finalização do planejamento da Sprint 28 (Integrações). Agora o foco é dar ferramentas de alta performance para a equipe interna gerenciar o crescimento da base de clientes.
* **PRÓXIMO PASSO IMEDIATO:** Executar o Backlog da Sprint 29, focado em:
  1. **Admin Dashboard:** Componentes para triagem de novas empresas e pendências.
  2. **Gestão de Documentos:** Filtros avançados no Upload e separação visual do Cofre (Admin vs Cliente).
  3. **Comunicação Interna:** Sistema de avisos de moderação e filtros na Inbox.

## 🏗️ Definições Arquiteturais (Não Quebrar)
* **Arquitetura:** MVC/Repository (Backend) e Orchestrator/Feature (Frontend).
* **Segurança (RBAC):** Garantir que as novas funções de moderação e visualização detalhada sejam restritas ao papel `ADMIN`.
* **Performance:** Utilizar componentes de busca assíncrona (Autocomplete) para seleção de empresas em cenários de alta volumetria.

---
**Atualizado em:** 13 de Abril 2026
**Responsável:** Jules (Software Engineer)
