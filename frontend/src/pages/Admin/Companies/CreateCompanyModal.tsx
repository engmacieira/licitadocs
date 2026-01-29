import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Save, Pencil } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';

const companySchema = z.object({
    name: z.string().min(3, "A razão social deve ter pelo menos 3 caracteres"),
    cnpj: z.string().length(14, "O CNPJ deve ter exatamente 14 números"),
});

type CompanySchema = z.infer<typeof companySchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    companyToEdit?: Company | null; // 🆕 Prop nova: Se vier preenchida, é edição
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

    // 🧠 Efeito Mágico: Quando o modal abre, se for edição, preenche os campos
    useEffect(() => {
        if (isOpen) {
            if (companyToEdit) {
                setValue('name', companyToEdit.name);
                setValue('cnpj', companyToEdit.cnpj);
            } else {
                reset({ name: '', cnpj: '' }); // Limpa se for criação
            }
        }
    }, [isOpen, companyToEdit, setValue, reset]);

    async function handleSave(data: CompanySchema) {
        try {
            if (companyToEdit) {
                // 🔄 MODO EDIÇÃO
                await companyService.update(companyToEdit.id, data);
                alert("Empresa atualizada com sucesso!");
            } else {
                // ➕ MODO CRIAÇÃO
                await companyService.create(data);
                alert("Empresa cadastrada com sucesso!");
            }

            reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || "Erro ao salvar empresa.";
            alert(`Erro: ${msg}`);
        }
    }

    if (!isOpen) return null;

    const isEditing = !!companyToEdit;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">

                {/* Cabeçalho */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {isEditing ? <Pencil className="text-blue-600" size={18} /> : <Save className="text-green-600" size={18} />}
                        {isEditing ? 'Editar Empresa' : 'Nova Empresa'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-5">

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Razão Social</label>
                        <Input
                            placeholder="Ex: Construtora Silva Ltda"
                            {...register('name')}
                        />
                        {errors.name && <span className="text-xs text-red-500 font-medium">{errors.name.message}</span>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">CNPJ</label>
                        <Input
                            placeholder="Ex: 12345678000199"
                            maxLength={14}
                            {...register('cnpj')}
                            disabled={isEditing} // 🔒 Geralmente não se muda o CNPJ (é a chave fiscal)
                            className={isEditing ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}
                        />
                        {errors.cnpj && <span className="text-xs text-red-500 font-medium">{errors.cnpj.message}</span>}
                        {!isEditing && <p className="text-xs text-slate-400">Somente números.</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className={isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                            {isEditing ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}