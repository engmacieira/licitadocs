import type { ElementType } from 'react';
import { Skeleton } from './Skeleton';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ElementType; // Aqui recebemos o componente (ex: DollarSign)
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'blue' | 'green' | 'red' | 'purple' | 'amber';
    loading?: boolean;
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    color = 'blue',
    loading = false
}: StatsCardProps) {

    // Mapa de temas
    const themes = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
        green: { bg: 'bg-green-50', text: 'text-green-600' },
        red: { bg: 'bg-red-50', text: 'text-red-600' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    };

    const theme = themes[color] || themes.blue;

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
                <Skeleton className="h-3 w-32" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center transition-colors ${theme.bg} ${theme.text} group-hover:scale-110 duration-300`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>

            {description && (
                <div className="mt-4 flex items-center text-xs font-medium">
                    {trend === 'up' && <span className="text-green-600 mr-1 flex items-center">↑</span>}
                    {trend === 'down' && <span className="text-red-600 mr-1 flex items-center">↓</span>}
                    <span className="text-slate-400">{description}</span>
                </div>
            )}
        </div>
    );
}