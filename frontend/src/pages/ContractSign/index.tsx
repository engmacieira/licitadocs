import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

export function ContractSignPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Recupera dados passados pela tela de registro (se houver)
    const companyName = location.state?.legal_name || "Sua Empresa";

    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedProxy, setAcceptedProxy] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSign = async () => {
        setIsSubmitting(true);

        // Simulação de delay de assinatura digital
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success("Documentos assinados digitalmente!");

        // Próximo passo: Pagamento (Card 05)
        navigate('/payment', { state: { ...location.state } });
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Formalização</h2>
                    <p className="mt-2 text-slate-600">
                        Para ativar sua conta, precisamos do seu aceite nos termos abaixo.
                    </p>
                </div>

                {/* Card 1: Contrato de Prestação de Serviços */}
                <div className="bg-white shadow rounded-lg overflow-hidden mb-6 border border-slate-200">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-slate-900 flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-slate-400" />
                            Contrato de Prestação de Serviços
                        </h3>
                        <span className="text-xs font-mono text-slate-400">v2026.01</span>
                    </div>

                    <div className="p-6 h-64 overflow-y-auto bg-slate-50/50 text-sm text-slate-600 font-mono leading-relaxed border-b border-slate-100">
                        <p className="mb-4">
                            <strong>CONTRATO DE ADESÃO - LICITADOCS SAAS</strong>
                        </p>
                        <p className="mb-4">
                            Pelo presente instrumento, a CONTRATANTE ({companyName}) adere aos termos de uso da plataforma...
                        </p>
                        <p className="mb-4">
                            1. DO OBJETO<br />
                            1.1. O presente contrato tem como objeto a prestação de serviços de monitoramento e gestão automática de certidões negativas...
                        </p>
                        <p className="mb-4">
                            2. DA RESPONSABILIDADE<br />
                            2.1. A LICITADOCS compromete-se a buscar as certidões nas bases oficiais...
                        </p>
                        <p className="mb-4">
                            (Texto simulado - Role para ler mais...)
                        </p>
                        <p>
                            [... Restante do juridiquês ...]
                        </p>
                    </div>

                    <div className="p-4 bg-slate-50 flex items-center">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="terms" className="ml-3 block text-sm font-medium text-slate-700 cursor-pointer">
                            Li e concordo com os Termos de Uso e Política de Privacidade.
                        </label>
                    </div>
                </div>

                {/* Card 2: Procuração Digital */}
                <div className="bg-white shadow rounded-lg overflow-hidden mb-8 border border-slate-200">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-medium text-slate-900 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-slate-400" />
                            Procuração Específica
                        </h3>
                    </div>

                    <div className="p-6 text-sm text-slate-600">
                        <p className="mb-4">
                            Para que nosso robô possa emitir certidões em seu nome em órgãos que exigem login (ex: Receita Estadual),
                            precisamos de uma autorização digital restrita a consulta.
                        </p>
                        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 text-yellow-800 text-xs mb-4">
                            <strong>Nota de Segurança:</strong> Esta procuração NÃO dá poderes para alterar dados, realizar compras ou contrair dívidas.
                            Serve apenas para <em>consulta e emissão de documentos</em>.
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 flex items-center border-t border-slate-100">
                        <input
                            id="proxy"
                            type="checkbox"
                            checked={acceptedProxy}
                            onChange={(e) => setAcceptedProxy(e.target.checked)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="proxy" className="ml-3 block text-sm font-medium text-slate-700 cursor-pointer">
                            Autorizo a emissão de certidões em nome da minha empresa.
                        </label>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => navigate('/')}>
                        Cancelar
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleSign}
                        disabled={!acceptedTerms || !acceptedProxy || isSubmitting}
                        className={(!acceptedTerms || !acceptedProxy) ? "opacity-50 cursor-not-allowed" : ""}
                    >
                        {isSubmitting ? 'Assinando...' : (
                            <>
                                Assinar Digitalmente e Continuar <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>

            </div>
        </div>
    );
}