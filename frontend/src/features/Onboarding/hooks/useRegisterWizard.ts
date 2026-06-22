import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// Importações Globais (Ajuste os caminhos conforme a sua estrutura raiz)
import { useAuth } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';
import { supabase } from '../../../services/supabase';
import { registerSchema } from '../../../schemas/registerSchema';
import type { RegisterFormData } from '../../../schemas/registerSchema';

// Importação do nosso novo utilitário local
import { formatCnpj, formatCpf } from '../utils/masks';

/**
 * Hook customizado que concentra toda a lógica de negócio, estados e submissões
 * do fluxo de Onboarding (Wizard).
 */
export function useRegisterWizard() {
    const navigate = useNavigate();
    const { signIn, reloadContext } = useAuth();

    // --- ESTADOS DO WIZARD E OAUTH ---
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [oauthSession, setOauthSession] = useState<any>(null);

    // --- ESTADOS DE FICHEIROS ---
    const [files, setFiles] = useState({
        socialContract: null as File | null,
        cnpjCard: null as File | null,
        responsibleDoc: null as File | null,
        proxyDoc: null as File | null,
    });

    const formMethods = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange'
    });

    // --- EFEITO: VERIFICA SESSÃO OAUTH AO CARREGAR A TELA ---
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setOauthSession(session);
                // Preenche o formulário silenciosamente com o e-mail do provedor
                formMethods.setValue('email', session.user.email || '', { shouldValidate: true });
            }
        });
    }, [formMethods]);

    // --- HANDLERS DE AÇÃO ---
    const handleSocialRegister = async (provider: 'google' | 'azure') => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/register` }
        });
        
        if (error) {
            toast.error("Erro na comunicação com o provedor.");
            setIsLoading(false);
        }
    };

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCnpj(e.target.value);
        formMethods.setValue('cnpj', formatted, { shouldValidate: true });
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCpf(e.target.value);
        formMethods.setValue('cpf', formatted, { shouldValidate: true });
    };

    const updateFile = (key: keyof typeof files, file: File | null) => {
        setFiles(prev => ({ ...prev, [key]: file }));
    };

    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (step === 1) fieldsToValidate = ['cnpj', 'legalName', 'tradeName'];
        if (step === 2) fieldsToValidate = ['responsibleName', 'cpf'];
        
        // Só exige validação de e-mail e senha se NÃO for utilizador OAuth
        if (step === 3 && !oauthSession) fieldsToValidate = ['email', 'password', 'confirmPassword'];

        const isValid = await formMethods.trigger(fieldsToValidate);
        if (isValid) setStep((s) => s + 1);
    };

    // --- SUBMISSÃO PRINCIPAL (FLUXO HÍBRIDO) ---
    const onSubmit = async (data: RegisterFormData) => {
        if (!files.socialContract || !files.cnpjCard || !files.responsibleDoc) {
            toast.error("Por favor, anexe todos os documentos obrigatórios.");
            return;
        }

        try {
            setIsLoading(true);
            toast.info("Processando seu cadastro...", { duration: 5000 });

            const cnpjClean = data.cnpj.replace(/\D/g, '');
            const cpfClean = data.cpf.replace(/\D/g, '');

            const formData = new FormData();
            formData.append('legal_name', data.legalName);
            if (data.tradeName) formData.append('trade_name', data.tradeName);
            formData.append('cnpj', cnpjClean);
            formData.append('responsible_name', data.responsibleName);
            formData.append('nome', data.responsibleName);
            formData.append('cpf', cpfClean);
            formData.append('social_contract', files.socialContract);
            formData.append('cnpj_card', files.cnpjCard);
            formData.append('responsible_doc', files.responsibleDoc);
            if (files.proxyDoc) formData.append('proxy_doc', files.proxyDoc);

            // BIFURCAÇÃO DA INTELIGÊNCIA: OAuth vs Tradicional
            if (oauthSession) {
                formData.append('email', oauthSession.user.email);
                formData.append('supabase_user_id', oauthSession.user.id);
                
                // Envia para a nova rota que não pede senha
                const response = await authService.oauthRegister(formData);
                localStorage.setItem('@LicitaDoc:token', response.access_token);
                await reloadContext();
            } else {
                formData.append('email', data.email);
                formData.append('password', data.password);
                
                // Envio tradicional
                await authService.register(formData);
                await signIn({ email: data.email, password: data.password });
            }

            toast.success("Cadastro realizado!", { description: "Direcionando para assinatura digital..." });
            navigate('/contract-sign', { replace: true });

        } catch (error: any) {
            console.error("Erro no Registro:", error);
            const errorMessage = error.message || '';
            
            if (error.code === 'ECONNABORTED' || errorMessage.includes('timeout') || errorMessage.includes('Network Error')) {
                toast.error("Conexão instável ou muito lenta.", { description: "Seu cadastro demorou muito para responder."});
            } else if (error.response?.status === 422) {
                toast.error("Erro de validação", { description: "Verifique se o CNPJ e CPF estão corretos." });
            } else if (error.response?.status === 413) {
                toast.error("Arquivo muito grande", { description: "Um dos documentos excede o limite de 5MB." });
            } else if (error.response?.status === 400) {
                toast.error("Erro no cadastro", { description: error.response?.data?.detail });
            } else {
                toast.error("Erro ao criar conta", { description: "Ocorreu um erro inesperado. Tente novamente." });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
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
    };
}