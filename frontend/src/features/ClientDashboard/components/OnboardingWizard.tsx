import { useNavigate, Link } from 'react-router-dom';
import {
    AlertTriangle, RefreshCw, AlertOctagon, ScrollText,
    Building2, CreditCard, FileSignature, ShieldCheck, ArrowRight, MailCheck
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { APP_CONFIG, LEGAL_CONFIG } from '../../../config/app.config';

/**
 * Propriedades do componente OnboardingWizard.
 * @interface OnboardingWizardProps
 */
interface OnboardingWizardProps {
    currentCompany: any;
    companyStatus: {
        terms: boolean;
        data: boolean;
        payment: boolean;
        emailVerified: boolean;
        contract: boolean;
        approval: boolean;
        pendencies: string | null;
    };
    loadData: () => void;
}

/**
 * Componente visual que guia o novo cliente pelos 5 passos obrigatórios
 * de ativação da conta (Termos, Dados, Pagamento, Contrato, Aprovação Admin).
 */
export function OnboardingWizard({ currentCompany, companyStatus, loadData }: OnboardingWizardProps) {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-4 bg-amber-50 rounded-full mb-4 ring-1 ring-amber-200">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">
                    Finalize a configuração da <span className="text-blue-600">{currentCompany.razao_social}</span>
                </h1>
                <p className="text-slate-600 mt-3 max-w-xl mx-auto leading-relaxed">
                    Para liberar o acesso completo ao {APP_CONFIG.name}, siga as etapas de regularização abaixo.
                </p>
                <Button variant="ghost" size="sm" onClick={loadData} className="mt-4 text-slate-400 hover:text-blue-600">
                    <RefreshCw className="mr-2 h-3 w-3" /> Atualizar Status
                </Button>
            </div>

            {/* ALERTA DE PENDÊNCIAS DO ADMIN */}
            {companyStatus.pendencies && (
                <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-xl flex gap-4 items-start shadow-sm">
                    <AlertOctagon className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-red-900">Atenção! Pendências na sua conta:</h3>
                        <p className="text-red-700 mt-1 whitespace-pre-wrap text-sm">{companyStatus.pendencies}</p>
                        <p className="text-red-600 mt-3 text-xs font-semibold">Por favor, corrija os itens apontados para que a nossa equipe possa validar a sua empresa.</p>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {/* STEP 1: TERMOS DE USO */}
                <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.terms ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-white shadow-md shadow-blue-50'}`}>
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className={`p-3 rounded-xl shrink-0 ${companyStatus.terms ? 'bg-green-200 text-green-700' : 'bg-blue-100 text-blue-600'}`}>
                            <ScrollText className="h-6 w-6" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                1. Aceite dos Termos
                                {companyStatus.terms ?
                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span> :
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Pendente</span>
                                }
                            </h3>
                            <p className="text-slate-600 text-sm mt-1">
                                Concordância com os <Link to={LEGAL_CONFIG.termsOfUseUrl} className="text-blue-600 hover:underline">Termos de Uso</Link> e <Link to={LEGAL_CONFIG.privacyPolicyUrl} className="text-blue-600 hover:underline">Política de Privacidade</Link> da plataforma.
                            </p>
                        </div>
                        {!companyStatus.terms && (
                            <Button onClick={() => navigate('/contract-sign')} className="w-full sm:w-auto">
                                Ler e Aceitar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* STEP 2: PAGAMENTO */}
                <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.payment ? 'border-green-200 bg-green-50' : (companyStatus.terms ? 'border-blue-200 bg-white shadow-md shadow-blue-50' : 'border-slate-200 bg-white opacity-60')}`}>
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className={`p-3 rounded-xl shrink-0 ${companyStatus.payment ? 'bg-green-200 text-green-700' : (companyStatus.terms ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400')}`}>
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                2. Ativação do Plano
                                {companyStatus.payment && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span>}
                            </h3>
                            <p className="text-slate-600 text-sm mt-1">Confirmação da assinatura do serviço.</p>
                        </div>
                        {!companyStatus.payment && (
                            <Button variant={companyStatus.terms ? 'primary' : 'outline'} disabled={!companyStatus.terms} onClick={() => navigate('/payment')} className="w-full sm:w-auto">
                                Realizar Pagamento
                            </Button>
                        )}
                    </div>
                </div>

                {/* STEP 3: VERIFICAÇÃO DE E-MAIL */}
                <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.emailVerified ? 'border-green-200 bg-green-50' : (companyStatus.payment ? 'border-blue-200 bg-white shadow-md shadow-blue-50' : 'border-slate-200 bg-white opacity-60')}`}>
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className={`p-3 rounded-xl shrink-0 ${companyStatus.emailVerified ? 'bg-green-200 text-green-700' : (companyStatus.payment ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400')}`}>
                            <MailCheck className="h-6 w-6" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                3. Confirmação de E-mail
                                {companyStatus.emailVerified && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span>}
                            </h3>
                            <p className="text-slate-600 text-sm mt-1">Verifique a sua caixa de entrada e clique no link de segurança que enviamos.</p>
                        </div>
                        {!companyStatus.emailVerified && companyStatus.payment && (
                            <div className="text-center sm:text-right w-full sm:w-auto">
                                <span className="text-sm font-bold text-blue-600 animate-pulse">Aguardando confirmação...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* STEP 4: DADOS DA EMPRESA */}
                <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.data ? 'border-green-200 bg-green-50' : (companyStatus.payment ? 'border-blue-200 bg-white shadow-md shadow-blue-50' : 'border-slate-200 bg-white opacity-60')}`}>
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className={`p-3 rounded-xl shrink-0 ${companyStatus.data ? 'bg-green-200 text-green-700' : (companyStatus.payment ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400')}`}>
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                4. Dados Cadastrais
                                {companyStatus.data && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span>}
                            </h3>
                            <p className="text-slate-600 text-sm mt-1">Preenchimento completo dos dados da empresa e responsável legal.</p>
                        </div>
                        {!companyStatus.data && (
                            <Button variant={companyStatus.payment ? 'primary' : 'outline'} disabled={!companyStatus.payment} onClick={() => navigate('/company-settings')} className="w-full sm:w-auto">
                                Completar Dados
                            </Button>
                        )}
                    </div>
                </div>

                {/* STEP 5: CONTRATO E PROCURAÇÃO */}
                <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.contract ? 'border-green-200 bg-green-50' : (companyStatus.data ? 'border-blue-200 bg-white shadow-md shadow-blue-50' : 'border-slate-200 bg-white opacity-60')}`}>
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className={`p-3 rounded-xl shrink-0 ${companyStatus.contract ? 'bg-green-200 text-green-700' : (companyStatus.data ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400')}`}>
                            <FileSignature className="h-6 w-6" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                5. Contrato e Procuração
                                {companyStatus.contract && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Concluído</span>}
                            </h3>
                            <p className="text-slate-600 text-sm mt-1">Assinatura digital dos documentos de representação.</p>
                        </div>
                        {!companyStatus.contract && (
                            <Button variant={companyStatus.data ? 'primary' : 'outline'} disabled={!companyStatus.data} onClick={() => navigate('/signature')} className="w-full sm:w-auto">
                                Assinar Documentos
                            </Button>
                        )}
                    </div>
                </div>

                {/* STEP 6: VALIDAÇÃO */}
                <div className={`p-5 rounded-xl border-2 transition-all ${companyStatus.approval ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className={`p-3 rounded-xl shrink-0 ${companyStatus.approval ? 'bg-green-200 text-green-700' : 'bg-amber-100 text-amber-600'}`}>
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-3">
                                6. Validação da Equipe
                                {companyStatus.approval ?
                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Aprovado</span> :
                                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Em Análise</span>
                                }
                            </h3>
                            <p className="text-slate-600 text-sm mt-1">
                                Nossa equipe fará a conferência final dos seus dados e documentos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}