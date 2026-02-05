Sprint 0: Setup e Fundação

1. A Pilha Tecnológica (Stack)
- Backend: Python + FastAPI (Assíncrono, rápido e gera documentação automática).
- Banco de Dados: SQLite para desenvolvimento (rápido) -> PostgreSQL para produção.
- ORM: SQLAlchemy (para gerenciar as tabelas).
- Frontend: HTML/CSS/JS modulares (sem frameworks pesados como React por enquanto, vamos focar na entrega de valor rápido com Jinja2 ou fetch API puro, mantendo a estrutura static/css e static/js separada).

2. Planejamento do MVP (Minimum Viable Product)
- Autenticação (Auth): Login seguro (JWT) para as empresas.
- CRUD de Empresas: Cadastro dos dados básicos (CNPJ, Razão Social).
- Gestor de Documentos (O Coração):
- Upload de arquivo (PDF).
- Definição de data de validade.
- Status (Válido, Vencendo, Vencido).

3. Protocolos de Segurança e Qualidade (Nível Comercial)

3.1. Segurança de Credenciais (.env): O setup.py já cria um .env básico. A regra é: JAMAIS comitar este arquivo. Se vazar uma chave de API ou senha de banco no GitHub, o projeto está comprometido. O .gitignore gerado pelo script já protege isso, mas fique atento.

3.2. Branch Protection (Git Flow):
- main: É o código em produção. Sagrado. Só recebe código testado.
- develop (ou features): Onde trabalhamos.
- Regra: Você nunca commita direto na main. Você cria uma branch, termina a tarefa, e fazemos o "Merge".

3.3. Documentação Viva:
- Não vamos escrever PDFs gigantes que ninguém lê.
- Usaremos os arquivos Markdown (.md) dentro do repositório.
- Usaremos o template template_log_sprint.md para abrir e fechar cada ciclo.
- Usaremos o template_log_versao.md para documentar releases importantes.