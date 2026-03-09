# 🗺️ Sprint 19: Garantia de Qualidade Total & QA Senior

**Objetivo:** Consolidar a base do sistema com Testes Unitários e de Integração completos (Backend e Frontend) e, em seguida, submeter o produto a baterias de testes de estresse, segurança e resiliência (Modo QA Senior).
**Status:** Planejamento 📝
**Foco:** Test Pyramid, Code Coverage, Segurança (ACL), Multi-tenancy e Resiliência UX.

---

## 🏗️ FASE 1: A Fundação (Testes Unitários e Integração)
*Objetivo: Garantir que o código base funciona perfeitamente nas condições normais (Caminho Feliz e Erros Mapeados).*

### 🐍 Épico 1.1: Cobertura Base do Backend (Pytest)
* **[US-19.1] Testes Unitários de Schemas e Models**
    * **O que é:** Validar se o Pydantic está barrando dados incorretos e validando formatos (ex: CNPJ, e-mail) antes de bater no banco.
* **[US-19.2] Testes de Integração de Repositórios**
    * **O que é:** Testar todos os métodos de CRUD (`CompanyRepository`, `DocumentRepository`, `UserRepository`) interagindo com o banco de dados em memória (SQLite/Test DB).
* **[US-19.3] Testes de Integração das Rotas (Endpoints)**
    * **O que é:** Bater em todas as rotas da API com o `TestClient` para validar os status HTTP (200, 201, 400, 404) e a estrutura do JSON de resposta.

### ⚛️ Épico 1.2: Cobertura Base do Frontend (Vitest + RTL)
* **[US-19.4] Testes Unitários de Serviços (API Mocks)**
    * **O que é:** Usar mocks (ex: `axios-mock-adapter`) para garantir que o `documentService.ts` formata os payloads corretamente antes de enviar.
* **[US-19.5] Testes de Renderização de Componentes**
    * **O que é:** Garantir que componentes vitais (`UploadModal`, `CompanyVault`, `SettingsPage`) renderizam em tela sem crashar ao receber dados válidos.
* **[US-19.6] Testes de Fluxo e Interação (Integração UI)**
    * **O que é:** Simular o clique do usuário no formulário de login e no upload de arquivos, validando se as funções corretas são chamadas.

---

## 🌪️ FASE 2: Hardening & QA Senior (O Estresse)
*Objetivo: Tentar quebrar o sistema intencionalmente. Agir como um usuário caótico, um hacker ou uma rede instável.*

### 🛡️ Épico 2.1: Auditoria de Segurança e Isolamento (Backend)
* **[QA-19.7] Bypass de Autenticação e Permissões (ACL)**
    * **Cenário:** Forçar requisições em rotas `/settings` (Admin) utilizando um token JWT de um usuário com role `CLIENT`. 
    * **Critério:** O sistema deve barrar 100% das tentativas com `HTTP 403 Forbidden`.
* **[QA-19.8] Violação de Multi-tenancy (Isolamento de Dados)**
    * **Cenário:** Cliente da Empresa "A" descobre a URL de download de um documento da Empresa "B" e tenta acessá-lo.
    * **Critério:** O Backend deve cruzar o `company_id` do token com o do documento e bloquear com `HTTP 404/403`.
* **[QA-19.9] Injeção de Payloads Corrompidos (Edge Cases)**
    * **Cenário:** Envio de PDFs com 0 bytes, arquivos maliciosos disfarçados de `.pdf`, strings de 5000 caracteres no campo "Nome do Documento".

### 🚧 Épico 2.2: Resiliência e Prevenção de Caos (Frontend)
* **[QA-19.10] Simulação de Internet Instável (Network Throttling)**
    * **Cenário:** O que acontece se a requisição de upload demorar 30 segundos ou cair no meio?
    * **Critério:** O UI deve exibir Spinners/Skeletons corretos e um `toast.error` caso dê "Network Error", sem quebrar a tela (White Screen of Death).
* **[QA-19.11] Proteção contra o "Usuário Metralhadora" (Race Conditions)**
    * **Cenário:** O usuário clica 15 vezes em "Salvar" no espaço de 2 segundos.
    * **Critério:** Implementação de bloqueios rigorosos (`disabled={isLoading}`) e/ou `Debounce` para garantir que apenas 1 requisição seja disparada para a API.

---

## 🛠️ Plano Técnico de Execução
1. Configurar suíte de testes do React (`Vitest` + `@testing-library/react`).
2. Auditar e expandir a suíte atual do `Pytest`.
3. Executar o relatório de cobertura (`coverage report`) buscando a meta de 90%.
4. Corrigir os bugs encontrados durante a fase de estresse.

---

## 📝 Definição de Pronto (DoD)
* [ ] Pipeline de testes do Backend executando todas as rotas com > 90% de cobertura.
* [ ] Fluxos críticos do Frontend testados e passando.
* [ ] Matriz de segurança provando que o isolamento de empresas (Multi-tenancy) é inviolável.
* [ ] Zero possibilidade de envios duplicados no frontend por duplo-clique.