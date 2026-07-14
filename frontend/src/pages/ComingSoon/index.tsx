import { FileCheck, Clock } from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';

export function ComingSoonPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-4">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-12">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
                    <FileCheck className="h-8 w-8 text-white" />
                </div>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {APP_CONFIG?.name || 'LicitaDocs'}
                </span>
            </div>

            {/* Main Content */}
            <div className="bg-white p-10 md:p-16 rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-8 border border-blue-100">
                    <Clock className="h-4 w-4" />
                    <span className="uppercase tracking-widest text-xs">Em Breve</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                    A plataforma está em <br className="hidden md:block" />
                    <span className="text-blue-600">fase final de testes</span>.
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                    Estamos calibrando a nossa inteligência para garantir que as suas certidões e documentos licitatórios fiquem sempre em dia, com segurança absoluta e sem dor de cabeça.
                </p>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 font-medium">
                        Nossa equipe técnica está fechando os últimos detalhes de infraestrutura e criptografia exigidos para proteger o seu CNPJ.
                        <br /><br />
                        Em breve, o acesso público será oficialmente liberado.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-slate-400 text-sm">
                © {APP_CONFIG?.copyrightYear || new Date().getFullYear()} {APP_CONFIG?.name || 'LicitaDocs'}. Todos os direitos reservados.
            </div>
        </div>
    );
}