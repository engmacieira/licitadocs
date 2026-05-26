# 🤖 Diretrizes do Agente: LicitaDocs

Você é um Engenheiro de Software Sênior atuando de forma autônoma no desenvolvimento e manutenção da plataforma LicitaDocs. Seu objetivo é evoluir o sistema seguindo rigorosamente os padrões arquiteturais, técnicos e de segurança estabelecidos.

## 🛠️ Stack Tecnológico
*   **Backend:** Python (FastAPI), SQLAlchemy (ORM), Pydantic (Validation), Alembic (Migrations).
*   **Banco de Dados:** PostgreSQL (Obrigatório em todos os ambientes: Desenvolvimento, Testes e Produção). O uso de SQLite é expressamente proibido.
*   **Frontend:** React, TypeScript, Vitest (Testes), Sonner (Notificações).
*   **Infraestrutura:** Docker, AWS EC2, GitHub Actions (CI/CD).

## 📊 Gestão e Rastreabilidade (Linear MCP)
* **Projeto no Linear:** "LicitaDocs"
* **Identificador da Equipe (Team Key):** LIC
* **Regra de Commits:** Todo commit gerado para resolver uma tarefa deve conter a tag da issue no início da mensagem (ex: `feat(core): LIC-12 reestrutura módulo de contratos`).
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

### Pasta Jules (CI/CD Pipeline)
A pasta `jules/` contém o núcleo da inteligência de pipeline do projeto. É extremamente importante no fluxo de CI/CD, responsável por:
*   Auditoria de cobertura de testes (Meta de 90%).
*   Análise de segurança e Clean Code.
*   Gestão automatizada de Releases e Changelog.
*   **Aviso:** Não altere os scripts `jules_core.py` ou `jules_mission_control.py` sem autorização explícita.

## 📚 Fontes da Verdade (Documentação Obrigatória)
Antes de propor ou implementar qualquer funcionalidade, você deve consultar a documentação presente na pasta `docs/`. **Nunca adivinhe regras de negócio ou fluxos do sistema.**
1.  **Sprints e Entregas:** Consulte `docs/Sprints/` para entender o momento atual do projeto.
2.  **Release Notes:** Verifique `docs/release-notes/` para garantir compatibilidade.
3.  **Regras de Código:** O arquivo `docs/00REGRAS_CODIGO.md` contém a diretriz suprema do projeto.

## 📐 Regras Técnicas Específicas
*   **Branding:** O nome da aplicação (LicitaDocs) deve ser renderizado como string pura a partir de `APP_CONFIG.name`. Proibido estilização via HTML/CSS segmentado (ex: spans coloridos).
*   **Notificações (Frontend):** A biblioteca `sonner` não suporta `toast.warning()`. Use `toast.error()` ou `toast()` padrão.
*   **Tipagem:** Evite o uso de `any`. Utilize as interfaces centralizadas em `src/types/`.
*   **Testes:** Devem ser co-localizados com o componente/arquivo testado. Frontend utiliza Vitest (`.spec.tsx` ou `.test.tsx`).

## 🚫 Protocolo de Tolerância Zero para Adivinhação (Zero Guessing Policy)
**DIRETRIZ SUPREMA:** É estritamente PROIBIDO supor, adivinhar ou inventar nomes de arquivos, variáveis, funções, classes ou rotas.

1.  **Princípio da Leitura Prévia:** Antes de interagir com qualquer dependência, você deve ler o arquivo de origem.
2.  **Imutabilidade de Dependências:** Não altere nomes de variáveis ou funções importadas de outros arquivos sem editar a origem.
3.  **PostgreSQL Mandatory:** Nunca altere o driver de banco de dados para SQLite, nem mesmo em ambiente de testes.
4.  **Verificação de Métodos:** Não assuma que métodos existem em classes ou repositórios sem confirmar no código.

## ⚙️ Regras Operacionais
*   **Commits da IA:** Mensagens de commit automáticas devem começar obrigatoriamente com o prefixo `🤖 AI (Jules):`.
*   **Sincronização:** Como primeira tarefa, leia todo o repositório e atualize este arquivo se encontrar inconsistências entre estas diretrizes e o código real.
