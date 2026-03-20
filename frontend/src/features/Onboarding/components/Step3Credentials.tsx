import { Mail, Lock, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades para o componente Step3Credentials.
 * @interface Step3CredentialsProps
 */
interface Step3CredentialsProps {
    register: any;
    errors: any;
    nextStep: () => void;
    setStep: (step: number) => void;
}

/**
 * Passo 3 do Wizard de Registo: Credenciais de Acesso.
 * Recolhe o e-mail corporativo e a senha para a criação do utilizador.
 */
export function Step3Credentials({ register, errors, nextStep, setStep }: Step3CredentialsProps) {
    return (
        <div className="space-y-5 animate-in slide-in-from-right fade-in duration-300">
            <Input
                id="email"
                label="E-mail Corporativo"
                type="email"
                placeholder="seu@email.com"
                icon={<Mail className="h-5 w-5 text-slate-400" />}
                error={errors.email?.message}
                {...register('email')}
                autoFocus
            />
            <Input
                id="password"
                label="Criar Senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                icon={<Lock className="h-5 w-5 text-slate-400" />}
                error={errors.password?.message}
                {...register('password')}
            />
            <Input
                id="confirmPassword"
                label="Confirmar Senha"
                type="password"
                placeholder="Repita a senha"
                icon={<CheckCircle2 className="h-5 w-5 text-slate-400" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
            />
            <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-1/3 h-12">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button type="button" onClick={nextStep} className="w-2/3 h-12">
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}