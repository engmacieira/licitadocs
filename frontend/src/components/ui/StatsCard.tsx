import type { ElementType } from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ElementType; // Permite passar um ícone do Lucide
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export function StatsCard({ title, value, icon: Icon, description, trend }: StatsCardProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <Icon size={24} />
                </div>
            </div>

            {description && (
                <div className="mt-4 flex items-center text-xs">
                    {trend === 'up' && <span className="text-green-600 font-medium mr-1">↑ Crescimento</span>}
                    {trend === 'down' && <span className="text-red-600 font-medium mr-1">↓ Queda</span>}
                    <span className="text-slate-400">{description}</span>
                </div>
            )}
        </div>
    );
}