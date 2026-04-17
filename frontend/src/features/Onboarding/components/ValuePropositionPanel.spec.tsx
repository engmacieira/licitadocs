import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ValuePropositionPanel } from './ValuePropositionPanel';
import { APP_CONFIG, PRICING_CONFIG } from '../../../config/app.config';

describe('ValuePropositionPanel', () => {
    it('renders marketing content correctly', () => {
        render(<ValuePropositionPanel />);
        
        const priceStr = PRICING_CONFIG.plans.PRO.annualPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        expect(screen.getByText(/Você está a um passo de/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`${APP_CONFIG.name} Anual`, 'i'))).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`R\\$ ${priceStr}`, 'i'))).toBeInTheDocument();
        expect(screen.getByText(/Seus dados são criptografados/i)).toBeInTheDocument();
    });
});
