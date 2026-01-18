import type { ComponentProps } from 'react';
import { Loader2 } from 'lucide-react'; // Ícone de spinner
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ComponentProps<'button'> {
    isLoading?: boolean;
    variant?: 'primary' | 'outline';
}

export function Button({
    children,
    isLoading,
    variant = 'primary',
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={isLoading || disabled}
            className={twMerge(
                clsx(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full",
                    // Variantes de cor
                    variant === 'primary' && "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
                    variant === 'outline' && "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900",
                    className
                )
            )}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                </>
            ) : (
                children
            )}
        </button>
    );
}