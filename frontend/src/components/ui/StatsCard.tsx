import type { ElementType } from 'react';
import { Skeleton } from './Skeleton';

/**
 * Propriedades do componente StatsCard.
 * @interface StatsCardProps
 */
export interface StatsCardProps {
    /** Título ou rótulo do card (ex: "Usuários Ativos"). */
    title: string;
    /** Valor principal em destaque (ex: "1.240" ou "R$ 5.000,00"). */
    value: string | number;
    /** Componente de ícone a ser renderizado (ex: `Users` da biblioteca lucide-react). */
    icon: ElementType;
    /** Texto descritivo secundário ou comparativo (ex: "em relação ao mês passado"). */
    description?: string;
    /** Indicador visual de tendência (seta para cima/baixo). */
    trend?: 'up' | 'down' | 'neutral';
    /** Tema de cor do card. Afeta o fundo do ícone e seu contorno. */
    color?: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'indigo';
    /** Se true, exibe a versão de carregamento (Skeleton) do card. */
    loading?: boolean;
}

type StatsCardColor = NonNullable<StatsCardProps['color']>;
type StatsCardTrend = NonNullable<StatsCardProps['trend']>;

const STATS_CARD_VARIANTS: Record<StatsCardColor, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
};

const TREND_VARIANTS: Record<StatsCardTrend, { symbol: string; className: string } | null> = {
    up: { symbol: '↑', className: 'text-green-600' },
    down: { symbol: '↓', className: 'text-red-600' },
    neutral: null,
};

/**
 * Card de estatísticas utilizado em Dashboards para exibir métricas rápidas.
 * Possui suporte nativo a estado de carregamento e indicação visual de tendências.
 */
export function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    color = 'blue',
    loading = false
}: StatsCardProps) {
    const theme = STATS_CARD_VARIANTS[color] ?? STATS_CARD_VARIANTS.blue;
    const trendConfig = trend ? TREND_VARIANTS[trend] : null;

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
                    {trendConfig && (
                        <span className={`${trendConfig.className} mr-1 flex items-center`}>
                            {trendConfig.symbol}
                        </span>
                    )}
                    <span className="text-slate-400">{description}</span>
                </div>
            )}
        </div>
    );
}