import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PDFTemplate } from './PDFTemplate';

// Mock do @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
    Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
    Page: ({ children, size, style }: any) => (
        <div data-testid="pdf-page" data-size={size} style={style}>
            {children}
        </div>
    ),
    Text: ({ children, style, render }: any) => {
        if (render) return <span data-testid="pdf-text-render">{render({ pageNumber: 1, totalPages: 5 })}</span>;
        return <span style={style}>{children}</span>;
    },
    View: ({ children, style }: any) => <div style={style}>{children}</div>,
    StyleSheet: { create: (s: any) => s },
    Font: { register: vi.fn() },
}));

describe('PDFTemplate', () => {
    it('deve renderizar o título e os blocos de conteúdo', () => {
        const title = 'Título Teste';
        const contentBlocks = ['Bloco 1', 'Bloco 2'];
        
        render(<PDFTemplate title={title} contentBlocks={contentBlocks} />);
        
        expect(screen.getByText('Título Teste')).toBeInTheDocument();
        expect(screen.getByText('Bloco 1')).toBeInTheDocument();
        expect(screen.getByText('Bloco 2')).toBeInTheDocument();
        expect(screen.getByText(/LicitaDocs - Plataforma de Gestão de Documentos/i)).toBeInTheDocument();
    });

    it('deve renderizar o nome de assinatura customizado se fornecido', () => {
        render(<PDFTemplate title="T" contentBlocks={['B']} customSignatureName="Assinante Custom" />);
        
        expect(screen.getByText('Assinante Custom')).toBeInTheDocument();
    });

    it('deve utilizar fallback para nome de assinatura se não fornecido', () => {
        render(<PDFTemplate title="T" contentBlocks={['B']} />);
        
        expect(screen.getByText('[RAZÃO SOCIAL]')).toBeInTheDocument();
    });

    it('deve renderizar o rodapé com paginação', () => {
        render(<PDFTemplate title="T" contentBlocks={['B']} />);
        
        expect(screen.getByTestId('pdf-text-render')).toHaveTextContent('Página 1 de 5');
    });
});
