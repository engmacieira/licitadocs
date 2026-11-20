import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { AdminLeadsPage } from './index';
import { pncpLeadService } from '../../../services/pncpLeadService';
import type { PncpLeadListResponse, PncpLeadResponse } from '../../../types';

vi.mock('../../../services/pncpLeadService', () => ({
    pncpLeadService: {
        listLeads: vi.fn(),
        syncLeads: vi.fn(),
        registerContact: vi.fn(),
        getLeadById: vi.fn(),
    },
}));

vi.mock('sonner', () => {
    const toastFn = vi.fn() as unknown as {
        (msg: string): void;
        success: (msg: string) => void;
        error: (msg: string) => void;
    };
    toastFn.success = vi.fn();
    toastFn.error = vi.fn();
    return { toast: toastFn };
});

const leadReady: PncpLeadResponse = {
    id: 'lead-1',
    cnpj: '12345678000195',
    razao_social: 'Alpha Engenharia Ltda',
    nome_fantasia: 'Alpha Obras',
    email: 'contato@alpha.com.br',
    telefone: '11988887777',
    uf: 'SP',
    municipio: 'São Paulo',
    porte: 'EPP',
    origem_pncp: 'PNCP-100',
    last_contacted_at: null,
    contact_count: 0,
    last_contact_channel: null,
    last_contact_notes: null,
    spam_cooldown_days: 7,
    created_at: '2026-11-19T10:00:00Z',
    updated_at: '2026-11-19T10:00:00Z',
    is_in_cooldown: false,
    cooldown_remaining_days: 0,
};

const leadInCooldown: PncpLeadResponse = {
    id: 'lead-2',
    cnpj: '98765432000100',
    razao_social: 'Beta Suprimentos S.A.',
    nome_fantasia: 'Beta Gov',
    email: 'vendas@beta.com.br',
    telefone: '2133334444',
    uf: 'RJ',
    municipio: 'Rio de Janeiro',
    porte: 'ME',
    origem_pncp: 'PNCP-200',
    last_contacted_at: '2026-11-18T14:30:00Z',
    contact_count: 2,
    last_contact_channel: 'whatsapp',
    last_contact_notes: 'Enviada apresentação',
    spam_cooldown_days: 7,
    created_at: '2026-11-10T10:00:00Z',
    updated_at: '2026-11-18T14:30:00Z',
    is_in_cooldown: true,
    cooldown_remaining_days: 5,
};

const mockListResponse: PncpLeadListResponse = {
    items: [leadReady, leadInCooldown],
    total: 2,
    skip: 0,
    limit: 50,
    stats: {
        total: 12,
        ready_for_contact: 9,
        in_cooldown: 3,
    },
};

describe('AdminLeadsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(pncpLeadService.listLeads).mockResolvedValue(mockListResponse);
    });

    it('deve renderizar KPIs, tabela com CNPJ formatado e badges anti-SPAM', async () => {
        render(
            <MemoryRouter>
                <AdminLeadsPage />
            </MemoryRouter>
        );

        expect(await screen.findByText('Alpha Engenharia Ltda')).toBeInTheDocument();
        expect(screen.getByText('Beta Suprimentos S.A.')).toBeInTheDocument();

        // KPIs
        expect(screen.getByText('Total Extraído')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('Prontos para Contato')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(screen.getByText('Em Cooldown Anti-SPAM')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // CNPJs formatados e contatos
        expect(screen.getByText('12.345.678/0001-95')).toBeInTheDocument();
        expect(screen.getByText('98.765.432/0001-00')).toBeInTheDocument();
        expect(screen.getByText('(11) 98888-7777')).toBeInTheDocument();
        expect(screen.getByText('(21) 3333-4444')).toBeInTheDocument();

        // Badges anti-SPAM
        expect(screen.getByText('Pronto para contato')).toBeInTheDocument();
        expect(screen.getByText('Cooldown (5d restantes)')).toBeInTheDocument();
    });

    it('deve aplicar filtros de busca, UF e status anti-SPAM', async () => {
        render(
            <MemoryRouter>
                <AdminLeadsPage />
            </MemoryRouter>
        );

        await screen.findByText('Alpha Engenharia Ltda');

        fireEvent.change(
            screen.getByPlaceholderText(/Buscar por CNPJ, Razão Social, Nome Fantasia ou E-mail/i),
            { target: { value: 'Alpha' } }
        );
        fireEvent.change(screen.getByLabelText('UF'), { target: { value: 'SP' } });
        fireEvent.change(screen.getByLabelText('Status Anti-SPAM'), { target: { value: 'ready' } });

        await waitFor(() => {
            expect(pncpLeadService.listLeads).toHaveBeenLastCalledWith({
                search: 'Alpha',
                uf: 'SP',
                contact_status: 'ready',
                skip: 0,
                limit: 50,
            });
        });
    });

    it('deve disparar sincronização do PNCP e recarregar a listagem', async () => {
        vi.mocked(pncpLeadService.syncLeads).mockResolvedValueOnce({
            fetched: 10,
            created: 6,
            updated: 4,
            skipped: 0,
            errors: [],
        });

        render(
            <MemoryRouter>
                <AdminLeadsPage />
            </MemoryRouter>
        );

        await screen.findByText('Alpha Engenharia Ltda');

        fireEvent.click(screen.getByRole('button', { name: /Sincronizar PNCP/i }));
        expect(screen.getByText('Sincronizar Leads do PNCP')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('UF (Opcional)'), { target: { value: 'MG' } });
        fireEvent.change(screen.getByLabelText('Dias Retroativos'), { target: { value: '14' } });

        fireEvent.click(screen.getByRole('button', { name: /Iniciar Extração/i }));

        await waitFor(() => {
            expect(pncpLeadService.syncLeads).toHaveBeenCalledWith({
                uf: 'MG',
                dias_retroativos: 14,
            });
        });
        expect(toast.success).toHaveBeenCalledWith(
            'Sincronização concluída: 6 novos, 4 atualizados (10 extraídos)'
        );
        expect(pncpLeadService.listLeads).toHaveBeenCalledTimes(2);
    });

    it('deve exibir alerta anti-SPAM ao registrar contato de lead em cooldown e atualizar listagem', async () => {
        vi.mocked(pncpLeadService.registerContact).mockResolvedValueOnce({
            lead: {
                ...leadInCooldown,
                contact_count: 3,
            },
            was_in_cooldown: true,
            warning_message: 'Atenção: este lead foi contatado dentro da janela anti-SPAM (7 dias).',
        });

        render(
            <MemoryRouter>
                <AdminLeadsPage />
            </MemoryRouter>
        );

        await screen.findByText('Beta Suprimentos S.A.');

        const actionButtons = screen.getAllByRole('button', { name: /Registrar Contato/i });
        fireEvent.click(actionButtons[1]);

        expect(screen.getByRole('alert')).toHaveTextContent(/Alerta Anti-SPAM: Lead em Cooldown/i);

        fireEvent.change(screen.getByLabelText('Canal de Contato'), { target: { value: 'email' } });
        fireEvent.change(screen.getByLabelText('Observações do Contato'), {
            target: { value: 'Follow-up por e-mail' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Salvar Contato/i }));

        await waitFor(() => {
            expect(pncpLeadService.registerContact).toHaveBeenCalledWith('lead-2', {
                channel: 'email',
                notes: 'Follow-up por e-mail',
                cooldown_days: 7,
            });
        });

        expect(toast).toHaveBeenCalledWith(
            'Atenção: este lead foi contatado dentro da janela anti-SPAM (7 dias).'
        );
        expect(pncpLeadService.listLeads).toHaveBeenCalledTimes(2);
    });
});
