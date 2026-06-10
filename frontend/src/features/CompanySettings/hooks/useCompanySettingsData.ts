import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { companyService } from '../../../services/companyService';
import api from '../../../services/api';
import type { CompanyUpdatePayload, Company } from '../../../types';

export interface CompanyFormSchema {
    razao_social: string; cnpj: string; nome_fantasia: string;
    email_corporativo: string; telefone: string; responsavel_nome: string;
    cep: string; logradouro: string; numero: string; bairro: string;
    cidade: string; estado: string;
}

export interface ProfileFormSchema {
    nome: string; cpf: string; rg: string; celular: string;
    genero: string; nacionalidade: string; estado_civil: string; profissao: string;
}

export interface PasswordFormSchema {
    currentPassword: string;
    password: string;
    confirmPassword: string;
}

export function useCompanySettingsData(currentCompany: Company | null, user: any) {
    const [statusFlags, setStatusFlags] = useState({
        data: false,
        contract: false,
        payment: false,
        approval: false,
        data_email_verified: false
    });

    const companyForm = useForm<CompanyFormSchema>();
    const profileForm = useForm<ProfileFormSchema>();
    const passwordForm = useForm<PasswordFormSchema>();

    const loadAllData = useCallback(async () => {
        if (!currentCompany?.id) return;
        try {
            // A. Empresa
            const freshCompany = await companyService.getById(currentCompany.id) as any;
            setStatusFlags({
                data: freshCompany.is_data_completed || false,
                contract: freshCompany.is_contract_signed || false,
                payment: freshCompany.is_payment_active || false,
                approval: freshCompany.is_admin_verified || false,
                data_email_verified: freshCompany.is_email_verified || (user as any)?.is_email_verified || false
            });

            // Evita resetar se o formulário estiver sujo para não apagar o que o usuário está digitando
            if (!companyForm.formState.isDirty) {
                companyForm.reset({
                    razao_social: freshCompany.razao_social || freshCompany.name || currentCompany.razao_social,
                    cnpj: freshCompany.cnpj || currentCompany.cnpj,
                    nome_fantasia: freshCompany.nome_fantasia || '',
                    email_corporativo: freshCompany.email_corporativo || (user as any)?.email || user?.sub || '',
                    telefone: freshCompany.telefone || '',
                    responsavel_nome: freshCompany.responsavel_nome || '',
                    cep: freshCompany.cep || '',
                    logradouro: freshCompany.logradouro || '',
                    numero: freshCompany.numero || '',
                    bairro: freshCompany.bairro || '',
                    cidade: freshCompany.cidade || '',
                    estado: freshCompany.estado || ''
                });
            }

            // B. Perfil
            const { data: userData } = await api.get('/users/me');
            if (!profileForm.formState.isDirty) {
                profileForm.reset({
                    nome: userData.nome || userData.name || userData.full_name || '',
                    cpf: userData.cpf || userData.documento || '',
                    rg: userData.rg || '',
                    celular: userData.celular || '',
                    genero: userData.genero || '',
                    nacionalidade: userData.nacionalidade || '',
                    estado_civil: userData.estado_civil || '',
                    profissao: userData.profissao || ''
                });
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    }, [currentCompany?.id, user, companyForm, profileForm]);

    useEffect(() => {
        if (currentCompany?.id) {
            loadAllData();
        }
    }, [currentCompany?.id, loadAllData]);

    const onSaveDetails = async (data: CompanyFormSchema) => {
        if (!currentCompany?.id) return;
        try {
            const payload: CompanyUpdatePayload = { ...data };
            await companyService.update(currentCompany.id, payload);
            await api.patch(`/companies/${currentCompany.id}/onboarding-step?step=data`);
            setStatusFlags(prev => ({ ...prev, data: true }));
            toast.success("Dados da empresa atualizados com sucesso!");
            // Após salvar, resetamos o estado de "dirty" com os novos dados
            companyForm.reset(data);
        } catch (error) {
            toast.error("Erro ao salvar alterações.");
        }
    };

    const onSaveProfile = async (data: ProfileFormSchema) => {
        try {
            await api.patch('/users/me', data);
            toast.success("Perfil atualizado com sucesso!");
            profileForm.reset(data);
        } catch (error) {
            toast.error("Erro ao atualizar o perfil.");
        }
    };

    const onChangePassword = async (data: PasswordFormSchema) => {
        if (data.password !== data.confirmPassword) {
            toast.error("As senhas novas não coincidem.");
            return;
        }
        try {
            await api.patch('/users/me', {
                current_password: data.currentPassword,
                password: data.password
            });
            toast.success("Senha alterada com sucesso!");
            passwordForm.reset();
        } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error("Senha atual incorreta.");
            } else {
                toast.error("Erro ao alterar senha. Tente novamente.");
            }
        }
    };

    const handleResendVerification = async () => {
        const email = companyForm.getValues('email_corporativo');
        if (!email) {
            toast.error("Por favor, preencha o e-mail corporativo primeiro.");
            return;
        }
        const toastId = toast.loading("Enviando link de verificação...");
        try {
            await api.post('/auth/resend-verification', { email });
            toast.success("Link enviado com sucesso!", {
                id: toastId,
                description: "Verifique sua caixa de entrada e pasta de spam."
            });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao reenviar e-mail. Tente novamente.", { id: toastId });
        }
    };

    return {
        statusFlags,
        companyForm,
        profileForm,
        passwordForm,
        onSaveDetails,
        onSaveProfile,
        onChangePassword,
        handleResendVerification,
        refreshData: loadAllData
    };
}
