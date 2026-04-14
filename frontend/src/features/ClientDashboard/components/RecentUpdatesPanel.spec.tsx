import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi, beforeEach } from 'vitest';
import { RecentUpdatesPanel } from './RecentUpdatesPanel';
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

describe('RecentUpdatesPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockHandleDownload = vi.fn();

    const renderComponent = (recentDocs: DocumentDTO[]) => render(
        <MemoryRouter>
            <RecentUpdatesPanel recentDocs={recentDocs} handleDownload={mockHandleDownload} />
        </MemoryRouter>
    );

    it('deve exibir mensagem de monitoramento ativo quando não há documentos recentes', () => {
        renderComponent([]);

        expect(screen.getByText('Monitoramento Ativo')).toBeInTheDocument();
        expect(screen.getByText('A nossa equipe monitora a sua empresa diariamente. Assim que houver renovações, elas aparecerão aqui.')).toBeInTheDocument();
        expect(screen.queryByText('Acessar Cofre')).not.toBeInTheDocument();
    });

    it('deve exibir a lista de documentos recentemente atualizados', () => {
        const mockDocs: DocumentDTO[] = [
            {
                id: '1',
                filename: 'alvara.pdf',
                title: 'Alvará de Funcionamento',
                status: 'valid',
                created_at: '2026-03-20T10:00:00Z',
                is_structured: true
            },
            {
                id: '2',
                filename: 'cnd_federal.pdf',
                status: 'valid',
                created_at: '2026-03-21T10:00:00Z',
                is_structured: true
            }
        ];

        renderComponent(mockDocs);

        expect(screen.getByText('Últimas Atualizações no Cofre')).toBeInTheDocument();
        expect(screen.getByText('Alvará de Funcionamento')).toBeInTheDocument();
        expect(screen.getByText('cnd_federal.pdf')).toBeInTheDocument();
        expect(screen.getByText('Processado em 20/03/2026')).toBeInTheDocument();
        expect(screen.getByText('Processado em 21/03/2026')).toBeInTheDocument();
        expect(screen.getByText('Acessar Cofre')).toBeInTheDocument();
    });

    it('deve navegar para o cofre ao clicar em Acessar Cofre', () => {
        const mockDocs: DocumentDTO[] = [
            {
                id: '1',
                filename: 'doc1.pdf',
                status: 'valid',
                created_at: new Date().toISOString(),
                is_structured: true
            }
        ];

        renderComponent(mockDocs);

        fireEvent.click(screen.getByText('Acessar Cofre'));
        expect(mockNavigate).toHaveBeenCalledWith('/documents');
    });

    it('deve chamar a função de download ao clicar no botão correspondente', () => {
        const mockDocs: DocumentDTO[] = [
            {
                id: '1',
                filename: 'alvara.pdf',
                title: 'Alvará',
                status: 'valid',
                created_at: new Date().toISOString(),
                is_structured: true
            }
        ];

        renderComponent(mockDocs);

        // Note: getAllByRole('button') will include "Acessar Cofre" if it exists.
        // In the mockDocs case above, "Acessar Cofre" exists.

        const buttons = screen.getAllByRole('button');
        // buttons[0] is "Acessar Cofre"
        // buttons[1] is the Download button
        fireEvent.click(buttons[1]);

        expect(mockHandleDownload).toHaveBeenCalledWith('1', 'alvara.pdf');
    });
});
