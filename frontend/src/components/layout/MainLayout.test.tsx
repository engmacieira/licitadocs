import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MainLayout } from './MainLayout';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Mock do Contexto
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Como o MainLayout importa o ChatWidget, e o ChatWidget faz chamadas à API,
// nós vamos "esvaziar" o ChatWidget para ele não interferir no teste do Layout!
vi.mock('../ChatWidget', () => ({
    ChatWidget: () => <div data-testid="mock-chat-widget">Chat</div>
}));

describe('MainLayout Component', () => {
    beforeEach(() => {
        (useAuth as any).mockReturnValue({
            user: { sub: 'usuario@teste.com', role: 'admin' },
            signOut: vi.fn(), // 👈 A CURA DO ERRO ESTÁ AQUI
            companies: [],
            currentCompany: null,
            switchCompany: vi.fn()
        });
        vi.clearAllMocks();
    });

    it('deve alterar o título do cabeçalho com base na rota atual', () => {
        // Simulamos que o utilizador acedeu à rota '/admin/companies'
        render(
            <MemoryRouter initialEntries={['/admin/companies']}>
                <MainLayout />
            </MemoryRouter>
        );

        // O título deve ter sido traduzido pelo dicionário pageTitles do componente
        expect(screen.getByRole('heading', { name: 'Gestão de Empresas' })).toBeInTheDocument();

        // Verifica se o badge com a Role do utilizador aparece
        expect(screen.getByText('admin')).toBeInTheDocument();
        // Como o email aparece no Header e na Sidebar, usamos getAllByText!
        const emailsRenderizados = screen.getAllByText('usuario@teste.com');
        expect(emailsRenderizados.length).toBeGreaterThan(0);
    });

    it('deve exibir "LicitaDoc" como título de fallback para rotas desconhecidas', () => {
        render(
            <MemoryRouter initialEntries={['/rota-secreta-inexistente']}>
                <MainLayout />
            </MemoryRouter>
        );

        // Em vez de getByText (que acha o logo da Sidebar e o título do Header),
        // usamos getByRole para focar estritamente na tag <h2> do cabeçalho!
        expect(screen.getByRole('heading', { name: 'LicitaDoc' })).toBeInTheDocument();
    });

    it('deve abrir e fechar o menu mobile ao interagir com os botões', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <MainLayout />
            </MemoryRouter>
        );

        // O Menu Mobile usa dois ícones: Menu (hambúrguer) para abrir e X para fechar.
        // Como o botão não tem texto, vamos buscar o botão (pode haver mais de um no DOM devido ao Sidebar mock, mas o primeiro é o do Header).

        // A melhor forma de testar interatividade sem depender estritamente do DOM visual
        // é verificar a presença de múltiplos Sidebars (um fixo e um que surge no Mobile)
        const sidebarsIniciais = screen.getAllByText('Sair');
        expect(sidebarsIniciais.length).toBe(1); // Apenas o Sidebar Desktop está visível

        // Forçamos o clique no botão do menu hambúrguer (no JSDOM todos os elementos estão presentes, mesmo os hidden no css)
        // No MainLayout, o botão do menu é o primeiro button antes do título
        const menuButtons = screen.getAllByRole('button');
        await user.click(menuButtons[1]); // 👈 MUDAR PARA [1]

        // Ao abrir o mobile menu, um SEGUNDO sidebar é montado no ecrã (o do drawer)
        const sidebarsAbertos = screen.getAllByText('Sair');
        expect(sidebarsAbertos.length).toBe(2);
    });
});