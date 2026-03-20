import { RegisterWizard } from '../../features/Onboarding/RegisterWizard';

/**
 * Página de Registo (Onboarding / Sign Up).
 * Seguindo a arquitetura modular, esta página atua apenas como um ponto de roteamento.
 * Toda a inteligência visual (Wizard, Painel de Marketing), divisão de passos e 
 * comunicação com a API (Regras de Negócio) estão isoladas no módulo 'Onboarding'.
 */
export function RegisterPage() {
    return <RegisterWizard />;
}