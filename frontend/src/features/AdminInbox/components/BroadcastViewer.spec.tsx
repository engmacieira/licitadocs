import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import { BroadcastViewer } from './BroadcastViewer';
import { MemoryRouter } from 'react-router-dom';

describe('BroadcastViewer', () => {
    const defaultProps = {
        activeAlert: null as any,
        onClearSelection: vi.fn(),
        onOpenModal: vi.fn(),
    };

    const mockAlert = {
        id: '1',
        subject: 'Manutenção do Sistema',
        company_name: 'Empresa Teste',
        company_id: 'comp_1',
        sender_name: 'Admin João',
        created_at: '2024-03-20T10:00:00Z',
        is_read: false,
        content: 'O sistema ficará indisponível por 2 horas.'
    };

    const renderComponent = (props = defaultProps) => {
        return render(
            <MemoryRouter>
                <BroadcastViewer {...props} />
            </MemoryRouter>
        );
    };

    it('deve renderizar a tela inicial de gestão quando não há alerta selecionado', () => {
        renderComponent();

        expect(screen.getByText('Gestão de Comunicados')).toBeInTheDocument();
        expect(screen.getByText(/Envie avisos, atualizações de sistema/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Disparar Novo Aviso/i })).toBeInTheDocument();
    });

    it('deve disparar onOpenModal ao clicar no botão de novo aviso', () => {
        renderComponent();

        const button = screen.getByRole('button', { name: /Disparar Novo Aviso/i });
        fireEvent.click(button);

        expect(defaultProps.onOpenModal).toHaveBeenCalledTimes(1);
    });

    it('deve renderizar os detalhes do alerta quando activeAlert é fornecido', () => {
        renderComponent({ ...defaultProps, activeAlert: mockAlert });

        expect(screen.getByText(mockAlert.subject)).toBeInTheDocument();
        expect(screen.getByText(mockAlert.company_name)).toBeInTheDocument();
        expect(screen.getByText(mockAlert.sender_name)).toBeInTheDocument();
        expect(screen.getByText(mockAlert.content)).toBeInTheDocument();
        expect(screen.getByText('Pendente de leitura')).toBeInTheDocument();
    });

    it('deve formatar a data corretamente no detalhe do alerta', () => {
        renderComponent({ ...defaultProps, activeAlert: mockAlert });
        
        // A data formatada deve conter partes da data mockada
        // '20/03/2024' (dependendo do locale, mas 'pt-BR' é fixo no código)
        expect(screen.getByText(/20\/03\/2024/)).toBeInTheDocument();
    });

    it('deve mostrar status de lido corretamente', () => {
        renderComponent({ ...defaultProps, activeAlert: { ...mockAlert, is_read: true } });
        expect(screen.getByText('Lido pelo cliente')).toBeInTheDocument();
    });

    it('deve disparar onClearSelection ao clicar no botão Voltar', () => {
        renderComponent({ ...defaultProps, activeAlert: mockAlert });

        const backButton = screen.getByRole('button', { name: /Voltar/i });
        fireEvent.click(backButton);

        expect(defaultProps.onClearSelection).toHaveBeenCalledTimes(1);
    });

    it('deve conter o link correto para o perfil da empresa', () => {
        renderComponent({ ...defaultProps, activeAlert: mockAlert });
        
        const link = screen.getByRole('link', { name: new RegExp(mockAlert.company_name, 'i') });
        expect(link).toHaveAttribute('href', `/admin/companies/${mockAlert.company_id}`);
    });
});
