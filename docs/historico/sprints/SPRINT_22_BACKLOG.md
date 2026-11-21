# 🗺️ Sprint 22: Orquestrador de Automação e Busca Real (Background Jobs)

**Objetivo:** Implementar o motor de processamento em background que orquestra a busca automática de certidões para as empresas, salvando os PDFs diretamente no Cofre, e implementar o primeiro robô real de extração.
**Status:** Planeamento
**Tecnologia Principal:** FastAPI (Python), APScheduler (ou Celery/Redis), Web Scraping/API Requests.

---

## 🎯 Backlog de Funcionalidades (Escopo)

### 📦 1. O Orquestrador (O Cérebro)
* **[US-AT5] Motor de Tarefas Agendadas (Cron Job)**
    * **O que é:** Um serviço em background (ex: usando `APScheduler`) que roda em intervalos definidos (ex: todos os dias à meia-noite).
    * **Critério de Aceite:** O orquestrador deve buscar no banco todas as configurações onde `is_automatable == True`. Para cada configuração, deve encontrar quais empresas ativas precisam daquele documento (ausente ou expirando em X dias) e colocar na fila de execução.

### 📦 2. A Execução e Persistência
* **[US-AT6] Pipeline de Download e Gravação (Cofre)**
    * **O que é:** O fluxo que pega o retorno do robô (o PDF em base64 ou bytes), salva no disco rígido (`save_file_locally`) e regista a linha na tabela `certificates`.
    * **Critério de Aceite:** Quando o `CrawlerFactory.get_crawler(...).fetch()` devolver sucesso, o sistema deve automaticamente usar o `DocumentRepository.create_certificate` para vincular o novo PDF à empresa de forma invisível.

### 📦 3. O Primeiro Robô Real
* **[US-AT7] Implementação do Robô CND Federal (ou TST)**
    * **O que é:** Substituir o nosso "mock" por um código real que bate numa API pública ou faz web scraping (usando `requests` ou `playwright`) para baixar a certidão verdadeira usando o CNPJ da empresa.
    * **Critério de Aceite:** O robô herda de `BaseCrawler`, recebe o CNPJ, navega/consulta a fonte, lida com erros (ex: "CNPJ Inválido" ou "Site fora do ar") e devolve o PDF real.

### 📦 4. Visibilidade (UX/UI)
* **[US-AT8] Status de "Processando" no Frontend**
    * **O que é:** (Opcional/Bónus) Mostrar na interface do cliente que o sistema está "A buscar certidão..." para que ele saiba que a automação está a trabalhar por ele.

---

## 🛠️ Plano Técnico de Execução

1. **Infraestrutura de Background:** Instalar e configurar a biblioteca de agendamento (`APScheduler` é excelente e leve para começar nativamente no FastAPI sem precisar de subir um Redis logo de cara).
2. **Serviço Orquestrador:** Criar `app/services/orchestrator_service.py` contendo a lógica de varredura do banco.
3. **Atualização do Robô:** Escrever a lógica HTTP real dentro do nosso `BaseCrawler` escolhido.
4. **Integração de Storage:** Unir o output do robô com a função de upload já existente.