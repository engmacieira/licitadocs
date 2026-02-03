import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Building2, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';

const companySchema = z.object({
    name: z.string().min(3, "A razão social deve ter pelo menos 3 caracteres"),
    cnpj: z.string().length(14, "O CNPJ deve ter exatamente 14 números (sem pontuação)"),
});

type CompanySchema = z.infer<typeof companySchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    companyToEdit?: Company | null;
}

export function CreateCompanyModal({ isOpen, onClose, onSuccess, companyToEdit }: Props) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue
    } = useForm<CompanySchema>({
        resolver: zodResolver(companySchema)
    });

    // Resetar ou Preencher formulário ao abrir
    useEffect(() => {
        if (isOpen) {
            if (companyToEdit) {
                setValue('name', companyToEdit.name); // ou razao_social dependendo do backend
                setValue('cnpj', companyToEdit.cnpj);
            } else {
                reset({ name: '', cnpj: '' });
            }
        }
    }, [isOpen, companyToEdit, setValue, reset]);

    async function handleSave(data: CompanySchema) {
        try {
            if (companyToEdit) {
                // Modo Edição
                await companyService.update(companyToEdit.id, data);
                toast.success("Empresa atualizada com sucesso!");
            } else {
                // Modo Criação
                await companyService.create(data);
                toast.success("Empresa cadastrada com sucesso!");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || "Erro ao salvar empresa.";
            toast.error("Não foi possível salvar", { description: msg });
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">

                {/* Header do Modal */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="text-blue-600" />
                        {companyToEdit ? 'Editar Empresa' : 'Nova Empresa'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {companyToEdit ? 'Atualize os dados cadastrais.' : 'Preencha os dados para criar um novo cofre.'}
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit(handleSave)} className="space-y-4">

                    <Input
                        label="Razão Social / Nome"
                        placeholder="Ex: Construtora Silva LTDA"
                        icon={<Building2 size={18} />}
                        error={errors.name?.message}
                        {...register('name')}
                    />

                    <Input
                        label="CNPJ (Apenas números)"
                        placeholder="Ex: 12345678000199"
                        maxLength={14}
                        icon={<FileText size={18} />}
                        error={errors.cnpj?.message}
                        {...register('cnpj')}
                        disabled={!!companyToEdit} // Bloqueia edição de CNPJ (boa prática)
                        helperText={companyToEdit ? "O CNPJ não pode ser alterado." : "Digite apenas os números."}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className={companyToEdit ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {companyToEdit ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}