---
name: frontend-architecture-ui
description: Guia de arquitetura frontend React/TypeScript do LicitaDocs, cobrindo o padrão Orchestrator/Feature, Design System, formulários (Zod + React Hook Form), autenticação/rotas e geração de documentos client-side (PDF/DOCX).
---

# Arquitetura Frontend, Design System & Documentos Client-Side

## Quando Acionar (Gatilhos)
- Ao criar ou alterar páginas em `frontend/src/pages/` ou features em `frontend/src/features/`.
- Ao modificar layouts (`MainLayout`), `ErrorBoundary` ou componentes do Design System em `frontend/src/components/ui/`.
- Ao configurar rotas em `App.tsx`, guarda de acesso (`ProtectedRoute`), contexto de autenticação (`AuthContext`) ou interceptors HTTP (`api.ts`).
- Ao implementar formulários com `react-hook-form` + `zod`, ou validações/máscaras de CPF e CNPJ.
- Ao trabalhar com geração client-side de documentos (`@react-pdf/renderer`, `docx`, `file-saver`, `react-to-print`) ou dicionários de minutas.

## Fonte de Verdade no Código
- **Configuração e Branding:** [app.config.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/config/app.config.ts) (`APP_CONFIG.name`, `LEGAL_CONFIG`, `PRICING_CONFIG`, `CONTACT_CONFIG`).
- **Roteamento e Lazy Loading:** [App.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/App.tsx) (`lazy` + `Suspense`, `Toaster`, `ErrorBoundary`, `AuthProvider`).
- **Autenticação e Sessão:** [AuthContext.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/contexts/AuthContext.tsx) (`@LicitaDoc:token`, `@LicitaDoc:companyId`, Supabase OAuth).
- **Guarda de Rotas e Erro:** [ProtectedRoute.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/components/ProtectedRoute.tsx) e [ErrorBoundary.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/components/ErrorBoundary.tsx).
- **Layout e Design System:** [MainLayout.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/components/layout/MainLayout.tsx) e [Button.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/components/ui/Button.tsx).
- **HTTP e Tipos:** [api.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/services/api.ts) e barrel [index.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/types/index.ts).
- **Validação e Formulários:** [loginSchema.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/schemas/loginSchema.ts), [registerSchema.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/schemas/registerSchema.ts) e [validators.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/utils/validators.ts).
- **Onboarding (Referência):**
  - [RegisterWizard.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/Onboarding/RegisterWizard.tsx) e [useRegisterWizard.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/Onboarding/hooks/useRegisterWizard.ts).
  - [TermsAcceptanceOrchestrator.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/Onboarding/TermsAcceptanceOrchestrator.tsx).
- **Assinatura Digital (Referência):** [SignatureOrchestrator.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/DigitalSignature/SignatureOrchestrator.tsx).
- **Documentos Client-Side:**
  - [TemplatesOrchestrator.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/DocumentTemplates/TemplatesOrchestrator.tsx) e [templateDictionary.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/lib/templateDictionary.ts).
  - [PDFTemplate.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/DocumentTemplates/components/PDFTemplate.tsx) e [docxGenerator.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/DocumentTemplates/utils/docxGenerator.ts).
- **Dependências e Scripts:** [package.json](file:///e:/Projetos%20VSCODE/licitadocs/frontend/package.json).

## Arquitetura, Regras e Padrões Ativos

### 1. Padrão Orchestrator / Feature
- `src/pages/` atua apenas como roteador fino carregado sob demanda via `lazy()` em `App.tsx` dentro de `<Suspense fallback={<PageLoader />}>`.
- Toda lógica de estado, orquestração e UI modular vive em `src/features/<FeatureName>/` com um componente `*Orchestrator.tsx` (ou `*Wizard.tsx` + hook dedicado como `useRegisterWizard.ts`) e subcomponentes em `components/`.
- No Onboarding, `RegisterWizard` delega o stepper de 4 passos (incluindo bypass do passo 3 quando `oauthSession` está ativo) para `useRegisterWizard`.
- `TermsAcceptanceOrchestrator` controla leitura obrigatória via scroll (`handleTermsScroll`, `handleModalScroll`) antes de chamar `PATCH /companies/:id/onboarding-step?step=terms`.
- Testes Vitest (`.spec.tsx` / `.spec.ts`) ficam co-localizados ao lado de cada componente, hook ou utilitário.

### 2. Branding e Design System
- O nome da aplicação deve ser renderizado como string pura a partir de `APP_CONFIG.name` (`'LicitaDocs'`). É proibido segmentar o nome com spans coloridos ou HTML estilizado.
- `MainLayout` estrutura `Sidebar` fixa no desktop (`md:flex w-64`), drawer mobile controlado por `isMobileMenuOpen`, `TopHeader`, `<Outlet />` e `ChatWidget`.
- `Button` (`forwardRef`) padroniza variantes (`'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`), tamanhos (`'sm' | 'md' | 'lg'`), `isLoading` com `Loader2` e composição de classes via `clsx` + `tailwind-merge`.

### 3. Autenticação, Rotas e Resiliência
- `AuthProvider` restaura JWT de `localStorage.getItem('@LicitaDoc:token')` via `jwtDecode`, verifica `exp`, escuta `supabase.auth.onAuthStateChange` (`SIGNED_IN`, `TOKEN_REFRESHED`, `SIGNED_OUT`) e persiste a empresa ativa em `@LicitaDoc:companyId`.
- `ProtectedRoute` trata 4 estados: `loading`, `!isAuthenticated` (redireciona para `/`), `allowedRoles` não atendido (tela "Acesso Restrito", ex.: `allowedRoles={['admin']}`) e acesso permitido.
- `ErrorBoundary` envolve `AuthProvider` em `App.tsx` exibindo fallback com botão de reload em falhas de renderização.
- `api.ts` injeta `Authorization: Bearer <token>` no request interceptor e trata falhas de rede, `401` (limpa tokens e redireciona para `/login` fora de `publicPaths`), `403` e `>= 500` no response interceptor.

### 4. Formulários, Validação, Tipagem e Notificações
- Use `react-hook-form` com `zodResolver` (`@hookform/resolvers/zod`) e schemas em `src/schemas/` exportando tipos inferidos via `z.infer<typeof schema>` (`LoginFormData`, `RegisterFormData`).
- Valide CPF/CNPJ matematicamente com `isValidCPF` e `isValidCNPJ` de `src/utils/validators.ts` (usados em `registerSchema.ts` via `.refine()`).
- Centralize interfaces de domínio em `src/types/` re-exportadas pelo barrel `src/types/index.ts`; evite `any`.
- `Toaster` (`sonner`) é montado na raiz em `App.tsx` com `richColors position="top-right" closeButton`.
- Pela diretriz do projeto, `sonner` **não** suporta `toast.warning()`: use `toast.error()`, `toast.success()`, `toast.info()`, `toast.loading()` ou `toast()` padrão.

### 5. Geração de Documentos Client-Side
- **Dicionário de Minutas:** `getTemplateContent(templateId)` em `src/lib/templateDictionary.ts` retorna `{ title, buildBody }` para `'declaracoes-unificadas'` e `'atestado-capacidade'`, com fallback seguro caso o ID não exista.
- **PDF (`@react-pdf/renderer`):** `PDFTemplate` registra a fonte `'Arial'`, aplica padding `'2.54cm'`, cabeçalho `fixed` com `APP_CONFIG.name.toUpperCase()`, e alterna o bloco de assinatura via `isAttestation` (`customSignatureName` vs `companyData.razaoSocial`).
- **Download de PDF:** `DeclarationSection` e `AttestationSection` renderizam o download via `PDFDownloadLink` após confirmação em modal de segurança.
- **DOCX (`docx` + `file-saver`):** `generateDocx` gera A4 com margens `1440` twips (`2.54cm`), fonte `Arial` (`size: 22` = 11pt), `lineSpacing: 240`, cabeçalho condicional quando `!isAttestation`, rodapé com `APP_CONFIG.name` e `PageNumber.CURRENT`, salvando o arquivo via `saveAs`.
- **Impressão (`react-to-print`):** `SignatureOrchestrator` usa `useReactToPrint` com `contentRef` (`contractRef` e `proxyRef`) para contrato SaaS e procuração.

## Armadilhas, Legados e O Que Evitar
- **Uso proibido de `toast.warning()` em código legado:** `api.ts` (linha 52) e `SignatureOrchestrator.tsx` (linha 55) ainda chamam `toast.warning(...)`. Nunca replique esse padrão em código novo; use `toast.error()` ou `toast()`.
- **Uso legado de `any`:** Evite `any` em código novo (regra do `AGENTS.md`). Existem ocorrências legadas que não devem ser copiadas: `as any` em `TemplatesOrchestrator.tsx` (`currentCompany as any`, `userProfile as any`) e `TermsAcceptanceOrchestrator.tsx`, `extra?: any` em `templateDictionary.ts`, `options: any` em `docxGenerator.ts`, e `useState<any>` em `SignatureOrchestrator.tsx` / `useRegisterWizard.ts`.
- **Upload autenticado de documentos do cliente:** Em `SignatureOrchestrator.tsx`, uploads em `/documents/upload` exigem `is_client_upload: "true"` no `FormData` para evitar `401` e **não** devem definir `Content-Type` manualmente (o Axios gera o `multipart/form-data` boundary).
- **Duplicação de `CompanyDocData`:** `CompanyDocData` é importado de `src/types` em `templateDictionary.ts`, mas redefinido localmente em `docxGenerator.ts`; ao evoluir a interface, mantenha ambos sincronizados ou unifique em `src/types/`.
- **Modo Coming Soon:** `App.tsx` verifica `import.meta.env.VITE_COMING_SOON_MODE === 'true'` para renderizar `ComingSoonPage` em `/` e redirecionar rotas públicas/onboarding para `/`.

## Checklist de Validação Antes de Concluir
- [ ] Nenhum uso de `any` adicionado nos arquivos alterados; tipos importados de `src/types/`.
- [ ] Nenhuma chamada a `toast.warning()`; notificações usam `toast.error()`, `toast.success()` ou `toast()`.
- [ ] Branding exibido com `APP_CONFIG.name` como texto puro (sem spans coloridos).
- [ ] Novas páginas usam `lazy()` em `App.tsx` e delegam lógica para `src/features/<Feature>/`.
- [ ] Testes Vitest co-localizados (`.spec.tsx` / `.spec.ts`) criados/atualizados para novos componentes e hooks.
- [ ] Verificação de tipos (`npm run type-check`), lint (`npm run lint`) e testes (`npx vitest run`) executados em `frontend/` sem erros.
- [ ] Build de produção (`npm run build`) validado quando houver alteração em rotas, chunks `lazy()` ou dependências de bundle.
