# 🗺️ Roadmap de Visão Futura: LicitaDocs v2.0+

Este documento consolida o planejamento estratégico para as próximas etapas de desenvolvimento do LicitaDocs. O objetivo é evoluir de um "Cofre Digital" para um ecossistema completo de conformidade e prospecção ativa para licitantes.

---

## 🎯 Visão Geral
Transformar o LicitaDocs no principal parceiro de conformidade das empresas licitantes no Brasil, automatizando a burocracia e fornecendo inteligência de mercado através do PNCP.

> **Nota sobre Robôs:** A funcionalidade de robôs de automação externa está temporariamente **PAUSADA** e não faz parte deste ciclo de planejamento imediato.

---

## 🚀 Fase 1: Estabilidade e Experiência do Usuário (UX/Fixes)
*Foco: Corrigir atritos críticos que prejudicam a conversão e retenção.*

### 🛠️ Estabilidade Técnica
- **[Fix] Erro 404 no Refresh (F5):** Configurar o servidor (Nginx/AWS) para redirecionar todas as rotas para o `index.html` do SPA React.
- **[Perf] Otimização do Onboarding:** Investigar o gargalo de 10s no cadastro.
    - Implementar processamento assíncrono para uploads pesados.
    - Melhorar o feedback visual durante a criação da conta.
- **[Fix] IA Chatbot:** Debugger do erro de inicialização em ambiente web (Sincronização de chaves de API e CORS).

### 🎨 Ajustes de Interface (Frontend)
- **Scroll para o Topo:** Garantir que ao navegar entre páginas (Sobre Nós, Demo, Home), o scroll retorne automaticamente ao `(0,0)`.
- **Reordenação do Dashboard:** Ajustar a sequência das 5 flags de onboarding para uma ordem lógica de funil:
    1. **Termo de Aceite** (Mantido como 1º)
    2. **Ativação do Plano / Pagamento** (Movido para 2º)
    3. **Dados Cadastrais** (Movido para 3º)
    4. **Assinatura da Procuração** (4º)
    5. **Verificação da Equipe** (5º)
- **Segurança de Perfil:** Exigir "Senha Atual" para permitir a alteração de senha em `/company-settings`.

### ✍️ Fluxo de Assinatura (`/signature`)
- **Sincronização de Dados:** Corrigir a importação automática do endereço e garantir o refresh dos dados do banco ao entrar na página.
- **Fix do Logout:** Corrigir o comportamento de logout automático após o envio dos documentos assinados. O usuário deve permanecer logado e ser redirecionado para o Dashboard com feedback de sucesso.

### 📦 Gestão de Documentos (Cofre)
- **[Feature] Download de Kit ZIP:** Implementar funcionalidade "Baixar Kit Completo" que gera um arquivo .zip com todas as certidões válidas organizadas por pastas.

---

## 📩 Fase 2: Integrações e Comunicação
*Foco: Conectar o sistema com o mundo externo e automatizar avisos.*

### 📧 Sistema de E-mail
- **Infraestrutura:** Integração com provedor (Sugerido: Amazon SES ou SendGrid).
- **Gatilhos Iniciais:**
    - Alerta para Admin de novas empresas cadastradas.
    - Validação de e-mail do cliente (Security & Auth).
    - Fluxo de Recuperação de Acesso:
        - "Esqueci minha senha" (Envio de link de reset).
        - "Não lembro meu e-mail" (Fluxo de validação por CNPJ/CPF).
    - Comunicação de marketing e prospecção.

### 💬 WhatsApp & Pagamentos
- **Integração WhatsApp:** Disparo de alertas de documentos vencendo e tickets via API (Sugerido: Evolution API ou Twilio).
- **Infinite Pay:** Implementar o checkout real e webhooks para ativação automática de planos e recorrência.

---

## 🏛️ Fase 3: Backoffice e Gestão Administrativa
*Foco: Dar superpoderes à equipe de operação para gerenciar milhares de empresas.*

### 📊 Admin Dashboard, Upload & Inbox
- **Novas Empresas Pendentes:** Componente para visualização rápida de cadastros aguardando moderação na `/admin/dashboard`.
- **Filtro Avançado no Upload:** Substituir o select simples de empresas por um componente de busca/filtro (Autocomplete) na `/admin/upload`.
- **Filtros na Inbox Admin:** Implementar busca e filtragem avançada na `/admin/inbox` por:
    - Empresa (Cliente)
    - Status (Pendente de Resposta / Resolvido)
    - Tipo (Ticket / Alerta de Sistema)
- **Inteligência no Cofre:** No Dashboard do Cliente, separar visualmente o que é "Documento do Cofre" (enviado pelo Admin) de "Documentos de Avaliação" (enviados pelo Cliente).

### 🛠️ Ferramentas de Moderação
- **Componente de Avisos:** Na tela de detalhes da empresa, permitir inserir avisos diretos sobre erros em documentos que notificam o cliente instantaneamente.
- **Melhoria nos Dados do Cliente:** Exibir informações detalhadas (IE, IM, Endereço, Dados do Responsável) na tela de aprovação.
- **Fix Pendências:** Garantir que o campo "Pendências a Corrigir" dispare notificações reais para o cliente.

---

## 🔍 Fase 4: Inteligência de Mercado e Leads (PNCP)
*Foco: Prospecção ativa e novos fluxos de receita.*

### 🏢 Integração PNCP (Portal Nacional de Contratações Públicas)
- **Nova Entidade `Lead`:** Criação de tabela no banco de dados para armazenar informações de possíveis clientes capturados.
- **Captura de Leads:** Integração com a API do PNCP para identificar empresas cadastradas, ganhadoras de licitações ou participantes.
- **Enriquecimento de Dados:** Consultar e-mail e telefone dessas empresas para prospecção ativa.
- **CRM de Prospecção (Admin):**
    - Tela dedicada para visualizar a lista de contatos de possíveis clientes.
    - Status de abordagem (Novo, Contatado, Interessado, Convertido).
- **Anti-Spam:** Tela de controle e dashboard de envio de mensagens para monitorar frequência e evitar bloqueios, garantindo conformidade com a LGPD.

---

## 📄 Fase 5: Personalização de Documentos
*Foco: Facilitar a geração de declarações e documentos técnicos.*

### 📑 `/document-templates` (Refatoração)
- **Conteúdo Didático:** Explicar a importância de cada declaração e as consequências de declarações falsas.
- **Personalização Dinâmica:**
    - Upload de Logo da Empresa (centralizado nas configurações).
    - Injeção automática de dados da empresa em cabeçalhos e rodapés.
    - Download em formatos `.doc` (editável) e `.pdf`.

---

## 💸 Dívidas Técnicas e Qualidade de Código
*Foco: Manutenibilidade e robustez do sistema.*

1. **Arquitetura MVC/Repository:** Refatorar o backend completo para isolar a lógica de banco em `app/repositories/`, removendo `db.query` dos routers.
2. **Refatoração do Onboarding (Backend):** Migrar o processamento de arquivos e a lógica de transação do `auth_router.py` para um Service/Repository dedicado.
3. **Padronização de Endereço:** Unificar a estrutura de endereço entre Banco (múltiplos campos) e Frontend (string única/concatenada) para evitar erros de importação na `/signature`.
3. **Auditoria de Logs:** Garantir que toda alteração de status de documento por um Admin seja registrada no Audit Trail.
4. **Mapeamento de DTOs:** Padronizar os aliases do Pydantic para evitar conversões manuais de `legal_name` para `razao_social`.
5. **Segurança de Upload:** Mover a validação de extensões permitidas para uma constante global `ALLOWED_EXTENSIONS`.
6. **Testes E2E:** Implementar jornada completa de usuário (Cadastro -> Assinatura -> Dashboard) usando Playwright.
7. **Paginação Real:** Implementar paginação no backend e frontend para as listas de documentos e empresas no Admin.
8. **Refatoração UI:** Refatorar componentes como `StatsCard` para usar padrões de variantes do Tailwind e criar `seed.py` robusto com `Faker`.

---

## 💡 Ideias de Expansão (SaaS Excellence)
*Sugestões para elevar o nível da plataforma e aumentar o valor percebido pelo cliente.*

1. **Multi-Empresa para Consultores:** Permitir que um único usuário gerencie múltiplas empresas (CNPJs) alternando facilmente entre elas sem deslogar.
2. **Relatórios Semanais de Conformidade:** Envio automático de um "resumo de saúde fiscal" toda segunda-feira por e-mail/WhatsApp.
3. **App Mobile / PWA:** Notificações push e visualização rápida do cofre via celular para o empresário em trânsito.
4. **API Pública para Clientes:** Permitir que grandes empresas integrem o Cofre LicitaDocs diretamente em seus ERPs (SAP, TOTVS, etc.).
5. **Cofre Compartilhado (Link Temporário):** Função para gerar um link seguro e temporário (com senha) para que o cliente possa enviar seu "Kit Licitação" para um parceiro ou órgão sem dar acesso ao sistema.
6. **Dashboard de Economia:** Mostrar ao cliente quanto tempo/dinheiro ele economizou com as automações do LicitaDocs.

---
**Data de Criação:** Março de 2024
**Status:** Planejamento Aprovado
**Responsável:** Jules (Software Engineer) & Matheus (Product Owner)
