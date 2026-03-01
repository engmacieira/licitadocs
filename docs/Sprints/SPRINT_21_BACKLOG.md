# 🗺️ Sprint 21: Motor de Automação de Certidões (Strategy Pattern)

**Objetivo:** Construir a fundação arquitetural flexível para a automação de busca de certidões, implementando a entidade de configuração (Metadata) e o padrão *Strategy* no backend para orquestrar diferentes robôs/crawlers.
**Status:** Planeamento
**Tecnologia Principal:** FastAPI (Python), PostgreSQL, SQLAlchemy, React, TypeScript.

---

## 🎯 Backlog de Funcionalidades (Escopo)

### 📦 1. Infraestrutura e Modelagem de Dados
* **[US-AT1] Modelagem do Motor de Automação no Banco de Dados**
    * **O que é:** Criação de uma nova entidade (`DocumentAutomationConfig`) para guardar as regras de negócio de como buscar cada tipo de documento.
    * **Critério de Aceite:** Tabela criada e ligada (Relação 1:1) com a entidade `DocumentType`. Deve conter campos como `is_automatable`, `strategy_name`, `requires_captcha` e `source_url`.
    * **Regra de Negócio:** Se um `DocumentType` for apagado, a sua configuração de automação deve ser apagada em cascata (*Cascade Delete*).

### 📦 2. Núcleo de Automação (Backend)
* **[US-AT2] Fábrica de Estratégias (Strategy Pattern)**
    * **O que é:** Implementação do motor que vai decidir qual código executar baseado na string `strategy_name` que vem do banco de dados.
    * **Critério de Aceite:** Criação da estrutura de ficheiros `app/services/crawlers/` com uma interface `BaseFetcher` e a classe abstrata `CrawlerFactory`.
    * **Regra de Negócio:** O sistema não pode usar blocos `if/else` gigantescos. A injeção da estratégia deve ser polimórfica e dinâmica.

* **[US-AT3] Primeiro Robô de Prova de Conceito (PoC)**
    * **O que é:** Construção de um *fetcher* real ou mockado (ex: `cnd_trabalhista_fetcher.py`) para provar que a fábrica funciona de ponta a ponta.
    * **Critério de Aceite:** O robô deve herdar de `BaseFetcher`, implementar o método `fetch()` e conseguir ser invocado pela Fábrica sem erros.

### 📦 3. Gestão e Interface (Frontend e API)
* **[US-AT4] Interface de Configuração no Painel Admin**
    * **O que é:** Permitir que o Administrador do sistema gerencie os robôs diretamente no painel.
    * **Critério de Aceite:** Expandir a rota atual de `PUT/POST /admin/documents/types` para aceitar as configurações de automação. No Frontend, adicionar uma aba ou *checkbox* "É Automatizável?" no modal de criação de Tipos de Documentos.

---

## 🛠️ Plano Técnico de Execução

1.  **Database (Alembic):** * Criar `app/models/document_automation_model.py`.
    * Gerar a migração com Alembic e aplicar no banco de dados.
2.  **Backend (Schemas & Routers):** * Atualizar os schemas Pydantic em `document_schemas.py` para aninhar os dados de automação dentro do `DocumentType`.
    * Refatorar o `DocumentRepository` para salvar as configurações de automação junto com o tipo.
3.  **Backend (Services):** * Criar o serviço `CrawlerFactory` e instanciar o primeiro robô de teste.
4.  **Frontend (React):** * Atualizar o formulário no componente de gestão do catálogo para enviar o JSON atualizado com as chaves de automação.
5.  **Testes:** * Validar se a Fábrica levanta um erro quando recebe um `strategy_name` inválido.
    * Validar a gravação no banco de dados.

---

## 📝 Definição de Pronto (DoD)

* [ ] Código commited e submetido para o repositório.
* [ ] Migrations do Alembic aplicadas com sucesso.
* [ ] A Fábrica de Estratégias (Strategy Pattern) consegue instanciar e executar o *fetcher* baseado na configuração.
* [ ] Frontend permite configurar a automação visualmente.
* [ ] Testes unitários do Pydantic e do Factory a passar a 100%.