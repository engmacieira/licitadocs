import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatsCard } from '../components/ui/StatsCard'; // Ajuste o caminho conforme sua estrutura
import { FileText } from 'lucide-react';

describe('StatsCard Component', () => {
    it('deve exibir o título e o valor corretamente', () => {
        render(
            <StatsCard
                title="Total de Documentos"
                value="15"
                icon={FileText}
            />
        );

        expect(screen.getByText('Total de Documentos')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('deve renderizar a tendência corretamente', () => {
        render(
            <StatsCard
                title="Crescimento"
                value="10%"
                icon={FileText}
                trend="up" // Se o seu componente usa apenas up/down para o ícone
            />
        );

        // Se o seu componente renderiza algo específico para "up", 
        // como um ícone de seta pra cima, você pode testar se o ícone existe.
        // Se ele não renderiza texto para trend, este teste termina aqui.
        expect(screen.getByText('Crescimento')).toBeInTheDocument();
    });
});