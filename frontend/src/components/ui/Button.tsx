import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Função utilitária para mesclar classes (padrão shadcn)
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, children, isLoading, variant = 'primary', size = 'md', disabled, ...props }, ref) => {

        const variants = {
            primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent focus-visible:ring-blue-600",
            secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent focus-visible:ring-slate-500",
            outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900",
            ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
            danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm focus-visible:ring-red-600",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 py-2 text-sm",
            lg: "h-12 px-6 text-base",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";