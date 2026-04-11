# 🗺️ Sprint 28: Integrações e Comunicação (Fase 2)

**Objetivo:** Conectar o LicitaDocs com canais externos de comunicação (E-mail e WhatsApp) e formalizar o sistema de pagamentos para automatizar o ciclo de vida do cliente.
**Status:** Planejamento
**Tecnologia Principal:** Amazon SES/SendGrid, WhatsApp API (Evolution/Twilio), Infinite Pay API.

---

## 🎯 Backlog da Sprint (User Stories)

### 📦 1. Mensageria e E-mail
* **[x] [US-2801] Infraestrutura de E-mail:** Configurar o provedor de envio e criar um `EmailService` genérico no backend.
* **[x] [US-2802] Validação de Conta:** Implementar fluxo de verificação de e-mail após o cadastro para garantir a validade dos dados de contato.
* **[x] [US-2803] Recuperação de Acesso:** 
    - Implementar "Esqueci minha senha" com envio de token seguro.
    - Implementar fluxo "Não lembro meu e-mail" via validação de CNPJ/CPF e dados da empresa.
* **[x] [US-2804] Alertas Administrativos:** Disparo automático de e-mail para os administradores quando uma nova empresa conclui o onboarding.

### 📦 2. WhatsApp & Notificações
* **[ ] [US-2805] Integração WhatsApp:** Conectar à API de WhatsApp para envio de alertas transacionais.
* **[ ] [US-2806] Notificação de Vencimento:** Automatizar o envio de mensagens (E-mail/WhatsApp) quando documentos estiverem próximos do vencimento ou marcados como "Irregular".

### 📦 3. Pagamentos (Infinite Pay)
* **[ ] [US-2807] Checkout de Assinatura:** Integrar a API da Infinite Pay no frontend para processamento de pagamentos.
* **[ ] [US-2808] Webhook de Ativação:** Criar endpoint de webhook para receber confirmações de pagamento e ativar automaticamente a flag `is_payment_active` da empresa.
* **[ ] [US-2809] Gestão de Recorrência:** Preparar o sistema para lidar com cancelamentos e renovações automáticas através do status retornado pela API de pagamento.

---

## 🛠️ Plano Técnico de Execução

1.  **Backend (Core):** 
    - Adicionar credenciais e endpoints das APIs em `.env` e `app/core/config.py`.
    - Criar `app/services/email_service.py` e `app/services/whatsapp_service.py`.
2.  **Segurança:** Implementar lógica de expiração de tokens para reset de senha (JWT curto ou Redis/DB).
3.  **Frontend:**
    - Criar páginas de "Esqueci Senha" e "Sucesso no Pagamento".
    - Integrar o widget/modal de checkout da Infinite Pay.

---

## 📝 Definição de Pronto (DoD)
* [ ] E-mails de teste enviados e recebidos com sucesso (SES/SendGrid).
* [ ] Fluxo completo de "Esqueci minha senha" funcionando.
* [ ] Webhook de pagamento testado localmente via ngrok/simulador e atualizando o banco.
* [ ] Alertas de WhatsApp chegando no número de teste.

---
**Assinatura:** Jules (Software Engineer) & Matheus (Product Owner)
