import { test, expect, type Page } from '@playwright/test';

/**
 * Gera um JWT sintético não-assinado com payload válido para decodificação
 * via `jwt-decode` no `AuthContext` durante testes E2E com rotas interceptadas.
 */
function createMockJwt(payload: {
    sub: string;
    role: string;
    id: string;
    user_id: string;
    exp?: number;
}): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
        JSON.stringify({
            ...payload,
            exp: payload.exp ?? Math.floor(Date.now() / 1000) + 3600,
        })
    ).toString('base64url');
    return `${header}.${body}.mock-signature`;
}

async function mockAuthenticatedContext(
    page: Page,
    options: { role: 'client' | 'admin'; email: string; companyId?: string }
) {
    const userId = options.role === 'admin' ? 'admin-1' : 'user-1';
    const companyId = options.companyId ?? 'comp-1';
    const token = createMockJwt({
        sub: options.email,
        role: options.role,
        id: userId,
        user_id: userId,
    });

    await page.route('**/auth/token', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: token,
                token_type: 'bearer',
            }),
        });
    });

    await page.route('**/users/me', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: userId,
                email: options.email,
                role: options.role,
                is_active: true,
                full_name: options.role === 'admin' ? 'Administrador E2E' : 'Cliente E2E',
            }),
        });
    });

    await page.route('**/users/me/companies', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    id: companyId,
                    razao_social: 'Empresa Teste LicitaDocs LTDA',
                    nome_fantasia: 'LicitaDocs Teste',
                    cnpj: '12.345.678/0001-90',
                    status: 'active',
                },
            ]),
        });
    });

    await page.route('**/documents/**', async (route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
            return;
        }
        await route.continue();
    });

    return { token, companyId };
}

test.describe('Autenticação e Redirecionamento para Dashboard', () => {
    test('deve autenticar usuário cliente e redirecionar para /dashboard', async ({ page }) => {
        await mockAuthenticatedContext(page, {
            role: 'client',
            email: 'cliente@licitadocs.com.br',
        });

        await page.goto('/login');

        await expect(page.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible();

        await page.locator('#email').fill('cliente@licitadocs.com.br');
        await page.locator('#password').fill('SenhaSegura123');
        await page.getByRole('button', { name: 'Entrar na Plataforma' }).click();

        await expect(page).toHaveURL(/\/dashboard$/);
    });

    test('deve autenticar administrador e redirecionar para /admin/dashboard', async ({ page }) => {
        await mockAuthenticatedContext(page, {
            role: 'admin',
            email: 'admin@licitadocs.com.br',
        });

        await page.route('**/admin/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        });

        await page.goto('/login');

        await page.locator('#email').fill('admin@licitadocs.com.br');
        await page.locator('#password').fill('AdminSenha123');
        await page.getByRole('button', { name: 'Entrar na Plataforma' }).click();

        await expect(page).toHaveURL(/\/admin\/dashboard$/);
    });

    test('deve exibir erro ao falhar login com credenciais inválidas', async ({ page }) => {
        await page.route('**/auth/token', async (route) => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ detail: 'Credenciais inválidas' }),
            });
        });

        await page.goto('/login');

        await page.locator('#email').fill('invalido@licitadocs.com.br');
        await page.locator('#password').fill('senhaerrada');
        await page.getByRole('button', { name: 'Entrar na Plataforma' }).click();

        await expect(page.getByText('Credenciais inválidas')).toBeVisible();
        await expect(page).toHaveURL(/\/login$/);
    });
});

test.describe('Envio de Documento (Admin Upload Vault)', () => {
    test('deve navegar para upload, validar formulário obrigatório e enviar PDF', async ({ page }) => {
        const { token, companyId } = await mockAuthenticatedContext(page, {
            role: 'admin',
            email: 'admin@licitadocs.com.br',
        });

        await page.route('**/companies/', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: companyId,
                        razao_social: 'Empresa Teste LicitaDocs LTDA',
                        nome_fantasia: 'LicitaDocs Teste',
                        cnpj: '12.345.678/0001-90',
                        status: 'active',
                    },
                ]),
            });
        });

        await page.route('**/documents/types', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'cat-1',
                        name: 'Regularidade Fiscal',
                        types: [
                            {
                                id: 'type-cnd',
                                name: 'CND Federal',
                                validity_days_default: 180,
                            },
                        ],
                    },
                ]),
            });
        });

        let uploadTriggered = false;
        await page.route('**/documents/upload', async (route) => {
            uploadTriggered = true;
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'doc-123',
                    filename: 'cnd-federal.pdf',
                    status: 'valid',
                    type_id: 'type-cnd',
                    company_id: companyId,
                }),
            });
        });

        await page.addInitScript(
            ({ authToken, activeCompanyId }) => {
                window.localStorage.setItem('@LicitaDoc:token', authToken);
                window.localStorage.setItem('@LicitaDoc:companyId', activeCompanyId);
            },
            { authToken: token, activeCompanyId: companyId }
        );

        await page.goto('/admin/upload');

        await expect(page.getByRole('heading', { name: 'Central de Documentos' })).toBeVisible();

        const selectInput = page.locator('.company-select__input');
        await selectInput.click();
        await selectInput.fill('Empresa Teste');
        await page.getByText('Empresa Teste LicitaDocs LTDA - 12.345.678/0001-90').click();

        await page.getByRole('button', { name: /Novo Oficial/i }).first().click();

        await expect(page.getByRole('heading', { name: 'Centro de Upload Inteligente' })).toBeVisible();

        // Validação de anexo obrigatório ao submeter vazio
        await page.getByRole('button', { name: 'Enviar para o Cofre' }).click();
        await expect(page.getByText('Anexo Obrigatório')).toBeVisible();

        // Preenche arquivo PDF e tipo de documento
        await page.locator('#file-upload').setInputFiles({
            name: 'cnd-federal.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'),
        });

        await page.locator('#document-type').selectOption('type-cnd');
        await page.locator('#authenticationCode').fill('AUTH-E2E-2026');

        await page.getByRole('button', { name: 'Enviar para o Cofre' }).click();

        await expect.poll(() => uploadTriggered).toBe(true);
        await expect(page.getByText('Documento enviado com sucesso!')).toBeVisible();
    });
});
