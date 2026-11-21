# 🤖 Contexto de Continuidade: LicitaDocs (Cofre Digital)

> **PARA O AGENTE/DESENVOLVEDOR:**
> Este arquivo é o seu Ponto de Restauração. Leia-o antes de iniciar qualquer nova funcionalidade.

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Inteligência de Mercado e Crescimento.
* **Sprint Atual:** **Sprint 31: Inteligência de Mercado e Leads (Fase 4 do Roadmap)**.
* **Última Ação Realizada:** Finalização do planejamento da Sprint 30 (Personalização). O foco agora expande para a prospecção ativa de novos clientes utilizando dados oficiais do governo (PNCP).
* **PRÓXIMO PASSO IMEDIATO:** Executar o Backlog da Sprint 31, focado em:
  1. **Integração PNCP:** Capturar dados de empresas cadastradas e participantes de licitações.
  2. **CRM de Leads:** Criar entidade `Lead` e interface administrativa para prospecção.
  3. **Controle LGPD:** Implementar sistema de anti-spam e frequência de contatos.

## 🏗️ Definições Arquiteturais (Não Quebrar)
* **Arquitetura:** MVC/Repository (Backend) e Orchestrator/Feature (Frontend).
* **Entidades:** A tabela `leads` deve ser independente da tabela `companies` para gerenciar prospectos antes da conversão.
* **Integração Externa:** O orquestrador de captura PNCP deve respeitar os limites de taxa (Rate Limit) da API oficial.

---
**Atualizado em:** 14/04/2026
**Responsável:** Equipe de Engenharia LicitaDocs
