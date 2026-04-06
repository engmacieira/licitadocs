import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterWizard } from './RegisterWizard';
import userEvent from '@testing-library/user-event';
import { authService } from '../../services/authService';
import { toast } from 'sonner';

// Mocks
vi.mock('../../services/authService', () => ({
    authService: {
        register: vi.fn(),
    },
}));

const mockSignIn = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        signIn: mockSignIn,
    }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}));

describe('RegisterWizard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('navigates through the wizard steps and handles validation', async () => {
        const user = userEvent.setup();
        render(<RegisterWizard />);

        // Step 1: Company
        expect(screen.getByText(/Passo 1 de 4/i)).toBeInTheDocument();

        // Test validation failure on Step 1
        await user.click(screen.getByRole('button', { name: /Próximo/i }));
        expect(await screen.findByText(/CNPJ inválido/i)).toBeInTheDocument();
        expect(await screen.findByText(/Razão Social deve ter no mínimo 3 caracteres/i)).toBeInTheDocument();

        // Fill Step 1 correctly
        await user.type(screen.getByLabelText(/CNPJ/i), '12.345.678/0001-90');
        await user.type(screen.getByLabelText(/Razão Social/i), 'Minha Empresa Ltda');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // Step 2: Responsible
        expect(await screen.findByText(/Passo 2 de 4/i)).toBeInTheDocument();
        await user.type(screen.getByLabelText(/Nome Completo/i), 'João da Silva');
        await user.type(screen.getByLabelText(/CPF/i), '123.456.789-00');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // Step 3: Credentials
        expect(await screen.findByText(/Passo 3 de 4/i)).toBeInTheDocument();
        await user.type(screen.getByLabelText(/E-mail Corporativo/i), 'joao@empresa.com');
        await user.type(screen.getByLabelText(/Criar Senha/i), 'password123');
        await user.type(screen.getByLabelText(/Confirmar Senha/i), 'password123');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // Step 4: Documentation
        expect(await screen.findByText(/Passo 4 de 4/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Finalizar Cadastro/i })).toBeInTheDocument();
    });

    it('completes the registration successfully', async () => {
        const user = userEvent.setup();
        render(<RegisterWizard />);

        // Step 1
        await user.type(screen.getByLabelText(/CNPJ/i), '12.345.678/0001-90');
        await user.type(screen.getByLabelText(/Razão Social/i), 'Minha Empresa Ltda');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // Step 2
        await waitFor(() => screen.getByLabelText(/Nome Completo/i));
        await user.type(screen.getByLabelText(/Nome Completo/i), 'João da Silva');
        await user.type(screen.getByLabelText(/CPF/i), '123.456.789-00');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // Step 3
        await waitFor(() => screen.getByLabelText(/E-mail/i));
        await user.type(screen.getByLabelText(/E-mail Corporativo/i), 'joao@empresa.com');
        await user.type(screen.getByLabelText(/Criar Senha/i), 'password123');
        await user.type(screen.getByLabelText(/Confirmar Senha/i), 'password123');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        // Step 4
        await waitFor(() => screen.getByText(/Passo 4 de 4/i));

        const file = new File([''], 'test.pdf', { type: 'application/pdf' });

        const socialInput = document.getElementById('social') as HTMLInputElement;
        const cnpjInput = document.getElementById('cnpj') as HTMLInputElement;
        const docInput = document.getElementById('doc') as HTMLInputElement;

        await user.upload(socialInput, file);
        await user.upload(cnpjInput, file);
        await user.upload(docInput, file);

        vi.mocked(authService.register).mockResolvedValueOnce();
        mockSignIn.mockResolvedValueOnce({});

        await user.click(screen.getByRole('button', { name: /Finalizar Cadastro/i }));

        await waitFor(() => {
            expect(authService.register).toHaveBeenCalled();
            expect(mockSignIn).toHaveBeenCalledWith({
                email: 'joao@empresa.com',
                password: 'password123'
            });
            expect(toast.success).toHaveBeenCalledWith("Cadastro realizado!", expect.anything());
            expect(mockNavigate).toHaveBeenCalledWith('/contract-sign', { replace: true });
        });
    });

    it('handles registration error', async () => {
        const user = userEvent.setup();
        render(<RegisterWizard />);

        // Fast forward to Step 4
        await user.type(screen.getByLabelText(/CNPJ/i), '12.345.678/0001-90');
        await user.type(screen.getByLabelText(/Razão Social/i), 'Minha Empresa Ltda');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));
        await waitFor(() => screen.getByLabelText(/Nome Completo/i));
        await user.type(screen.getByLabelText(/Nome Completo/i), 'João da Silva');
        await user.type(screen.getByLabelText(/CPF/i), '123.456.789-00');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));
        await waitFor(() => screen.getByLabelText(/E-mail/i));
        await user.type(screen.getByLabelText(/E-mail Corporativo/i), 'joao@empresa.com');
        await user.type(screen.getByLabelText(/Criar Senha/i), 'password123');
        await user.type(screen.getByLabelText(/Confirmar Senha/i), 'password123');
        await user.click(screen.getByRole('button', { name: /Próximo/i }));

        await waitFor(() => screen.getByText(/Passo 4 de 4/i));

        const file = new File([''], 'test.pdf', { type: 'application/pdf' });
        await user.upload(document.getElementById('social') as HTMLInputElement, file);
        await user.upload(document.getElementById('cnpj') as HTMLInputElement, file);
        await user.upload(document.getElementById('doc') as HTMLInputElement, file);

        vi.mocked(authService.register).mockRejectedValueOnce({
            response: { status: 422, data: { detail: 'Validation Error' } }
        });

        await user.click(screen.getByRole('button', { name: /Finalizar Cadastro/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Erro de validação", expect.anything());
        });
    });
});
