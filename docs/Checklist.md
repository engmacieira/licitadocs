# 🚀 Manual de Início Rápido: AgroLocal

Bem-vindo ao seu novo projeto! Este guia contém os passos essenciais para rodar o ambiente de desenvolvimento (Backend + Frontend).

## 1. Configuração do Backend (Python/FastAPI)

1. **Ambiente Virtual:**
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Para desativar:
   deactivate
   
2. **Dependências:**
    pip install -r requirements.txt
    
3. **Banco de Dados (Alembic): Se for a primeira vez:**
    alembic init alembic
    # (Configure o alembic.ini e env.py para apontar para app.models)
    
    Para rodar as migrações:
    
    alembic revision --autogenerate -m "Initial migration"
    alembic upgrade head
    
4. **Rodar o Servidor:**
    uvicorn app.main:app --reload

## 2. Configuração do Frontend (React + TypeScript + Vite)

A pasta frontend foi criada. Para iniciar o projeto React nela:

1. **Inicializar o Vite (se a pasta estiver vazia):**
    cd frontend
    npm create vite@latest . -- --template react-ts
    
2. **Instalar Dependências:**
    npm install
    
3. **Rodar o Frontend:**
    npm rum dev
    Acesse: http://localhost:5173
    
## 3. Configurar GIT (Primeiro Commit)

1. Comando: git init
   Comando: git add .
   Comando: git commit -m "feat: estrutura inicial"
   *Lembrete: Crie o repositório no GitHub para dar o push.

2. CONTROLE DE VERSÃO E GITHUB
    - git add .
    - git commit -m "..."
    - git push

## 4. Demais Informações Ùteis para mim

1. COMANDOS ÚTEIS
    - Rodar Testes: python -m pytest
    - Rodar Testes com Coverage: pytest --cov=app
    - Rodar Testes exibindo erros: pytest -vv
    - Gerar requirements.txt atualizado: pip freeze > requirements.txt
    - Gerar os logs do teste > txt/log_pytest.txt 2>&1  
    
2. ERROS COMUNS
    - O "Pegadinha" do VS Code (Interpretador). 
        - Aperte Ctrl+Shift+P
        - Digite "Python: Select Interpreter"

## 5. Gestão e Documentação

Histórico: Mantenha os logs de sprint na pasta docs/.

Tarefas: Consulte docs/USER_STORIES.md para o backlog.

Dívidas: Registre débitos técnicos em docs/DividasTecnicas.md.

Bom código! 🚀 