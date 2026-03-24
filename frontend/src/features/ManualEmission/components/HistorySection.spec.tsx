import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HistorySection } from './HistorySection';
import type { RequestHistoryItem } from './HistorySection';

const mockHistory: RequestHistoryItem[] = [
    {
        id: '1',
        date: new Date('2024-03-20T10:00:00'),
        companyId: 'comp-1',
        companyName: 'Empresa A',
        estimatedDate: '2024-03-25',
        status: 'pending'
    },
    {
        id: '2',
        date: new Date('2024-03-18T15:30:00'),
        companyId: 'comp-1',
        companyName: 'Empresa A',
        estimatedDate: '2024-03-22',
        status: 'completed'
    }
];

describe('HistorySection', () => {
    it('deve exibir mensagem de estado vazio', () => {
        render(
            <HistorySection 
                requestHistory={[]} 
                updateEstimateDate={vi.fn()} 
                markAsCompleted={vi.fn()} 
            />
        );

        expect(screen.getByText(/Nenhum pedido de CND registado para este município/i)).toBeInTheDocument();
    });

    it('deve renderizar a lista de histórico corretamente', () => {
        render(
            <HistorySection 
                requestHistory={mockHistory} 
                updateEstimateDate={vi.fn()} 
                markAsCompleted={vi.fn()} 
            />
        );

        expect(screen.getAllByText('Empresa A').length).toBeGreaterThan(0);
        expect(screen.getByText(/Aguardando/i)).toBeInTheDocument();
        expect(screen.getByText(/Concluído/i)).toBeInTheDocument();
    });

    it('deve chamar updateEstimateDate ao alterar a data de previsão', () => {
        const updateEstimateDate = vi.fn();
        render(
            <HistorySection 
                requestHistory={mockHistory} 
                updateEstimateDate={updateEstimateDate} 
                markAsCompleted={vi.fn()} 
            />
        );

        // Como labels não estão vinculados, buscamos pelo texto e pegamos o próximo elemento
        const label = screen.getByText(/Previsão de Retorno/i);
        const dateInput = label.nextElementSibling as HTMLInputElement;
        
        fireEvent.change(dateInput, { target: { value: '2024-03-26' } });

        expect(updateEstimateDate).toHaveBeenCalledWith('1', '2024-03-26');
    });

    it('deve chamar markAsCompleted ao clicar no botão de recebida', () => {
        const markAsCompleted = vi.fn();
        render(
            <HistorySection 
                requestHistory={mockHistory} 
                updateEstimateDate={vi.fn()} 
                markAsCompleted={markAsCompleted} 
            />
        );

        const button = screen.getByRole('button', { name: /Certidão Recebida/i });
        fireEvent.click(button);

        expect(markAsCompleted).toHaveBeenCalledWith('1');
    });

    it('deve exibir a previsão inicial para itens concluídos', () => {
        render(
            <HistorySection 
                requestHistory={mockHistory} 
                updateEstimateDate={vi.fn()} 
                markAsCompleted={vi.fn()} 
            />
        );

        // Usamos regex mais específico para a previsão inicial
        expect(screen.getByText(/Previsão inicial era: /i)).toBeInTheDocument();
    });
});
