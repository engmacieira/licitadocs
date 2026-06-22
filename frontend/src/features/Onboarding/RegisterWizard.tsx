import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

// Injeção do nosso Hook customizado local da Feature
import { useRegisterWizard } from './hooks/useRegisterWizard';

// Componentes reutilizáveis da UI global
import { Button } from '../../components/ui/Button';

// Subcomponentes locais da própria funcionalidade de Onboarding
import { ValuePropositionPanel } from './components/ValuePropositionPanel';
import { Step1Company } from './components/Step1Company';
import { Step2Responsible } from './components/Step2Responsible';
import { Step3Credentials } from './components/Step3Credentials';
import { Step4Uploads } from './components/Step4Uploads';

/**
 * Componente Orquestrador Visual do fluxo de Registo (Onboarding).
 * Aplica os princípios de Clean Code delegando toda a lógica de estado 
 * e regras de negócio para o hook customizado 'useRegisterWizard'.
 */
export function RegisterWizard() {
    const navigate = useNavigate();

    // Consumo limpo e declarativo do cérebro da nossa Feature
    const {
        step,
        setStep,
        isLoading,
        oauthSession,
        files,
        updateFile,
        formMethods,
        handleSocialRegister,
        handleCnpjChange,
        handleCpfChange,
        nextStep,
        onSubmit
    } = useRegisterWizard();

    const { register, handleSubmit, formState: { errors } } = formMethods;

    return (
        <div className="min-h-screen grid lg:grid-cols-2 font-sans bg-white">

            {/* --- LADO ESQUERDO: WIZARD DE REGISTO INTERATIVO --- */}
            <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 overflow-y-auto">

                {/* Botão de retrocesso para a Landing Page */}
                <div className="absolute top-8 left-6 sm:left-12 lg:left-16">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group"
                    >
                        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar para o site
                    </button>
                </div>

                <div className="w-full max-w-md mx-auto mt-12">

                    {/* Cabeçalho do Stepper Dinâmico */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Building2 className="text-blue-600 h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                            {oauthSession ? "Complete seu Perfil" : "Crie sua conta"}
                        </h1>
                        <p className="text-sm text-slate-600 mb-6">
                            Passo {step} de 4: <span className="font-bold text-slate-900">
                                {step === 1 ? 'Empresa' : step === 2 ? 'Responsável' : step === 3 ? 'Acesso' : 'Documentação'}
                            </span>
                        </p>

                        {/* Indicador visual de progresso (Barra de bolinhas) */}
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className={`h-2 rounded-full transition-all duration-500 ${i <= step ? 'w-10 bg-blue-600' : 'w-3 bg-slate-200'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* --- BOTÕES DE AUTENTICAÇÃO SOCIAL (Apenas no início do fluxo manual) --- */}
                    {!oauthSession && step === 1 && (
                        <div className="mb-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isLoading}
                                    onClick={() => handleSocialRegister('google')}
                                    className="h-12 bg-white hover:bg-slate-50 border-slate-200"
                                >
                                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isLoading}
                                    onClick={() => handleSocialRegister('azure')}
                                    className="h-12 bg-white hover:bg-slate-50 border-slate-200"
                                >
                                    <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21">
                                        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                                        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                                        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                                    </svg>
                                    Microsoft
                                </Button>
                            </div>
                            <div className="relative mt-6 mb-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-3 bg-white text-slate-500 font-medium">Ou cadastre manualmente</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- INJEÇÃO MODULAR DOS SUBCOMPONENTES DOS PASSOS --- */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {step === 1 && (
                            <Step1Company register={register} errors={errors} handleCnpjChange={handleCnpjChange} nextStep={nextStep} />
                        )}
                        {step === 2 && (
                            <Step2Responsible register={register} errors={errors} handleCpfChange={handleCpfChange} nextStep={nextStep} setStep={setStep} />
                        )}

                        {/* Passo 3 Tradicional: Solicita e-mail e criação de senha */}
                        {step === 3 && !oauthSession && (
                            <Step3Credentials register={register} errors={errors} nextStep={nextStep} setStep={setStep} />
                        )}

                        {/* Passo 3 Enriquecido (OAuth): Intercepta e pula a criação de credenciais */}
                        {step === 3 && oauthSession && (
                            <div className="space-y-5 animate-in slide-in-from-right fade-in duration-300">
                                <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex flex-col items-center text-center gap-3">
                                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                                    <div>
                                        <h3 className="font-bold text-green-900">Autenticação Confirmada</h3>
                                        <p className="text-sm text-green-700 mt-1">
                                            Sua conta está vinculada ao e-mail <strong>{oauthSession.user.email}</strong>. Você não precisará de uma senha para acessar a plataforma.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-1/3 h-12">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="w-2/3 h-12">
                                        Próximo <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <Step4Uploads
                                setStep={setStep}
                                isLoading={isLoading}
                                files={files}
                                setFiles={{
                                    setSocialContract: (f) => updateFile('socialContract', f),
                                    setCnpjCard: (f) => updateFile('cnpjCard', f),
                                    setResponsibleDoc: (f) => updateFile('responsibleDoc', f),
                                    setProxyDoc: (f) => updateFile('proxyDoc', f)
                                }}
                            />
                        )}
                    </form>

                    {/* Link de apoio para quem já possui cadastro */}
                    <div className="pt-8 text-center">
                        <p className="text-sm text-slate-600">Já possui uma conta?{' '}
                            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">Fazer login</Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* --- LADO DIREITO: PAINEL DE MARKETING E PROPRASTA DE VALOR --- */}
            <ValuePropositionPanel />

        </div>
    );
}