import { LoginOrchestrator } from '../../features/Auth/LoginOrchestrator';

/**
 * Página de Login da aplicação.
 * Funciona apenas como um ponto de roteamento seguindo a arquitetura modular.
 * Toda a lógica de autenticação (API, formulário) e o visual de marketing 
 * estão isolados no módulo 'Auth'.
 */
export function LoginPage() {
    return <LoginOrchestrator />;
}