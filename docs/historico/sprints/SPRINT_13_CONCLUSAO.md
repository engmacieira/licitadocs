# 🏁 Log de Sprint: 13 - Fluxo de Onboarding SaaS (Self-Service)

**Período:** 05/02/2026
**Status:** Concluído
**Metodologia:** Kanban (Fluxo Contínuo)
**Foco:** Implementação do funil de entrada de novos clientes (Landing Page -> Cadastro -> Pagamento -> Acesso).

## 🚀 Entregas Realizadas (O Que)

### Frontend (Onboarding)
* **[Landing Page]** Página pública (`/`) reestruturada para venda do serviço ("Automação de Certidões").
* **[Cadastro Wizard]** Formulário de registro em etapas:
    * Coleta de dados (CNPJ, Email, Senha).
    * Upload de arquivos obrigatórios (Contrato Social, Cartão CNPJ).
* **[Formalização]** Tela de assinatura digital simulada de Contrato e Procuração.
* **[Pagamento]** Tela de Checkout mockada (simulação) que ativa o usuário.

### Backend (API)
* **[Auth]** Novo endpoint `POST /auth/register` suportando `multipart/form-data`.
    * Recebe JSON e Arquivos binários simultaneamente.
    * Implementa regra de negócio: Cria Empresa + Cria Usuário (Inativo/Client) + Salva Arquivos.
* **[Pagamento]** Novo endpoint `POST /auth/simulate-payment` para alterar status do usuário de `False` para `True`.
* **[Storage]** Implementação do `file_helper.py` para salvar arquivos fisicamente na pasta `storage/uploads`.

## 🧠 Retrospectiva (O Como)

### ✅ O que funcionou bem?
* **Fluxo Kanban:** A quebra em cards menores (Landing, Register, Contract, Payment) permitiu testar cada etapa isoladamente.
* **Upload Simples:** Decidir salvar os documentos de cadastro como `Documents` genéricos (ao invés de tentar forçar na tabela `Certificates`) destravou o desenvolvimento.

### ⚠️ Obstáculos & Lições Aprendidas
* **Idioma do Banco de Dados:** Tivemos problemas de `TypeError` críticos.
    * *Causa:* O Frontend enviava campos em Inglês (`legal_name`), mas o Model SQL estava em Português (`razao_social`).
    * *Solução:* Realizamos o mapeamento manual ("De/Para") dentro do `auth_router.py`.
* **Permissões (Roles):** Inicialmente o cadastro criava usuários `admin`. Corrigimos para criar `client` e iniciar com `is_active=False` para forçar o fluxo de pagamento.

---

## 📊 Status Final
* **Sistema:** Agora permite que qualquer empresa se cadastre sozinha.
* **Dados:** Os arquivos (PDFs) estão sendo salvos em disco local (`storage/`), o que não é ideal para produção em nuvem (Docker/Kubernetes efêmeros).
* **Próximos Passos:** Iniciar o desenvolvimento do "Robô" ou da Gestão de Certidões (Sprint 14).

---
**Assinatura:** Tech Lead & Dev (Matheus e Mark)