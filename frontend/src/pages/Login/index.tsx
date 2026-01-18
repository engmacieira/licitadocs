import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Building2, AlertCircle } from 'lucide-react';

export function LoginPage() {
    const { signIn } = useAuth();
    const navigate = useNavigate();

    // Estado local do formulário
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await signIn({ email, password });
            navigate('/dashboard');
        } catch (err) {
            setError('E-mail ou senha incorretos. Tente novamente.');
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">

                {/* Header do Card */}
                <div className="bg-slate-900 p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <Building2 size={28} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">LicitaDoc</h1>
                    <p className="text-slate-400 mt-2">Gestão Inteligente de Documentos</p>
                </div>

                {/* Corpo do Formulário */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Feedback de Erro Geral */}
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2 border border-red-100">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <Input
                            label="E-mail Corporativo"
                            type="email"
                            placeholder="ex: admin@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Input
                            label="Senha"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <div className="pt-2">
                            <Button type="submit" isLoading={isSubmitting}>
                                Acessar Plataforma
                            </Button>
                        </div>

                        <div className="text-center mt-4">
                            <a href="#" className="text-sm text-blue-600 hover:underline">
                                Esqueceu a senha?
                            </a>
                        </div>
                    </form>
                </div>

                {/* Footer (Rodapé do Card) */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                        &copy; 2026 LicitaDoc Tecnologia.
                    </p>
                </div>

            </div>
        </div>
    );
}