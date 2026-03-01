# 🤖 Contexto de Continuidade: LicitaDocs (Cofre Digital)

> **PARA O AGENTE/DESENVOLVEDOR:**
> Este arquivo é o seu Ponto de Restauração. Leia-o antes de iniciar qualquer nova funcionalidade.

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Escalada (Automação de Tarefas).
* **Sprint Atual:** **Aguardando Planejamento da Sprint 22**.
* **Última Ação Realizada:** Finalização da Sprint 21 (Motor de Automação). Temos o Strategy Pattern configurado no backend, o Frontend pronto para cadastrar as estratégias e um PoC (TSTCrawlerPoC) funcional.
* **PRÓXIMO PASSO IMEDIATO:** O desenvolvedor deve escolher qual será o foco da Sprint 22. As opções sugeridas são:
  1. Desenvolver o robô **Real** de uma certidão (Ex: Substituir o PoC do TST pelo código real que acede à API do Governo).
  2. Desenvolver o **Orquestrador/Cron Job** (Celery ou APScheduler) que vai ler a base de dados de madrugada e disparar a *CrawlerFactory* para cada empresa.

## 🏗️ Definições Arquiteturais (Não Quebrar)
* **Automação:** Deve sempre seguir o Padrão Strategy. Para adicionar um robô, crie a classe em `app/services/crawlers/`, herde de `BaseCrawler` e mapeie no `CrawlerFactory`. NUNCA use `if/else` no router para decidir o tipo de busca.