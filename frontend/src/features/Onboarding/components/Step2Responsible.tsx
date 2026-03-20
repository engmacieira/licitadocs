import { User, ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades para o componente Step2Responsible.
 * @interface Step2ResponsibleProps
 */
interface Step2ResponsibleProps {
    register: any;
    errors: any;
    handleCpfChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    nextStep: () => void;
    setStep: (step: number) => void;
}

/**
 * Passo 2 do Wizard de Registo: Informações do Responsável Legal.
 * Recolhe o Nome e o CPF para validação de identidade.
 */
export function Step2Responsible({ register, errors, handleCpfChange, nextStep, setStep }: Step2ResponsibleProps) {
    return (
        <div className="space-y-5 animate-in slide-in-from-right fade-in duration-300">
            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start border border-blue-100">
                <User className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800 leading-relaxed">
                    Precisamos dos dados do responsável legal para validar a autenticidade da empresa na plataforma.
                </p>
            </div>

            <Input
                id="responsibleName"
                label="Nome Completo"
                placeholder="Ex: João da Silva"
                icon={<User className="h-5 w-5 text-slate-400" />}
                error={errors.responsibleName?.message}
                {...register('responsibleName')}
                autoFocus
            />
            <Input
                id="cpf"
                label="CPF"
                placeholder="000.000.000-00"
                icon={<User className="h-5 w-5 text-slate-400" />}
                error={errors.cpf?.message}
                {...register('cpf')}
                onChange={handleCpfChange}
                maxLength={14}
            />
            <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3 h-12">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button type="button" onClick={nextStep} className="w-2/3 h-12">
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}