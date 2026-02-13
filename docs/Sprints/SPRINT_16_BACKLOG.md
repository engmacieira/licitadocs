# Sprint 16: Refatoração Frontend, Estabilidade e UI/UX

**Período Sugerido:** 14/02/2026 - 21/02/2026
**Status:** 🚧 PLANEJADO
**Foco:** Estabilidade do Sistema, Refatoração de Código e Melhoria da Experiência do Usuário (sem novas features de negócio).

---

## 🎯 Objetivos Principais
1.  **Blindagem do Frontend:** Garantir que o sistema reaja elegantemente a erros (401, 403, 500) sem "tela branca" ou travamentos.
2.  **Padronização Visual:** Eliminar código duplicado (tabelas, modais, headers) criando componentes reutilizáveis.
3.  **Polimento do Admin:** Atualizar as telas administrativas para refletir o novo contexto Multi-Tenant (ex: ver a qual empresa um documento pertence).
4.  **Responsividade:** Ajustar o Sidebar e Tabelas para telas menores.

---

## 📋 Backlog de Tarefas

### 🔴 Prioridade Alta (Estabilidade & Arquitetura)

- [ ] **Interceptor de Axios Global:**
    - Criar interceptor para capturar erros `401 Unauthorized` (token expirado) e redirecionar para login automaticamente.
    - Capturar erros `403 Forbidden` e mostrar Toast/Modal amigável ("Você não tem permissão para esta empresa").
- [ ] **Refatoração do `Sidebar` Mobile:**
    - O Sidebar atual é fixo. Criar versão responsiva (Menu Hambúrguer) para telas menores que desktop.
- [ ] **Componente `DataTable` Reutilizável:**
    - Criar componente genérico para Tabelas (usado em Documentos, Empresas, Membros).
    - Deve suportar: *Loading State* (Skeleton), *Empty State* (Ilustração quando vazio) e *Paginação* (preparação).

### 🟡 Prioridade Média (UX & Admin)

- [ ] **Admin: Coluna "Empresa" na Lista de Documentos:**
    - Na tela `/admin/upload` e listagens gerais, adicionar coluna mostrando a `Razão Social` da empresa dona do arquivo (hoje só mostra o arquivo).
- [ ] **Admin: Detalhes da Empresa (`/admin/companies/:id`):**
    - Melhorar a visualização dos dados da empresa (hoje é um JSON ou lista simples). Mostrar cards com total de documentos e lista de membros daquela empresa.
- [ ] **Feedback de "Loading" Global:**
    - Adicionar uma barra de progresso no topo (tipo nProgress) ou indicador visual quando houver navegação entre rotas (`isLoading` do React Router).

### 🟢 Prioridade Baixa (Polimento Visual)

- [ ] **Padronização de Ícones:** Revisar se estamos usando `lucide-react` em tudo (remover ícones antigos ou SVGs soltos).
- [ ] **Página 404 Personalizada:** Criar uma tela de "Não Encontrado" bonita, com botão para voltar ao Dashboard.
- [ ] **Melhoria nos Modais:** Padronizar os modais de "Novo Documento" e "Convidar Membro" para usarem o mesmo componente base (`Dialog` do Radix ou similar, ou nosso próprio componente customizado).

---

## 🔧 Dívida Técnica (Backend Cleanup)
*Embora o foco seja Front, algumas limpezas no Back ajudam o Front.*

- [ ] **Sanitização de Retornos:** Garantir que o endpoint `/users/me` não esteja retornando a senha (hash) no JSON.
- [ ] **Performance:** Verificar se o endpoint de Dashboard está fazendo N+1 queries ao buscar documentos recentes.

---

## 📅 Definição de Pronto (DoD)
1.  Nenhum erro de console (vermelho) ao navegar pelo fluxo completo.
2.  Logout automático funcionando ao invalidar token.
3.  Tabelas responsivas (scroll horizontal em mobile).
4.  Admin consegue identificar de qual empresa é cada documento.