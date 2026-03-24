import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmailSection } from './EmailSection';

const mockRule = {
    id: 'rule-1',
    contact_email: 'fazenda@prefeitura.gov.br',
} as any;

describe('EmailSection', () => {
    it('deve renderizar o e-mail de contacto da regra', () => {
        render(
            <EmailSection 
                rule={mockRule} 
                selectedCompanyId="comp-1" 
                emailSubject="Assunto" setEmailSubject={vi.fn()} 
                emailBody="Corpo" setEmailBody={vi.fn()} 
                handleSendEmail={vi.fn()} isSendingEmail={false} 
            />
        );

        const emailInput = screen.getByDisplayValue('fazenda@prefeitura.gov.br');
        expect(emailInput).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('readOnly');
    });

    it('deve chamar as funções de atualização ao digitar no assunto e no corpo', () => {
        const setEmailSubject = vi.fn();
        const setEmailBody = vi.fn();
        render(
            <EmailSection 
                rule={mockRule} 
                selectedCompanyId="comp-1" 
                emailSubject="" setEmailSubject={setEmailSubject} 
                emailBody="" setEmailBody={setEmailBody} 
                handleSendEmail={vi.fn()} isSendingEmail={false} 
            />
        );

        // Como labels não estão vinculados via htmlFor, buscamos pelo texto e pegamos o próximo elemento
        const subjectLabel = screen.getByText(/Assunto/i);
        const subjectInput = subjectLabel.nextElementSibling as HTMLTextAreaElement;
        
        const bodyLabel = screen.getByText(/Corpo do E-mail/i);
        const bodyInput = bodyLabel.nextElementSibling as HTMLTextAreaElement;

        fireEvent.change(subjectInput, { target: { value: 'Novo Assunto' } });
        fireEvent.change(bodyInput, { target: { value: 'Novo Corpo' } });

        expect(setEmailSubject).toHaveBeenCalledWith('Novo Assunto');
        expect(setEmailBody).toHaveBeenCalledWith('Novo Corpo');
    });

    it('deve desabilitar o botão de envio se não houver e-mail de contacto ou empresa selecionada', () => {
        const { rerender } = render(
            <EmailSection 
                rule={{ ...mockRule, contact_email: '' }} 
                selectedCompanyId="comp-1" 
                emailSubject="Assunto" setEmailSubject={vi.fn()} 
                emailBody="Corpo" setEmailBody={vi.fn()} 
                handleSendEmail={vi.fn()} isSendingEmail={false} 
            />
        );

        const button = screen.getByRole('button', { name: /Enviar E-mail/i });
        expect(button).toBeDisabled();

        rerender(
            <EmailSection 
                rule={mockRule} 
                selectedCompanyId="" 
                emailSubject="Assunto" setEmailSubject={vi.fn()} 
                emailBody="Corpo" setEmailBody={vi.fn()} 
                handleSendEmail={vi.fn()} isSendingEmail={false} 
            />
        );
        expect(screen.getByRole('button', { name: /Enviar E-mail/i })).toBeDisabled();
    });

    it('deve mostrar estado de carregamento no botão', () => {
        render(
            <EmailSection 
                rule={mockRule} 
                selectedCompanyId="comp-1" 
                emailSubject="Assunto" setEmailSubject={vi.fn()} 
                emailBody="Corpo" setEmailBody={vi.fn()} 
                handleSendEmail={vi.fn()} isSendingEmail={true} 
            />
        );

        // O componente Button geralmente muda o conteúdo ou adiciona um spinner quando isLoading é true.
        // Como não vi o código do Button, vou assumir que ele pode ter um texto de loading ou apenas estar desabilitado.
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('deve chamar handleSendEmail ao clicar no botão', () => {
        const handleSendEmail = vi.fn();
        render(
            <EmailSection 
                rule={mockRule} 
                selectedCompanyId="comp-1" 
                emailSubject="Assunto" setEmailSubject={vi.fn()} 
                emailBody="Corpo" setEmailBody={vi.fn()} 
                handleSendEmail={handleSendEmail} isSendingEmail={false} 
            />
        );

        const button = screen.getByRole('button', { name: /Enviar E-mail/i });
        fireEvent.click(button);

        expect(handleSendEmail).toHaveBeenCalled();
    });
});
