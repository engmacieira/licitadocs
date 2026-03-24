import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WhatsAppSection } from './WhatsAppSection';

const mockRule = {
    id: 'rule-1',
    contact_whatsapp: '+55 11 99999-9999',
} as any;

describe('WhatsAppSection', () => {
    it('deve renderizar o número do WhatsApp da regra', () => {
        render(
            <WhatsAppSection 
                rule={mockRule} 
                selectedCompanyId="comp-1" 
                whatsappBody="Mensagem" setWhatsappBody={vi.fn()} 
                handleSendWhatsApp={vi.fn()} isSendingWhatsApp={false} 
            />
        );

        const whatsappInput = screen.getByDisplayValue('+55 11 99999-9999');
        expect(whatsappInput).toBeInTheDocument();
        expect(whatsappInput).toHaveAttribute('readOnly');
    });

    it('deve chamar a função de atualização ao digitar na mensagem', () => {
        const setWhatsappBody = vi.fn();
        render(
            <WhatsAppSection 
                rule={mockRule} 
                selectedCompanyId="comp-1" 
                whatsappBody="" setWhatsappBody={setWhatsappBody} 
                handleSendWhatsApp={vi.fn()} isSendingWhatsApp={false} 
            />
        );

        const label = screen.getByText(/Mensagem de Cobrança/i);
        const textarea = label.nextElementSibling as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: 'Nova Mensagem' } });

        expect(setWhatsappBody).toHaveBeenCalledWith('Nova Mensagem');
    });

    it('deve desabilitar o botão se não houver WhatsApp ou empresa selecionada', () => {
        const { rerender } = render(
            <WhatsAppSection 
                rule={{ ...mockRule, contact_whatsapp: '' }} 
                selectedCompanyId="comp-1" 
                whatsappBody="Mensagem" setWhatsappBody={vi.fn()} 
                handleSendWhatsApp={vi.fn()} isSendingWhatsApp={false} 
            />
        );

        const button = screen.getByRole('button', { name: /Agendar Mensagem/i });
        expect(button).toBeDisabled();

        rerender(
            <WhatsAppSection 
                rule={mockRule} 
                selectedCompanyId="" 
                whatsappBody="Mensagem" setWhatsappBody={vi.fn()} 
                handleSendWhatsApp={vi.fn()} isSendingWhatsApp={false} 
            />
        );
        expect(screen.getByRole('button', { name: /Agendar Mensagem/i })).toBeDisabled();
    });

    it('deve chamar handleSendWhatsApp ao clicar no botão', () => {
        const handleSendWhatsApp = vi.fn();
        render(
            <WhatsAppSection 
                rule={mockRule} 
                selectedCompanyId="comp-1" 
                whatsappBody="Mensagem" setWhatsappBody={vi.fn()} 
                handleSendWhatsApp={handleSendWhatsApp} isSendingWhatsApp={false} 
            />
        );

        const button = screen.getByRole('button', { name: /Agendar Mensagem/i });
        fireEvent.click(button);

        expect(handleSendWhatsApp).toHaveBeenCalled();
    });
});
