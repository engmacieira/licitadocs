import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

/**
 * Propriedades do componente Input.
 * @interface InputProps
 * @extends {InputHTMLAttributes<HTMLInputElement>}
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Texto descritivo exibido acima do campo. */
    label?: string;
    /** Mensagem de erro exibida abaixo do campo com estilo de alerta (vermelho). */
    error?: string;
    /** Texto de ajuda adicional exibido abaixo do campo. Ignorado se houver `error`. */
    helperText?: string;
    /** Ícone opcional (ex: Lucide Icons) renderizado no lado esquerdo do input. */
    icon?: ReactNode;
    /** Objeto de registro retornado pelo React Hook Form (ex: `...register('campo')`). */
    registration?: any;
}

/**
 * Componente de entrada de texto (Input) do Design System.
 * Integrável com React Hook Form e suporta ícones, labels e mensagens de validação.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, icon, className, registration, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label
                        htmlFor={props.id}
                        className="text-sm font-medium text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {label}
                    </label>
                )}

                <div className="relative group">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors">
                            {icon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        className={cn(
                            "flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 transition-all",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                            icon ? "pl-10" : "",
                            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "",
                            className
                        )}
                        {...registration}
                        {...props}
                    />
                </div>

                {error ? (
                    <p className="text-[0.8rem] font-medium text-red-500 animate-in slide-in-from-top-1">
                        {error}
                    </p>
                ) : helperText ? (
                    <p className="text-[0.8rem] text-slate-500">
                        {helperText}
                    </p>
                ) : null}
            </div>
        );
    }
);

Input.displayName = "Input";