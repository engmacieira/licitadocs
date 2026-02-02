# LicitaDoc

Sistema para gestão de documentos de licitação com suporte a Inteligência Artificial.

## 🚀 Tecnologias

O projeto é desenvolvido utilizando uma arquitetura moderna Full Stack:

### Backend (API)
- **Linguagem**: Python
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Banco de Dados**: SQLite

### Frontend (Interface)
- **Framework**: React (Vite)
- **Linguagem**: TypeScript
- **Estilização**: TailwindCSS
- **Gerenciamento de Estado/Rotas**: React Router, React Hook Form
- **Validação**: Zod
- **Ícones**: Lucide React

## 💻 Funcionalidades

- **Autenticação**: Sistema de login e controle de acesso.
- **Gestão de Documentos**: Criação, edição e visualização de documentos de licitação.
- **Inteligência Artificial**: Módulo de IA integrado para auxílio na gestão documental.
- **Painel Administrativo**: Ferramentas para administração do sistema.

## 📦 Como Rodar o Projeto

### Pré-requisitos
- Python 3.8+
- Node.js 18+

### 1. Configuração do Backend

```bash
# Clone o repositório
git clone <seu-repo>
cd licitadocs

# Crie e ative um ambiente virtual (Recomendado)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Execute a API
uvicorn app.main:app --reload
```

O backend estará rodando em: `http://localhost:8000`
Documentação da API (Swagger): `http://localhost:8000/docs`

### 2. Configuração do Frontend

```bash
# Abra um novo terminal e entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em: `http://localhost:5173`

## 🛠 Estrutura do Projeto

- `app/`: Código fonte do Backend (FastAPI)
  - `routers/`: Rotas da API (Auth, Documents, Admin, AI)
  - `models/`: Modelos de banco de dados
  - `schemas/`: Schemas Pydantic para validação
- `frontend/`: Código fonte do Frontend (React/Vite)