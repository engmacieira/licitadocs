import type { ComponentProps } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Estendemos os props padrões do HTML (type, placeholder, onChange, etc)
interface InputProps extends ComponentProps<'input'> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}

            <input
                className={twMerge(
                    clsx(
                        // Estilos Base
                        "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                        // Se tiver erro, borda fica vermelha
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )
                )}
                {...props}
            />

            {error && (
                <span className="text-xs text-red-500 font-medium">{error}</span>
            )}
        </div>
    );
}