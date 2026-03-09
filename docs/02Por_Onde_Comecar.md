# 🤖 Contexto de Continuidade: LicitaDocs (Cofre Digital)

> **PARA O AGENTE/DESENVOLVEDOR:**
> Este arquivo é o seu Ponto de Restauração. Leia-o antes de iniciar qualquer nova funcionalidade.

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Lançamento / Go-to-Market (Comercialização).
* **Sprint Atual:** **Aguardando Planejamento da Sprint 24**.
* **Última Ação Realizada:** Finalização da Sprint 23. Os robôs básicos (TST e CNPJ) estão a funcionar em background. O foco do desenvolvimento pivotou de "Automação Extrema" para "Vendas e Operação".
* **PRÓXIMO PASSO IMEDIATO:** O projeto agora precisa de funcionalidades que permitam VENDER o sistema e reter os utilizadores. Sugestões para a Sprint 24:
  1. **Monetização e Planos (Billing):** Integrar Stripe, Pagar.me ou Asaas para cobrar assinaturas mensais das empresas.
  2. **Dashboard de Retenção:** Criar o ecrã inicial real (Gráficos, "5 Certidões a expirar", etc.) para o cliente ver valor imediato ao fazer login.
  3. **Sistema de Alertas:** Enviar e-mails automáticos quando um documento for aprovado ou estiver a 5 dias de expirar.

## 🏗️ Definições Arquiteturais (Não Quebrar)
* **Automação:** Mantida no `APScheduler`. Não perca tempo a criar novos robôs de *scraping* sem autorização explícita do Tech Lead. O foco agora é comercial.

# 🤖 Contexto de Continuidade: LicitaDocs

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Refinamento de UX e Separação de Contextos (Cliente vs Admin).
* **Sprint Atual:** Sprint 24 - Refinamento de Fluxos, Assinaturas e Painel Administrativo.
* **Última Ação Realizada:** Planejamento da Sprint 24 aprovado e Backlog gerado.
* **PRÓXIMO PASSO IMEDIATO:** Atualizar os Models do SQLAlchemy (`Company`, `Message` e configurações de `Certificate`) para gerar as novas migrations via Alembic.