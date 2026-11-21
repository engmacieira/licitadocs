# 🏁 Log de Sprint: Sprint 05 - Frontend Foundation

**Período:** 18/01/2026 até 21/01/2026
**Status:** ✅ Concluído
**Objetivo Principal:** Construir a fundação do Frontend (React), integrar a Autenticação e habilitar as funcionalidades principais (Documentos e IA).

## 🚀 Entregas Realizadas (O Que)

### 1. Infraestrutura Frontend (React + Vite)
* **[Setup]** Configuração do projeto com React, TypeScript e Tailwind CSS v4.
* **[Arquitetura]** Estrutura de pastas organizada (`services`, `pages`, `contexts`, `components`).
* **[Rotas]** Configuração do `react-router-dom` com `ProtectedRoute` para bloquear acesso não autorizado.

### 2. Autenticação e Segurança
* **[Login]** Tela de login integrada ao endpoint `/auth/login`.
* **[Contexto]** `AuthContext` implementado para persistir o Token JWT no `localStorage` e injetá-lo automaticamente nas requisições (Axios Interceptors).
* **[Logout]** Funcionalidade de sair e limpar sessão.

### 3. Gestão de Documentos (O Core)
* **[Listagem]** Tela "Meus Documentos" consumindo `GET /documents/`.
* **[Upload]** Funcionalidade de envio de arquivos PDF (`POST /documents/upload/`).
* **[Correção Crítica]** Resolução de problemas de CORS/Proxy e redirecionamento de "Trailing Slash" no FastAPI.

### 4. Inteligência Artificial (Consultor)
* **[Chat Interface]** Interface estilo "WhatsApp" para conversar com a IA.
* **[Integração]** Conexão do Frontend com o serviço `ai_service` (Gemini), permitindo perguntas sobre o catálogo de documentos.

---

## 🛑 O Que Ficou de Fora (Desvios)
* **Edição de Metadados:** O upload envia apenas o arquivo. A edição de data de validade e outros campos ficou para o futuro.
* **Feedback Visual Avançado:** Estamos usando `alert()` nativo. O uso de "Toasts" (notificações bonitas) foi movido para Dívida Técnica.

---

## 🧠 Retrospectiva (O Como)

### ✅ O que funcionou bem?
* **Tailwind CSS:** A velocidade de estilização foi altíssima. Conseguimos montar layouts complexos (Sidebar, Chat) em minutos.
* **Arquitetura de Serviços:** Isolar a lógica de API em `services/` (ex: `documentService.ts`) facilitou muito a manutenção e os testes de conexão.
* **Monorepo:** Ter Backend e Frontend lado a lado agilizou a consulta de nomes de campos e rotas.

### ⚠️ O que travou ou atrapalhou?
* **Duplicação de Rotas:** Perdemos horas investigando falha de rede/proxy, quando o problema era uma linha duplicada no `App.tsx` que carregava um componente placeholder antigo. **Lição Aprendida.**
* **Trailing Slashes (Barras no final):** O FastAPI redireciona `/rota` para `/rota/` (307 Redirect), e o navegador remove o cabeçalho de Autorização nesse processo, causando erros 401 misteriosos.
* **Cache do Vite:** Em alguns momentos, alterações no código não refletiam na tela sem um "Hard Reload".

### 🔧 Ações de Melhoria
* **Verificação de Rotas:** Sempre verificar o `App.tsx` e o `Network Tab` antes de assumir erro de Backend.
* **Padrão de URL:** Adotar o padrão de sempre usar a barra (`/`) no final das URLs no frontend para evitar redirects.

---

## 📊 Métricas Finais
* **Novos Componentes:** ~12 componentes React criados.
* **User Stories Entregues:** 4 (US-13, US-14, US-16, US-17, US-18).
* **Bugs Críticos Resolvidos:** 2 (Proxy 304, Rota Duplicada).