import { useNavigate, Link, Outlet } from 'react-router-dom';
import { FileCheck, ChevronLeft } from 'lucide-react';
import { APP_CONFIG, LEGAL_CONFIG } from '../../config/app.config';
import { Button } from '../ui/Button';
import { ScrollToTop } from '../ui/ScrollToTop';

/**
 * Layout para páginas públicas institucionais (Sobre, Termos, Privacidade).
 * Provê Header com botão de voltar e Footer padronizado.
 */
export function PublicLayout() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <ScrollToTop />

            {/* --- HEADER --- */}
            <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group"
                        aria-label="Voltar"
                    >
                        <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Voltar</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <FileCheck className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">
                            {APP_CONFIG.name}
                        </span>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                        Entrar
                    </Button>
                </div>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>

            {/* --- FOOTER --- */}
            <footer className="py-12 bg-slate-50 border-t border-slate-100 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-slate-900">{APP_CONFIG.name}</span>
                </div>
                <div className="mb-4 space-x-4 text-sm text-slate-500">
                    <Link to={LEGAL_CONFIG.termsOfUseUrl} className="hover:text-blue-600 transition-colors">Termos de Uso</Link>
                    <span>•</span>
                    <Link to={LEGAL_CONFIG.privacyPolicyUrl} className="hover:text-blue-600 transition-colors">Política de Privacidade</Link>
                </div>
                <p className="text-slate-400 text-sm px-4">
                    © {APP_CONFIG.copyrightYear} {APP_CONFIG.name} Gestão Documental. {APP_CONFIG.address}.
                </p>
            </footer>
        </div>
    );
}
