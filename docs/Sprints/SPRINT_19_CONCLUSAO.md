# 🏁 Conclusão da Sprint 19 (Resiliência e Testes de Estresse)

## 📅 Informações Gerais
* **Status:** Concluída ✅
* **Foco Principal:** Blindagem do backend contra alta concorrência, picos de tráfego e payloads abusivos, além da adequação da infraestrutura de testes para refletir o ambiente de produção.

---

## 🎯 Objetivos Alcançados e Entregas

### 1. Evolução da Infraestrutura de Testes (Paridade com Produção)
* **Migração de Banco de Testes:** Substituição do SQLite *in-memory* (que causava falsos negativos de *Thread Safety*) por um banco **PostgreSQL** dedicado aos testes automatizados.
* **Docker Otimizado:** Criação do arquivo `docker-compose.test.yml` configurado com `tmpfs` (armazenamento em memória RAM) para garantir que os testes rodem em alta velocidade.
* **Test Isolation:** Refatoração profunda no arquivo `conftest.py`, implementando fechamento e limpeza de sessões a cada teste, garantindo execuções limpas e determinísticas.

### 2. Blindagem contra Race Conditions (TOCTOU)
* **Problema Resolvido:** Requisições simultâneas exatas (ex: cliques duplos/múltiplos) causavam corrupção de transações ou duplicação de usuários/vínculos.
* **Solução:** Implementação de *Optimistic Concurrency Control* utilizando *Savepoints* do SQLAlchemy (`db.begin_nested()`) nas rotas de gestão de equipe (`company_router.py`).
* **Validação:** Criação do script `test_company_stress.py`, comprovando o bloqueio amigável de requisições concorrentes (Status `400` em vez de `500`).

### 3. Prevenção de Gargalos de Conexão (Connection Pool)
* **Problema Resolvido:** Picos de tráfego (DDoS ou acessos em massa) poderiam esgotar o pool do banco de dados, resultando em quedas da API (`TimeoutError`).
* **Solução e Validação:** Criação do script `test_connection_stress.py` forçando 50 logins simultâneos no mesmo milissegundo. O PostgreSQL provou a sua resiliência via MVCC, processando a fila sem gerar erros de servidor.

### 4. Defesa contra Payloads Abusivos e OOM (Out Of Memory)
* **Problema Resolvido:** O envio de documentos gigantescos (ex: PDFs > 50MB) sobrecarregava a memória RAM ou o disco durante o *spooling* do FastAPI.
* **Solução:** Implementação de uma trava inteligente na rota `POST /documents/upload` (`document_router.py`) que checa o tamanho do cursor em bytes antes de carregar o arquivo, abortando a operação se exceder **5 Megabytes (5MB)**.
* **Validação:** Criação do script `test_payload_stress.py`, garantindo o retorno adequado do status `413 Content Too Large` (ou `400 Bad Request`).

---

## 🚧 Desafios Técnicos Superados
O maior obstáculo técnico desta Sprint foi o comportamento não thread-safe do driver SQLite em testes assíncronos intensos. O SQLite realiza bloqueios a nível de banco de dados (*File-level Locking*), gerando exceções como `ResourceClosedError` sob estresse. A decisão arquitetural de espelhar a infraestrutura de produção (PostgreSQL) diretamente no ambiente de CI/Testes locais eliminou esse falso negativo e elevou a confiabilidade da suíte de testes do projeto.

---

## ⏭️ Próximos Passos
* Iniciar a **Sprint de Automação/Scraping**.
* Levantar e documentar o "Kit Básico" de Certidões (Trabalhista, Federal, Estadual, etc.).
* Estudar a viabilidade técnica de extração para cada certidão (uso de APIs públicas, necessidade de contorno de CAPTCHAs ou simulação web via Playwright).