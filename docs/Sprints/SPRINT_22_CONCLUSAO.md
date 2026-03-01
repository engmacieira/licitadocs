# 🏁 Log de Sprint: 22 - Orquestrador de Automação e Busca Real

**Período:** (Preencha a data de hoje)
**Status:** Concluído
**Foco:** Dar vida ao motor de automação através de Background Jobs e implementar o primeiro Crawler HTTP funcional.

## 🚀 Entregas Realizadas
* **[Infraestrutura]** Implementação do `APScheduler` para rodar tarefas em background junto à thread do FastAPI.
* **[Orquestração]** Serviço `OrchestratorService` desenvolvido com inteligência de cache: ele verifica se a empresa já possui um documento válido (faltando mais de 5 dias para expirar) antes de engatilhar o robô, poupando tráfego e processamento.
* **[Crawlers]** Criação do `TSTCrawlerV1` com requisições HTTP reais (`requests`), *headers* humanizados para *bypass* de WAFs básicos e tratamento estruturado de exceções de rede.
* **[Storage]** Integração do fluxo de saída do robô (bytes reais) com o sistema de arquivos local (`/uploads`) e persistência via `DocumentRepository`.

## 🧠 Retrospectiva
### ✅ O que funcionou bem?
* A arquitetura *Strategy* provou o seu valor: conseguimos trocar o robô "Mock" pelo "Real" sem alterar absolutamente nada na estrutura do banco ou nos routers.
* O `APScheduler` mostrou-se uma ferramenta perfeita e leve para este momento do MVP, evitando a complexidade precoce de subir um Redis + Celery.

### ⚠️ Lições Aprendidas / Obstáculos
* **Bloqueios de Rede (403 Forbidden):** Enfrentamos firewalls/WAF ao tentar acessar PDFs na internet via código. Aprendemos que robôs precisam de *headers* robustos (`User-Agent`, `Accept-Language`, etc.) para simular o comportamento de um navegador real e evitar bloqueios imediatos.