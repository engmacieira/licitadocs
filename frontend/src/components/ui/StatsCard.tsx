import type { ElementType } from 'react';
import { Skeleton } from './Skeleton';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ElementType;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'blue' | 'green' | 'red' | 'amber'; // 🎨 Novidade: Cores temáticas
    loading?: boolean; // ⏳ Novidade: Estado de carregamento
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    color = 'blue', // Padrão azul
    loading = false
}: StatsCardProps) {

    // Mapa de cores para facilitar a manutenção
    const colorStyles = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
        green: { bg: 'bg-green-50', text: 'text-green-600' },
        red: { bg: 'bg-red-50', text: 'text-red-600' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    };

    const currentStyle = colorStyles[color];

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-[130px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
                <Skeleton className="h-3 w-32 mt-2" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
                </div>

                {/* Ícone com cor dinâmica */}
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center transition-colors ${currentStyle.bg} ${currentStyle.text} group-hover:scale-110 duration-300`}>
                    <Icon size={24} />
                </div>
            </div>

            {description && (
                <div className="mt-4 flex items-center text-xs">
                    {trend === 'up' && <span className="text-green-600 font-bold mr-1 flex items-center">↑</span>}
                    {trend === 'down' && <span className="text-red-600 font-bold mr-1 flex items-center">↓</span>}
                    <span className="text-slate-400 font-medium">{description}</span>
                </div>
            )}
        </div>
    );
}