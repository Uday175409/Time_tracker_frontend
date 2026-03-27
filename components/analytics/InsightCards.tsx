'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Insights } from '@/hooks/useAnalytics';
import {
  Calendar,
  Clock,
  Target,
  Trophy,
  TrendingUp,
  Zap,
  BarChart3,
  Flame,
} from 'lucide-react';

interface InsightCardsProps {
  data: Insights;
}

export function InsightCards({ data }: InsightCardsProps) {
  const cards = [
    {
      label: 'Most Productive Day',
      value: data.mostProductiveDay,
      sub: `${data.mostProductiveDayHours}h total`,
      icon: Calendar,
      color: 'text-yellow-400',
    },
    {
      label: 'Avg Session Length',
      value: `${data.avgSessionMinutes} min`,
      sub: `${data.totalSessions} sessions total`,
      icon: Clock,
      color: 'text-blue-400',
    },
    {
      label: 'Top Category',
      value: data.topCategory?.name || '—',
      sub: data.topCategory ? `${data.topCategory.hours}h logged` : '',
      icon: Trophy,
      color: 'text-purple-400',
    },
    {
      label: 'Daily Average',
      value: `${data.dailyAvgHours}h`,
      sub: `${data.daysTracked} days tracked`,
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: 'Productivity Rate',
      value: `${data.productivityRate}%`,
      sub: 'productive / total',
      icon: Target,
      color: 'text-orange-400',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label} className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon size={14} className={c.color} />
              <span className="text-[11px] text-gray-500 uppercase tracking-wider">
                {c.label}
              </span>
            </div>
            <p className="text-xl font-bold text-white">{c.value}</p>
            {c.sub && (
              <p className="text-[11px] text-gray-500 mt-0.5">{c.sub}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
