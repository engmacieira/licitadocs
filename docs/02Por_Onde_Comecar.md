# 🤖 Contexto de Continuidade: LicitaDocs (Cofre Digital)

> **PARA O AGENTE/DESENVOLVEDOR:**
> Este arquivo é o seu Ponto de Restauração. Leia-o antes de iniciar qualquer nova funcionalidade.

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Expansão de Conectividade e Finanças.
* **Sprint Atual:** **Sprint 28: Integrações e Comunicação (Fase 2 do Roadmap)**.
* **Última Ação Realizada:** Finalização do planejamento da Sprint 27 (UX & Estabilidade). Iniciamos agora a conexão com serviços externos de mensageria e pagamentos.
* **PRÓXIMO PASSO IMEDIATO:** Executar o Backlog da Sprint 28, focado em:
  1. **E-mail:** Configurar infraestrutura (SES/SendGrid) e fluxos de validação/recuperação.
  2. **WhatsApp:** Integrar API para alertas de conformidade e suporte.
  3. **Pagamentos:** Implementar Infinite Pay (Checkout e Webhooks de ativação).

## 🏗️ Definições Arquiteturais (Não Quebrar)
* **Arquitetura:** MVC/Repository (Backend) e Orchestrator/Feature (Frontend).
* **Serviços Externos:** Centralizar configurações de API (E-mail, WhatsApp, Infinite Pay) em `app/core/config.py`.
* **Segurança:** Validar webhooks de pagamento para evitar fraudes (Feature Flags em produção).

---
**Atualizado em:** 09 de abril de 2026
**Responsável:** Jules (Software Engineer)
