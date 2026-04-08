import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente utilitário invisível que força o scroll da janela para o topo
 * sempre que a rota (pathname) do React Router for alterada.
 */
export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Força o scroll para a posição X:0, Y:0 de forma instantânea
        window.scrollTo(0, 0);
    }, [pathname]);

    return null; // Este componente não renderiza nada na tela
}