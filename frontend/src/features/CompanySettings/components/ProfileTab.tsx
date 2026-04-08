import { UserCircle, Lock, ShieldCheck, Save } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { ProfileFormSchema, PasswordFormSchema } from '../CompanySettingsOrchestrator';

/**
 * Propriedades do componente ProfileTab.
 * @interface ProfileTabProps
 */
interface ProfileTabProps {
    profileForm: UseFormReturn<ProfileFormSchema>;
    onSaveProfile: (data: ProfileFormSchema) => void;
    passwordForm: UseFormReturn<PasswordFormSchema>;
    onChangePassword: (data: PasswordFormSchema) => void;
}

/**
 * Componente visual para gestão do perfil do utilizador.
 * Agrupa o formulário de dados pessoais (usado para gerar procurações)
 * e o formulário de alteração de senha.
 */
export function ProfileTab({ profileForm, onSaveProfile, passwordForm, onChangePassword }: ProfileTabProps) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-blue-600" /> Informações Pessoais
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">Mantenha seus dados atualizados para emissão de documentos.</p>
                    <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Input label="Nome Completo" placeholder="Seu nome completo" {...profileForm.register("nome")} />
                            </div>
                            <Input label="CPF" placeholder="000.000.000-00" {...profileForm.register("cpf")} />
                            <Input label="RG" placeholder="Sua identidade" {...profileForm.register("rg")} />
                            <Input label="Nacionalidade" placeholder="Ex: Brasileiro" {...profileForm.register("nacionalidade")} />
                            <Input label="Estado Civil" placeholder="Ex: Solteiro, Casado..." {...profileForm.register("estado_civil")} />
                            <Input label="Profissão" placeholder="Ex: Empresário, Engenheiro..." {...profileForm.register("profissao")} />
                            <Input label="Celular / WhatsApp" placeholder="(00) 00000-0000" {...profileForm.register("celular")} />
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1.5">Gênero</label>
                                <select className="w-full rounded-lg border-slate-300 py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" {...profileForm.register("genero")}>
                                    <option value="">Selecione...</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                    <option value="Outro">Outro / Prefiro não dizer</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button type="submit" isLoading={profileForm.formState.isSubmitting}>
                                <Save className="mr-2 h-4 w-4" /> Atualizar Perfil
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="xl:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-slate-500" /> Segurança
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">Alterar senha de acesso.</p>
                    <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                        <Input type="password" label="Senha Atual" {...passwordForm.register("currentPassword", { required: true })} />
                        <Input type="password" label="Nova Senha" {...passwordForm.register("password", { required: true })} />
                        <Input type="password" label="Confirmar Nova Senha" {...passwordForm.register("confirmPassword", { required: true })} />
                        <Button type="submit" variant="outline" className="w-full" isLoading={passwordForm.formState.isSubmitting}>
                            Trocar Senha
                        </Button>
                    </form>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <strong>Atenção:</strong> É obrigatório o preenchimento de todos os seus dados pessoais. Eles serão utilizados para gerar automaticamente as minutas contratuais, procurações e demais documentos com validade jurídica exigidos pela plataforma.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}