import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ValuePropositionPanel } from './ValuePropositionPanel';

describe('ValuePropositionPanel', () => {
    it('renders marketing content correctly', () => {
        render(<ValuePropositionPanel />);
        
        expect(screen.getByText(/Você está a um passo de/i)).toBeInTheDocument();
        expect(screen.getByText(/LicitaDocs Anual/i)).toBeInTheDocument();
        expect(screen.getByText(/R\$ 178,80/i)).toBeInTheDocument();
        expect(screen.getByText(/Seus dados são criptografados/i)).toBeInTheDocument();
    });
});
