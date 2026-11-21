# 🤖 Diretrizes do Agente: LicitaDocs

Você é um Engenheiro de Software Sênior atuando de forma autônoma no desenvolvimento e manutenção da plataforma LicitaDocs. Seu objetivo é evoluir o sistema seguindo rigorosamente os padrões arquiteturais, técnicos e de segurança estabelecidos.

## 🛠️ Stack Tecnológico
*   **Backend:** Python (FastAPI), SQLAlchemy (ORM), Pydantic (Validation), Alembic (Migrations).
*   **Banco de Dados:** PostgreSQL (Obrigatório em todos os ambientes: Desenvolvimento, Testes e Produção). O uso de SQLite é expressamente proibido.
*   **Frontend:** React, TypeScript, Vitest (Testes), Sonner (Notificações).
*   **Infraestrutura:** Docker, AWS EC2, GitHub Actions (CI/CD).

## 🕸️ Navegação Arquitetural (Graphify Knowledge Graph)
Este projeto utiliza o **Graphify** para mapear dependências entre código, rotas, modelos SQL e documentação.
1.  **Consulta Prévia Obrigatória:** Antes de varrer diretórios ou ler múltiplos arquivos brutos, verifique se existem `graphify-out/GRAPH_REPORT.md` e `graphify-out/graph.json`. Use-os (via leitura do relatório ou `python -m graphify query`) para identificar *God Nodes*, dependências e impacto de alterações.
2.  **Fallback em Clones Limpos:** A pasta `graphify-out/` é ignorada pelo Git. Caso ela não exista no ambiente atual, gere o grafo de código localmente sem API Key usando `python -m graphify update .` (se a CLI estiver instalada) ou prossiga lendo diretamente os módulos relevantes em `app/` e `frontend/`.
3.  **Sincronização Pós-Alteração:** Ao concluir modificações estruturais no código, atualize o grafo local rodando `python -m graphify update .`.

## 📊 Gestão e Rastreabilidade (Linear MCP)
* **Projeto no Linear:** "LicitaDocs"
* **Identificador da Equipe (Team Key):** LIC
* **Regra de Commits:** Todo commit gerado para resolver uma tarefa deve seguir o padrão Conventional Commits com a tag da issue no início da descrição (ex: `feat(core): LIC-12 reestrutura módulo de contratos`).
* **Regra de Atualização:** Antes de iniciar qualquer modificação de código, altere o status da issue correspondente no Linear para "In Progress". Ao finalizar e testar, mova para "Done" utilizando as ferramentas do servidor MCP.

## 📂 Arquitetura e Organização
O projeto adota uma estrutura clara de separação de responsabilidades para garantir escalabilidade e manutenibilidade.

### Backend (MVC/Repository)
Localizado em `app/`, o sistema segue o padrão:
*   `routers/`: Controladores de entrada e definição de rotas (FastAPI).
*   `services/`: Lógica de negócio e orquestração de processos.
*   `repositories/`: Abstração de acesso ao banco de dados e execução de queries.
*   `models/`: Definição de entidades do banco de dados (SQLAlchemy).
*   `schemas/`: Modelos de dados para validação e serialização (Pydantic).

### Frontend (Orchestrator/Feature)
Localizado em `frontend/`, o sistema segue o padrão:
*   `src/pages/`: Atuam como roteadores que invocam as features específicas.
*   `src/features/`: Módulos independentes contendo Orquestradores (Controllers de estado) e componentes de UI.
*   `src/services/`: Camada de execução de chamadas API.
*   `src/types/`: Única fonte da verdade para interfaces e tipos (`index.ts` é o barrel file).

## 📚 Fontes da Verdade (Documentação Obrigatória)
Antes de propor ou implementar qualquer funcionalidade, consulte o grafo de conhecimento e a documentação presente na pasta `docs/`. **Nunca adivinhe regras de negócio ou fluxos do sistema.**
1.  **Sprints e Entregas:** Consulte `docs/historico/sprints/` para entender o momento atual do projeto.
2.  **Release Notes:** Verifique `docs/historico/releases/` para garantir compatibilidade.
3.  **Regras de Código:** O arquivo `docs/arquitetura-e-regras/00REGRAS_CODIGO.md` contém a diretriz suprema do projeto.

## 📐 Regras Técnicas Específicas
*   **Branding:** O nome da aplicação (LicitaDocs) deve ser renderizado como string pura a partir de `APP_CONFIG.name`. Proibido estilização via HTML/CSS segmentado (ex: spans coloridos).
*   **Notificações (Frontend):** A biblioteca `sonner` não suporta `toast.warning()`. Use `toast.error()` ou `toast()` padrão.
*   **Tipagem:** Evite o uso de `any`. Utilize as interfaces centralizadas em `src/types/`.
*   **Testes:** Devem ser co-localizados com o componente/arquivo testado. Frontend utiliza Vitest (`.spec.tsx` ou `.test.tsx`).

## 🚫 Protocolo de Tolerância Zero para Adivinhação (Zero Guessing Policy)
**DIRETRIZ SUPREMA:** É estritamente PROIBIDO supor, adivinhar ou inventar nomes de arquivos, variáveis, funções, classes ou rotas.

1.  **Princípio da Leitura Prévia:** Consulte o grafo (`GRAPH_REPORT.md`) para localizar dependências e leia o arquivo de origem antes de interagir com ele.
2.  **Imutabilidade de Dependências:** Não altere nomes de variáveis ou funções importadas de outros arquivos sem editar a origem.
3.  **PostgreSQL Mandatory:** Nunca altere o driver de banco de dados para SQLite, nem mesmo em ambiente de testes.
4.  **Verificação de Métodos:** Não assuma que métodos existem em classes ou repositórios sem confirmar no código.

## ⚙️ Regras Operacionais
*   **Sincronização de Documentação:** Ao identificar inconsistências estruturais entre estas diretrizes e o código real durante uma tarefa, atualize este arquivo junto com a entrega.

## Roteamento Contextual de Skills (.skills/)
* **Protocolo de Ativação:** Antes de planejar ou editar qualquer código, identifique o domínio da tarefa na tabela abaixo e **leia o(s) `SKILL.md` correspondente(s)** (no máximo **1 ou 2 skills** por tarefa para preservar o contexto), seguindo suas fontes de verdade, regras ativas e checklist de validação.

| Gatilho / Contexto da Tarefa | Caminhos / Módulos-Chave | Skill Obrigatória |
| :--- | :--- | :--- |
| API FastAPI base, PostgreSQL/Alembic, Auth/JWT, RBAC (`admin`/`client`, `MASTER`/`VIEWER`), auditoria, seeds | `app/main.py`, `app/core/`, `app/models/user_model.py`, `company_model.py`, `alembic/`, `scripts/` | `.skills/backend-core-db/SKILL.md` |
| Cofre Digital, upload/download, catálogo de documentos, regras/fila de emissão e crawlers | `app/routers/document_router.py`, `emission_rule_router.py`, `app/services/crawlers/`, `ClientVault`, `CatalogSettings`, `ValidityMonitor` | `.skills/document-vault-crawlers/SKILL.md` |
| Consultor IA (AI Concierge), RAG sobre o cofre, cota diária de tokens e segurança LLM | `app/core/ai_client.py`, `app/services/ai_service.py`, `ai_quota_repository.py`, `features/AIConsultant/` | `.skills/ai-concierge-rag/SKILL.md` |
| Mensageria/Inbox bilateral, E-mail SMTP, WhatsApp e alertas automáticos de vencimento | `app/routers/message_router.py`, `whatsapp_service.py`, `email_service.py`, `document_notification_service.py`, `AdminInbox`, `HelpCenter`, `WhatsAppSection.tsx` | `.skills/communications-notifications/SKILL.md` |
| Prospecção PNCP (CRM anti-SPAM), checkout, assinaturas e webhooks Infinite Pay | `app/routers/pncp_lead_router.py`, `payment_router.py`, `pncp_service.py`, `payment_service.py`, `pages/Admin/Leads/`, `features/Payment/` | `.skills/pncp-crm-payments/SKILL.md` |
| Arquitetura React/TS, rotas, Design System, Zod, declarações `.doc`/`.pdf` e assinatura digital | `frontend/src/App.tsx`, `config/app.config.ts`, `contexts/`, `components/`, `schemas/`, `types/`, `DocumentTemplates`, `DigitalSignature` | `.skills/frontend-architecture-ui/SKILL.md` |
| Testes Pytest/Vitest/Playwright E2E, CI/CD, Docker/Nginx/Compose e governança de legados | `.github/workflows/ci.yml`, `Dockerfile`, `docker-compose*.yml`, `app/tests/`, `frontend/e2e/`, `playwright.config.ts`, `infra/tinybird/` | `.skills/qa-ci-infra-ops/SKILL.md` |

* **Regra de Desempate / Fronteira:** Quando a tarefa cruzar infraestrutura transversal (backend ou frontend) com uma regra de negócio específica (ex.: novo endpoint ou tela para WhatsApp, PNCP ou Pagamentos), carregue **primeiro a skill de domínio** (`communications-notifications`, `pncp-crm-payments`, etc.) e consulte a skill estrutural (`backend-core-db` ou `frontend-architecture-ui`) apenas se precisar alterar padrões base ou transversais.