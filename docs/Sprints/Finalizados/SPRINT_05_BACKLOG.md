# 🗺️ Sprint 05: Frontend Foundation (O Rosto do Produto)

**Objetivo:** Construir a base da aplicação React (SPA), configurar o roteamento, estilização global e integrar o fluxo de Autenticação (Login/Logout) com o Backend.
**Status:** Planejamento
**Stack:** React + TypeScript + Vite + Tailwind CSS.

---

## 🎯 Backlog de Funcionalidades

### 🏗️ 1. Infraestrutura Frontend
* **[US-13] Setup de Dependências e Roteamento**
    * Instalar bibliotecas essenciais: `react-router-dom` (navegação), `axios` (requisições HTTP), `lucide-react` (ícones), `clsx/tailwind-merge` (utilitários de classe).
    * Configurar o `BrowserRouter` no `main.tsx`.
    * Criar estrutura de pastas organizada (`src/components`, `src/pages`, `src/contexts`, `src/services`).

* **[US-14] Gerenciamento de Estado (AuthContext)**
    * Criar um Contexto Global (`AuthProvider`) para gerenciar:
        * Token JWT (salvar no `localStorage`).
        * Dados do Usuário (`user`, `role`).
        * Status de Login (`isAuthenticated`).
    * Criar componente `ProtectedRoute`: Impede que usuários não logados acessem o painel.

### 🔐 2. Autenticação e Telas Públicas
* **[US-15] Tela de Login (A "Vitrine")**
    * Desenvolver formulário de Login (Email/Senha) com visual profissional.
    * Feedback visual de erro (ex: "Senha incorreta" em vermelho).
    * Feedback de carregamento (Spinner no botão "Entrar").
    * Conectar com o endpoint `POST /auth/login`.

### 🖥️ 3. Área Logada (Dashboard Shell)
* **[US-16] Layout Principal (App Shell)**
    * Criar o esqueleto da área administrativa:
        * **Sidebar Lateral:** Menu de navegação (Dashboard, Documentos, IA, Configurações).
        * **Header:** Boas-vindas e botão de Logout.
        * **Área de Conteúdo:** Onde as páginas serão renderizadas.
    * Diferenciação visual sutil entre Admin e Cliente (opcional por enquanto).

---

## 🛠️ Plano Técnico de Execução

1.  **Instalação:** Adicionar `axios`, `react-router-dom` e `lucide-react`.
2.  **API Client:** Criar `src/services/api.ts` configurando o Axios com a `baseURL` do backend (localhost:8000).
3.  **Auth:** Implementar o `AuthContext.tsx`.
4.  **Pages:** Criar `LoginPage.tsx` e `DashboardPage.tsx`.
5.  **Router:** Configurar as rotas `/login` (pública) e `/dashboard` (privada).

---

## 📝 Definição de Pronto (DoD)
* [ ] Usuário consegue acessar `/login`, digitar credenciais e clicar em entrar.
* [ ] Se sucesso: Token é salvo no navegador e usuário é redirecionado para `/dashboard`.
* [ ] Se erro: Mensagem de erro aparece na tela.
* [ ] Usuário tenta acessar `/dashboard` sem logar e é "chutado" de volta para o login.
* [ ] Botão de Logout limpa o token e volta para a tela inicial.
* [ ] O visual utiliza Tailwind CSS e parece profissional.