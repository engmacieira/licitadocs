import { test, expect } from '@playwright/test';

test.describe('Auth Transactional Pages', () => {
  test('ForgotPasswordPage visual verification', async ({ page }) => {
    await page.goto('http://localhost:5173/forgot-password');
    await page.screenshot({ path: 'forgot-password.png' });
    await expect(page.getByText('Esqueceu a senha?')).toBeVisible();
  });

  test('ResetPasswordPage redirection without token', async ({ page }) => {
    await page.goto('http://localhost:5173/reset-password');
    await expect(page).toHaveURL(/.*login/);
  });

  test('ResetPasswordPage with token visual verification', async ({ page }) => {
    await page.goto('http://localhost:5173/reset-password?token=mock_token');
    await page.screenshot({ path: 'reset-password.png' });
    await expect(page.getByText('Criar Nova Senha')).toBeVisible();
  });

  test('VerifyEmailPage visual verification', async ({ page }) => {
    // It will trigger an API call to localhost:8000 which might fail, but we can see the UI state
    await page.goto('http://localhost:5173/verify-email?token=mock_token');
    await page.screenshot({ path: 'verify-email-loading.png' });
    await expect(page.getByText(/Aguarde um momento...|Falha na Verificação/)).toBeVisible();
  });
});
