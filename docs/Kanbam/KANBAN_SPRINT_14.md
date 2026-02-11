# 🏗️ Kanban Board: Painel Administrativo (Sprint 14)

**Objetivo:** Transformar o sistema em uma ferramenta de trabalho para o Operador/Admin.

---

## 🚨 DOING (Em Andamento Agora)



---

## 📅 TO DO (Fila de Espera)


---

## ✅ DONE
* [Card 01] Sidebar & Menus Dinâmicos
    * [x] Ajustar `Sidebar.tsx` para ler o `user.role`.
    * [x] Criar lista de links para Admin (`/admin/...`).
    * [x] Criar lista de links para Client (`/dashboard`, `/documents`).
    * [x] Testar navegação com os dois tipos de usuário.

* [Card 02] Gestão de Empresas (Status)
    * [x] Conectar `CompaniesPage` ao endpoint `GET /companies`.
    * [x] Adicionar colunas: CNPJ, Razão Social, Status, Data Cadastro.
    * [x] Implementar botão de ação "Ativar/Inativar" (Chamada `PATCH /companies/{id}`).

* [Card 03] Detalhes da Empresa (Audit)
    * [x] Criar rota `/admin/companies/:id`.
    * [x] Exibir Header com dados da empresa.
    * [x] Exibir Lista de Documentos já enviados (Contrato Social/CNPJ).
    * [x] Permitir download desses arquivos para conferência.

* [Card 04] Upload Administrativo
    * [x] Adicionar botão "Adicionar Certidão" na tela de detalhes.
* [x] Reutilizar/Adaptar componente de Upload para enviar já com o `company_id` pré-selecionado.
