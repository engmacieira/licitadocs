import { Building2, Briefcase, ArrowRight } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades para o componente Step1Company.
 * @interface Step1CompanyProps
 */
interface Step1CompanyProps {
    register: any;
    errors: any;
    handleCnpjChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    nextStep: () => void;
}

/**
 * Passo 1 do Wizard de Registo: Informações da Empresa.
 * Recolhe o CNPJ, Razão Social e Nome Fantasia.
 */
export function Step1Company({ register, errors, handleCnpjChange, nextStep }: Step1CompanyProps) {
    return (
        <div className="space-y-5 animate-in slide-in-from-right fade-in duration-300">
            <Input
                id="cnpj"
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                icon={<Building2 className="h-5 w-5 text-slate-400" />}
                error={errors.cnpj?.message}
                {...register('cnpj')}
                onChange={handleCnpjChange}
                maxLength={18}
                autoFocus
            />
            <Input
                id="legalName"
                label="Razão Social"
                placeholder="Nome Legal da Empresa Ltda"
                icon={<Briefcase className="h-5 w-5 text-slate-400" />}
                error={errors.legalName?.message}
                {...register('legalName')}
            />
            <Input
                id="tradeName"
                label="Nome Fantasia (Opcional)"
                placeholder="Como a empresa é conhecida"
                icon={<Building2 className="h-5 w-5 text-slate-400" />}
                error={errors.tradeName?.message}
                {...register('tradeName')}
            />
            <div className="pt-2">
                <Button type="button" onClick={nextStep} className="w-full h-12">
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}