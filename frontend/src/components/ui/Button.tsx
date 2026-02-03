import type { ComponentProps } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ComponentProps<'button'> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export function Button({
    children,
    isLoading,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    ...props
}: ButtonProps) {

    // Configurações de Estilo
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent",
        outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm border-transparent",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent shadow-none",
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-6 text-base",
    };

    return (
        <button
            disabled={isLoading || disabled}
            className={twMerge(
                clsx(
                    // Base styles
                    "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
                    variants[variant],
                    sizes[size],
                    className
                )
            )}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className={clsx("animate-spin", size === 'sm' ? "mr-1 h-3 w-3" : "mr-2 h-4 w-4")} />
                    {/* Mantemos o texto original se possível, ou um texto padrão */}
                    <span className="opacity-90">Processando...</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}