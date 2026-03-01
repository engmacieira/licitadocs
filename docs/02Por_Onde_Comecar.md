# 🤖 Contexto de Continuidade: LicitaDocs (Cofre Digital)

> **PARA O AGENTE/DESENVOLVEDOR:**
> Este arquivo é o seu Ponto de Restauração. Leia-o antes de iniciar qualquer nova funcionalidade.

## 📍 Estado Atual da Missão
* **Fase do Projeto:** O Cofre Digital Inteligente atingiu a sua maturidade funcional (MVP Core Completo). O sistema cadastra empresas, aceita uploads, lê OCR (fase inicial), possui RBAC, e busca certidões de forma autônoma via Background Jobs.
* **Sprint Atual:** **Aguardando Planejamento da Sprint 23**.
* **Última Ação Realizada:** Finalização da Sprint 22. Orquestrador (`APScheduler`) e primeiro Robô HTTP (`TSTCrawlerV1`) construídos e validados com download real de PDFs.
* **PRÓXIMO PASSO IMEDIATO:** O desenvolvedor deve escolher o rumo da próxima fase do SaaS. Opções sugeridas:
  1. **Monetização/Billing:** Integração real com Stripe ou Pagar.me para cobrar assinaturas dos clientes.
  2. **Notificações:** Envio de e-mails (ex: AWS SES, SendGrid) avisando o cliente que uma certidão expirou ou foi atualizada.
  3. **Dashboards Reais:** Substituir os dados "mockados" do Painel Inicial do Frontend por gráficos reais baseados no banco de dados.

## 🏗️ Definições Arquiteturais (Não Quebrar)
* **Background Jobs:** Gerenciados pelo `APScheduler`. Não bloqueie a thread principal do FastAPI.
* **Crawlers:** Qualquer novo robô (ex: Receita Federal, FGTS) deve ser criado na pasta `app/services/crawlers/` herdando de `BaseCrawler` e registrado na `CrawlerFactory`.