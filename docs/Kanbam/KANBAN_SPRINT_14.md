# 🏗️ Kanban Board: Painel Administrativo (Sprint 14)

**Objetivo:** Transformar o sistema em uma ferramenta de trabalho para o Operador/Admin.

---

## 🚨 DOING (Em Andamento Agora)

* **[Card 01] Sidebar & Menus Dinâmicos**
    * [ ] Ajustar `Sidebar.tsx` para ler o `user.role`.
    * [ ] Criar lista de links para Admin (`/admin/...`).
    * [ ] Criar lista de links para Client (`/dashboard`, `/documents`).
    * [ ] Testar navegação com os dois tipos de usuário.

---

## 📅 TO DO (Fila de Espera)

### [Card 02] Gestão de Empresas (Status)
* [ ] Conectar `CompaniesPage` ao endpoint `GET /companies`.
* [ ] Adicionar colunas: CNPJ, Razão Social, Status, Data Cadastro.
* [ ] Implementar botão de ação "Ativar/Inativar" (Chamada `PATCH /companies/{id}`).

### [Card 03] Detalhes da Empresa (Audit)
* [ ] Criar rota `/admin/companies/:id`.
* [ ] Exibir Header com dados da empresa.
* [ ] Exibir Lista de Documentos já enviados (Contrato Social/CNPJ).
* [ ] Permitir download desses arquivos para conferência.

### [Card 04] Upload Administrativo
* [ ] Adicionar botão "Adicionar Certidão" na tela de detalhes.
* [ ] Reutilizar/Adaptar componente de Upload para enviar já com o `company_id` pré-selecionado.

---

## ✅ DONE
* (Vazio - Início da Sprint)