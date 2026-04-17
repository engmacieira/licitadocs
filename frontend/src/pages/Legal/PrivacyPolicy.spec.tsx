import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyPolicy } from './PrivacyPolicy';
import { APP_CONFIG } from '../../config/app.config';

// Mock do react-router-dom para o useNavigate
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

describe('PrivacyPolicy Page', () => {
    it('deve renderizar o título principal e o nome dinâmico da plataforma', () => {
        render(
            <MemoryRouter>
                <PrivacyPolicy />
            </MemoryRouter>
        );

        // Verifica se o título principal está na tela
        expect(screen.getByRole('heading', { name: /Política de Privacidade/i })).toBeInTheDocument();

        // Verifica se o nome da empresa vindo do config aparece no texto
        const companyNameElements = screen.getAllByText(new RegExp(APP_CONFIG.name, 'i'));
        expect(companyNameElements.length).toBeGreaterThan(0);
    });
});
