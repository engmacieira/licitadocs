import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends ComponentProps<'input'> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: ReactNode; // Aceita um componente direto, ex: <Search size={18} />
}

// Usamos forwardRef para garantir compatibilidade máxima com bibliotecas de form
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, icon, className, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label className="text-sm font-medium text-slate-700">
                        {label}
                    </label>
                )}

                <div className="relative group">
                    {/* Renderização Condicional do Ícone */}
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                            {icon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        className={twMerge(
                            clsx(
                                // Estilos Base
                                "flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 transition-all shadow-sm",
                                // Estados de Foco (Mais elegante agora)
                                "focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500",
                                // Estado Desabilitado
                                "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                                // Ajuste de Padding se tiver ícone
                                icon && "pl-10",
                                // Estado de Erro
                                error && "border-red-300 focus:border-red-500 focus:ring-red-500/10",
                                className
                            )
                        )}
                        {...props}
                    />
                </div>

                {/* Mensagem de Erro ou Ajuda */}
                {error ? (
                    <span className="text-xs text-red-500 font-medium animate-in slide-in-from-top-1">
                        {error}
                    </span>
                ) : helperText ? (
                    <span className="text-xs text-slate-500">
                        {helperText}
                    </span>
                ) : null}
            </div>
        );
    }
);

Input.displayName = "Input";