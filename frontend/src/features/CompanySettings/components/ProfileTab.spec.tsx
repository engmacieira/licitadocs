import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileTab } from './ProfileTab';
import { useForm } from 'react-hook-form';
import type { ProfileFormSchema, PasswordFormSchema } from '../hooks/useCompanySettingsData';

// Wrapper component to provide react-hook-form context and props
const TestWrapper = ({ onSaveProfile, onChangePassword }: any) => {
    const profileForm = useForm<ProfileFormSchema>({
        defaultValues: {
            nome: 'John Doe',
            cpf: '123.456.789-00',
            rg: '12.345.678-9',
            nacionalidade: 'Brasileiro',
            estado_civil: 'Solteiro',
            profissao: 'Engenheiro',
            celular: '(11) 99999-9999',
            genero: 'Masculino'
        }
    });

    const passwordForm = useForm<PasswordFormSchema>({
        defaultValues: {
            currentPassword: '',
            password: '',
            confirmPassword: ''
        }
    });

    return (
        <ProfileTab
            profileForm={profileForm}
            onSaveProfile={onSaveProfile}
            passwordForm={passwordForm}
            onChangePassword={onChangePassword}
        />
    );
};

describe('ProfileTab', () => {
    it('deve renderizar todos os campos de informações pessoais', () => {
        const onSaveProfile = vi.fn();
        const onChangePassword = vi.fn();

        render(<TestWrapper onSaveProfile={onSaveProfile} onChangePassword={onChangePassword} />);

        expect(screen.getByText('Informações Pessoais')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Seu nome completo')).toHaveValue('John Doe');
        expect(screen.getByPlaceholderText('000.000.000-00')).toHaveValue('123.456.789-00');
        expect(screen.getByPlaceholderText('Sua identidade')).toHaveValue('12.345.678-9');
        expect(screen.getByPlaceholderText('Ex: Brasileiro')).toHaveValue('Brasileiro');
        expect(screen.getByPlaceholderText('Ex: Solteiro, Casado...')).toHaveValue('Solteiro');
        expect(screen.getByPlaceholderText('Ex: Empresário, Engenheiro...')).toHaveValue('Engenheiro');
        expect(screen.getByPlaceholderText('(00) 00000-0000')).toHaveValue('(11) 99999-9999');
        // Gênero é um select, não tem placeholder, mas podemos usar getByRole ou label (se fosse associado)
        // Como o select não tem placeholder, vamos tentar encontrar pelo label mas usando getByText e navegar se necessário
        // Ou apenas verificar se o valor está lá via o select
        expect(screen.getByRole('combobox')).toHaveValue('Masculino');
    });

    it('deve renderizar campos de segurança', () => {
        const onSaveProfile = vi.fn();
        const onChangePassword = vi.fn();

        render(<TestWrapper onSaveProfile={onSaveProfile} onChangePassword={onChangePassword} />);

        expect(screen.getByText('Segurança')).toBeInTheDocument();
        // Como o label não está associado por ID, buscamos pelo texto do label e pegamos o input seguinte
        expect(screen.getByText('Senha Atual')).toBeInTheDocument();
        expect(screen.getByText('Nova Senha')).toBeInTheDocument();
        expect(screen.getByText('Confirmar Nova Senha')).toBeInTheDocument();
        expect(screen.getByText('Trocar Senha')).toBeInTheDocument();
    });

    it('deve chamar onSaveProfile ao submeter formulário de perfil', async () => {
        const onSaveProfile = vi.fn((data) => Promise.resolve(data));
        const onChangePassword = vi.fn();

        render(<TestWrapper onSaveProfile={onSaveProfile} onChangePassword={onChangePassword} />);

        const updateButton = screen.getByText('Atualizar Perfil');
        fireEvent.click(updateButton);

        await waitFor(() => {
            expect(onSaveProfile).toHaveBeenCalled();
        });
    });

    it('deve chamar onChangePassword ao submeter formulário de senha', async () => {
        const onSaveProfile = vi.fn();
        const onChangePassword = vi.fn((data) => Promise.resolve(data));

        render(<TestWrapper onSaveProfile={onSaveProfile} onChangePassword={onChangePassword} />);

        // Encontrar inputs de password via parent element do label já que label association falha
        const currentInput = screen.getByText('Senha Atual').parentElement?.querySelector('input');
        const passwordInput = screen.getByText('Nova Senha').parentElement?.querySelector('input');
        const confirmInput = screen.getByText('Confirmar Nova Senha').parentElement?.querySelector('input');

        if (currentInput) fireEvent.change(currentInput, { target: { value: 'oldpassword123' } });
        if (passwordInput) fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
        if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });

        const changePasswordButton = screen.getByText('Trocar Senha');
        fireEvent.click(changePasswordButton);

        await waitFor(() => {
            expect(onChangePassword).toHaveBeenCalled();
        });
    });

    it('deve exibir estado de loading no botão de perfil quando estiver submetendo', () => {
        const profileForm = {
            register: vi.fn(),
            handleSubmit: (fn: any) => (e: any) => { e.preventDefault(); fn(); },
            formState: { isSubmitting: true },
            watch: vi.fn(),
            reset: vi.fn(),
        } as any;

        const passwordForm = {
            register: vi.fn(),
            handleSubmit: vi.fn(),
            formState: { isSubmitting: false },
        } as any;

        render(
            <ProfileTab
                profileForm={profileForm}
                onSaveProfile={vi.fn()}
                passwordForm={passwordForm}
                onChangePassword={vi.fn()}
            />
        );
        const button = screen.getByText('Atualizar Perfil');
        expect(button).toBeDisabled();
    });
});
