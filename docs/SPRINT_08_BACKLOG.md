# 📋 Backlog da Sprint 08: Operação Concierge & IA Contextual

**Objetivo Estratégico:** Implementar a separação de interfaces (Cliente vs Admin) e atualizar a IA para explicar documentos específicos.
**Foco:** Frontend (UX) e Regras de Permissão.

---

## 🚀 Épico 1: A Interface da Operação (Admin)
*Onde nós trabalhamos para o cliente.*

### [TASK-01] Painel de Gestão de Clientes (Frontend)
* **O que é:** Uma tela exclusiva para usuários com role `ADMIN`.
* **Funcionalidade:**
    * Listar todas as empresas cadastradas.
    * Botão "Gerenciar Documentos" ao lado de cada empresa.
* **Técnico:** Criar rota `/admin/companies` e conectar com `companyService.getAll`.

### [TASK-02] Upload Administrativo (Frontend)
* **O que é:** O formulário de upload que removemos do cliente, agora turbinado para o Admin.
* **Funcionalidade:**
    * O Admin seleciona o arquivo.
    * O Admin define a data de vencimento (Metadado crucial para o modelo Concierge).
    * O sistema envia usando a rota que aceita `target_company_id`.
* **Técnico:** Reutilizar o componente de Upload, mas passando o ID da empresa selecionada na Task-01.

---

## 👁️ Épico 2: A Vitrine do Cliente (Read-Only)
*Onde o cliente consome o serviço.*

### [TASK-03] Dashboard "Meu Cofre" (Frontend)
* **O que é:** A nova Home do Cliente.
* **Mudança:**
    * Remover botão de "Novo Documento".
    * Melhorar a tabela de listagem: adicionar coluna "Status" (Válido/Vencendo/Vencido).
    * Adicionar badges visuais (Verde/Amarelo/Vermelho).
* **Técnico:** Alterar `DocumentsList` para esconder ações de edição baseadas na `role` do usuário.

### [TASK-04] Redirecionamento Inteligente (Auth)
* **O que é:** Ao logar, o sistema decide para onde o usuário vai.
* **Lógica:**
    * Se `role == 'admin'` -> Vai para `/admin/dashboard`.
    * Se `role == 'client'` -> Vai para `/app/my-documents`.
* **Técnico:** Ajustar o `AuthContext` ou o componente de Rotas Privadas.

---

## 🤖 Épico 3: IA Contextual (RAG Simples)
*O "Tira-Dúvidas" do documento.*

### [TASK-05] Botão "Explicar Documento"
* **O que é:** Um botão na linha de cada documento na listagem.
* **Ação:** Ao clicar, abre o chat lateral já carregando o contexto: *"Gostaria de saber sobre o documento [Nome do PDF]..."*.
* **Técnico:** Passar o `document_id` ou o texto extraído para o prompt do Gemini.

### [TASK-06] Atualização da Lib Google (Dívida Técnica)
* **O que é:** Trocar `google.generativeai` por `google.genai`.
* **Motivo:** Evitar que a IA pare de funcionar nas próximas semanas (Warning nos logs).

---

## 📅 Planejamento Sugerido
1.  **Dia 1-2:** Frontend Admin (Tasks 01 e 02). *Precisamos disso para colocar arquivos no sistema.*
2.  **Dia 3:** Frontend Cliente (Tasks 03 e 04). *Limpar a visão do usuário.*
3.  **Dia 4:** Migração da Lib IA (Task 06) e Integração do Chat (Task 05).
4.  **Dia 5:** Testes e Ajustes Finais.