# 🧭 Por Onde Começar - Sprint 15: Professionalização & Multi-Tenancy

Este guia define a trilha técnica para implementar a arquitetura de múltiplas empresas e o cadastro completo. **Siga esta ordem estritamente** para evitar inconsistências no banco de dados.

---

## 🛑 Pré-requisito Crítico: Backup
Antes de rodar qualquer migration, faça um backup do seu arquivo `licita_doc.db`.
```bash
cp licita_doc.db licita_doc_backup_sprint14.db
👣 Passo 1: O Coração (Database Models)
Não adianta mexer no Frontend se o Backend não tiver onde salvar os dados.

1. Criar a Tabela Associativa (app/models/user_model.py) Precisamos transformar a relação 1:N em N:N.

Remova (ou comente para depreciação futura) o campo company_id em User.

Crie a tabela user_company_link (ou company_members).

Adicione os novos campos em User (cpf, rg, etc).

Python
# Exemplo de estrutura para user_company_link
class UserCompanyLink(Base):
    __tablename__ = "user_company_links"
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), primary_key=True)
    role = Column(String, default="VIEWER") # 'MASTER' ou 'VIEWER'
    created_at = Column(DateTime, default=func.now())
2. Expandir a Empresa (app/models/company_model.py)

Adicione os campos de endereço, telefone, responsável, etc.

3. Gerar a Migration

Bash
alembic revision --autogenerate -m "sprint_15_multitenancy_structure"
alembic upgrade head
👣 Passo 2: Migração de Dados (Script)
Agora que a tabela nova existe, precisamos mover os vínculos antigos para ela, senão os usuários atuais perdem o acesso às suas empresas.

Tarefa: Criar e rodar app/scripts/migrate_v1_to_multitenancy.py.

Lógica: Para cada usuário que tem company_id preenchido na tabela users:

Criar um insert na tabela user_company_links.

Definir role = 'MASTER' (pois eles criaram a empresa).

(Opcional) Limpar o company_id da tabela users depois.

👣 Passo 3: O Backend (Schemas & Auth)
1. Atualizar Schemas (app/schemas/)

user_schemas.py: Adicionar CPF, RG, Celular.

company_schemas.py: Adicionar Endereço completo, Responsável, etc.

2. Refatorar Registro (app/routers/auth_router.py) Aqui implementamos a lógica dos 3 cenários de conflito:

Verificar se CNPJ já existe CompanyRepository.get_by_cnpj.

Verificar se Email já existe UserRepository.get_by_email.

Se Email Novo + CNPJ Novo -> Cria User, Cria Company, Cria Link (Master).

Se Email Novo + CNPJ Existente -> Erro 400: "Empresa já cadastrada. Solicite acesso ao administrador."

Se Email Existente + CNPJ Novo -> Erro 400: "Você já possui cadastro. Faça login para adicionar nova empresa."

3. Endpoint de Membros (app/routers/company_router.py ou novo member_router.py)

POST /companies/{id}/members:

Recebe email/nome/cpf.

Cria usuário com senha provisória (ex: Mudar123!).

Cria link na tabela associativa com role selecionada.

👣 Passo 4: O Frontend (Infraestrutura)
1. Instalar Dependências

Bash
cd frontend
npm install react-input-mask zod react-hook-form
2. Atualizar Tipagens (src/services/) Atualize as interfaces User e Company para refletir os novos campos do banco.

3. Contexto de Autenticação (AuthContext.tsx) O login agora pode retornar uma lista de empresas.

Se retornar 1 empresa -> Loga direto nela.

Se retornar > 1 -> Mostra modal de seleção ou redireciona para rota /select-company.

Precisamos guardar currentCompany no estado global.

👣 Passo 5: O Frontend (Telas)
1. Novo Registro (src/pages/Register) Transforme a tela atual em um "Wizard" ou formulário longo segmentado:

Seção 1: Dados de Acesso (Email/Senha).

Seção 2: Dados do Responsável (CPF, Nome, RG).

Seção 3: Dados da Empresa (CNPJ, Razão, Endereço).

Uso obrigatório: Máscaras de input.

2. Gestão de Equipe (src/pages/Admin/Team)

Lista os usuários da currentCompany.

Botão "Convidar Membro" (Modal).

Exibe a senha provisória num Alert após criar.

3. Minha Empresa & Meus Dados

Telas de formulário simples para editar os dados (PUT).

🎯 Resumo da Sequência Lógica
Backend (Models + Migration): Prepara o terreno.

Script de Dados: Salva os usuários atuais.

Backend (API): Prepara as rotas para receber os dados complexos.

Frontend: Cria as interfaces para enviar esses dados.

Dica de Ouro: Teste o fluxo de "CNPJ Duplicado" exaustivamente. É o erro mais comum em sistemas multi-tenant.