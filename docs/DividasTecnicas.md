# 💸 Dívidas Técnicas e Melhorias Futuras

Este documento lista pontos de melhoria identificados durante o desenvolvimento que foram postergados para manter a agilidade da entrega.

## 🎨 Frontend
* **Validação de Formulário:** Atualmente manual. Migrar para **React Hook Form + Zod** para validação robusta.
* **Feedback de Usuário:** Substituir `alert()` nativo por componentes de **Toast/Notification** (ex: Sonner ou React Hot Toast).
* **Variáveis de Ambiente:** Remover URLs hardcoded (mesmo que no Proxy) e usar `.env` (`VITE_API_URL`).
* **Testes:** Configurar Vitest + React Testing Library (atualmente sem testes automatizados no front).

## ⚙️ Backend
* **Limpeza de Arquivos:** Implementar job para deletar arquivos físicos quando o registro no banco é deletado.
* **Rate Limiting:** Proteger rotas de login contra força bruta.
* **Logs:** Melhorar estruturação de logs para monitoramento (ELK/Sentry).

## 🔒 Segurança
* **Refresh Token:** Implementar fluxo de renovação de token silencioso (atualmente o usuário é deslogado quando expira).