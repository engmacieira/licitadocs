# 💸 Dívidas Técnicas e Melhorias Futuras

Este documento lista pontos de melhoria identificados durante o desenvolvimento que foram postergados para manter a agilidade da entrega.

## 🚨 Prioridade Alta (Resolver na próxima Sprint)
* **[Frontend] Refatoração de URLs Hardcoded:** Para corrigir o erro de conexão na Sprint 05, fixamos o endereço `http://127.0.0.1:8000` diretamente no `documentService.ts`.
    * **Ação:** Reverter para usar a instância `api` (Axios) configurada com variáveis de ambiente (`VITE_API_URL`), garantindo que o sistema funcione em Produção/Docker.
* **[Frontend] Padrão de Trailing Slash:** Identificamos que requisições sem barra no final (ex: `/documents`) causam Redirect 307 no FastAPI, o que remove o Token JWT.
    * **Ação:** Padronizar todos os serviços do Frontend para sempre incluir a barra final (ex: `/documents/`).
* **[UX] Edição de Metadados:** O upload atual envia apenas o arquivo.
    * **Ação:** Criar modal ou formulário para o usuário inserir "Data de Validade" e "Categoria" do documento no momento do upload.

## 🎨 Frontend
* **Validação de Formulário:** Atualmente manual. Migrar para **React Hook Form + Zod** para validação robusta.
* **Feedback de Usuário:** Substituir `alert()` nativo por componentes de **Toast/Notification** (ex: Sonner ou React Hot Toast) para mensagens de sucesso/erro mais elegantes.
* **Testes Automatizados:** Configurar Vitest + React Testing Library (atualmente sem testes automatizados no front).
* **Roteamento Seguro:** Revisar `App.tsx` para evitar rotas duplicadas ou "sombreadas" que causam bugs silenciosos.

## ⚙️ Backend
* **Limpeza de Arquivos:** Implementar job ou trigger para deletar o arquivo físico do disco quando o registro no banco de dados é removido.
* **Rate Limiting:** Proteger rotas de login contra força bruta.
* **Logs Estruturados:** Melhorar estruturação de logs para monitoramento futuro (ELK/Sentry).

## 🔒 Segurança
* **Refresh Token:** Implementar fluxo de renovação de token silencioso (atualmente o usuário é deslogado abruptamente quando o token expira).