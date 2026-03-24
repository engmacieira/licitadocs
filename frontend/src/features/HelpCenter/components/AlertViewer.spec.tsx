import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AlertViewer } from './AlertViewer';

describe('AlertViewer', () => {
    const mockAlert = {
        id: '1',
        subject: 'Aviso Teste',
        content: 'Conteúdo do aviso de teste.',
        is_read: false,
        sender_name: 'Admin Teste',
        created_at: new Date().toISOString()
    };

    const mockHandleMarkAsRead = vi.fn();
    const mockOnBack = vi.fn();

    it('should render alert details correctly', () => {
        render(
            <AlertViewer
                activeAlert={mockAlert}
                handleMarkAsRead={mockHandleMarkAsRead}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('Aviso Teste')).toBeInTheDocument();
        expect(screen.getByText('Pendente de Leitura')).toBeInTheDocument();
        expect(screen.getByText(/Admin Teste/)).toBeInTheDocument();
        expect(screen.getByText(/Conteúdo do aviso de teste/)).toBeInTheDocument();
    });

    it('should render "Lido" badge when alert is read', () => {
        render(
            <AlertViewer
                activeAlert={{ ...mockAlert, is_read: true }}
                handleMarkAsRead={mockHandleMarkAsRead}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('Lido')).toBeInTheDocument();
        expect(screen.queryByText('Marcar como Ciente')).not.toBeInTheDocument();
    });

    it('should call handleMarkAsRead when "Marcar como Ciente" is clicked', () => {
        render(
            <AlertViewer
                activeAlert={mockAlert}
                handleMarkAsRead={mockHandleMarkAsRead}
                onBack={mockOnBack}
            />
        );

        const button = screen.getByText('Marcar como Ciente');
        fireEvent.click(button);

        expect(mockHandleMarkAsRead).toHaveBeenCalledWith(expect.anything(), '1');
    });

    it('should call onBack when back button is clicked', () => {
        render(
            <AlertViewer
                activeAlert={mockAlert}
                handleMarkAsRead={mockHandleMarkAsRead}
                onBack={mockOnBack}
            />
        );

        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]); // First button is onBack

        expect(mockOnBack).toHaveBeenCalled();
    });
});
