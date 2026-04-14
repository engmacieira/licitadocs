import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { ActionNeededPanel } from './ActionNeededPanel';
import { MemoryRouter } from 'react-router-dom';
import type { DocumentDTO } from '@/types';

// Mock do useNavigate


const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue({ pathname: '/', state: {}, search: '' }),
        useNavigate: () => mockNavigate,
        Link: ({ children, to }: any) => <a href={to}>{children}</a>
    };
});

describe('ActionNeededPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (attentionDocs: DocumentDTO[]) => render(
        <MemoryRouter>
            <ActionNeededPanel attentionDocs={attentionDocs} />
        </MemoryRouter>
    );

    it('deve exibir mensagem de conformidade quando não há documentos com pendência', () => {
        renderComponent([]);

        expect(screen.getByText('Tudo em conformidade!')).toBeInTheDocument();
        expect(screen.getByText('Nenhum documento vencido ou com pendência de emissão no seu cofre.')).toBeInTheDocument();
        expect(screen.queryByText('Falar com Suporte')).not.toBeInTheDocument();
    });

    it('deve exibir a lista de documentos que precisam de atenção', () => {
        const mockDocs: DocumentDTO[] = [
            {
                id: '1',
                filename: 'doc1.pdf',
                title: 'Certidão Negativa',
                status: 'error',
                created_at: new Date().toISOString(),
                is_structured: true
            },
            {
                id: '2',
                filename: 'doc2.pdf',
                title: 'Alvará Irregular',
                status: 'irregular',
                created_at: new Date().toISOString(),
                is_structured: true
            }
        ];

        renderComponent(mockDocs);

        expect(screen.getByText('Ação Necessária')).toBeInTheDocument();
        expect(screen.getByText('Certidão Negativa')).toBeInTheDocument();
        expect(screen.getByText('Alvará Irregular')).toBeInTheDocument();
        expect(screen.getByText('Erro na Emissão')).toBeInTheDocument();
        expect(screen.getByText('Irregularidade')).toBeInTheDocument();
        expect(screen.getByText('Falar com Suporte')).toBeInTheDocument();
    });

    it('deve navegar para a central de ajuda ao clicar em Falar com Suporte', () => {
        const mockDocs: DocumentDTO[] = [
            {
                id: '1',
                filename: 'doc1.pdf',
                status: 'error',
                created_at: new Date().toISOString(),
                is_structured: true
            }
        ];

        renderComponent(mockDocs);

        fireEvent.click(screen.getByText('Falar com Suporte'));
        expect(mockNavigate).toHaveBeenCalledWith('/help-center');
    });

    it('deve navegar para a tela de documentos ao clicar no botão de seta de um documento', () => {
        const mockDocs: DocumentDTO[] = [
            {
                id: '1',
                filename: 'doc1.pdf',
                title: 'Documento de Erro',
                status: 'error',
                created_at: new Date().toISOString(),
                is_structured: true
            }
        ];

        renderComponent(mockDocs);

        // O botão tem o ícone ArrowRight, podemos buscar pelo papel de botão se houver um só ou via container
        const buttons = screen.getAllByRole('button');
        // O primeiro é "Falar com Suporte", o segundo em diante são as setas
        fireEvent.click(buttons[1]);

        expect(mockNavigate).toHaveBeenCalledWith('/documents');
    });
});
