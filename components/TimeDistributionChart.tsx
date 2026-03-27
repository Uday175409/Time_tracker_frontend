'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon, Clock } from 'lucide-react';

/** Color palette for pie slices, keyed by category color name */
const SLICE_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
  gray: '#6b7280',
  pink: '#ec4899',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  yellow: '#eab308',
  indigo: '#6366f1',
  emerald: '#10b981',
};

const FALLBACK_COLORS = [
  '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444',
  '#ec4899', '#14b8a6', '#06b6d4', '#eab308', '#6366f1',
];

interface TimeDistributionChartProps {
  /** { "Development": 3600, "Meetings": 1800, ... } — seconds per category */
  totals: Record<string, number>;
  /** Optional: { "Development": "blue", ... } */
  colorMap?: Record<string, string>;
}

export function TimeDistributionChart({ totals, colorMap = {} }: TimeDistributionChartProps) {
  const data = useMemo(() => {
    return Object.entries(totals)
      .filter(([, secs]) => secs > 0)
      .map(([name, value]) => ({ name, value, hours: (value / 3600).toFixed(2) }))
      .sort((a, b) => b.value - a.value);
  }, [totals]);

  const totalSeconds = useMemo(() => Object.values(totals).reduce((a, b) => a + b, 0), [totals]);
  const totalHours = (totalSeconds / 3600).toFixed(2);
  const totalMinutes = Math.round(totalSeconds / 60);

  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-200">
            <PieChartIcon size={18} /> Time Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm text-center py-6">No tracked time yet today.</p>
        </CardContent>
      </Card>
    );
  }

  const getColor = (name: string, index: number) => {
    const catColor = colorMap[name];
    if (catColor && SLICE_COLORS[catColor]) return SLICE_COLORS[catColor];
    return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-200">
          <PieChartIcon size={18} /> Time Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Total hours banner */}
        <div className="flex items-center justify-center gap-3 mb-4 p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
          <Clock size={20} className="text-blue-400" />
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-white">{totalHours}h</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{totalMinutes} minutes total</p>
          </div>
        </div>

        {/* Pie chart */}
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {data.map((entry, idx) => (
                <Cell key={entry.name} fill={getColor(entry.name, idx)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#e5e7eb',
                fontSize: '12px',
              }}
              formatter={((value: number | undefined, name: string | undefined) => {
                const v = value ?? 0;
                const hrs = (v / 3600).toFixed(2);
                const pct = totalSeconds > 0 ? ((v / totalSeconds) * 100).toFixed(1) : '0';
                return [`${hrs}h (${pct}%)`, name ?? ''];
              }) as any}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs text-gray-400">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Breakdown list */}
        <div className="mt-3 space-y-1.5">
          {data.map((entry, idx) => {
            const pct = totalSeconds > 0 ? ((entry.value / totalSeconds) * 100).toFixed(1) : '0';
            return (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getColor(entry.name, idx) }}
                  />
                  <span className="text-gray-300">{entry.name}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-gray-500">{pct}%</span>
                  <span className="font-mono text-gray-300 w-14 text-right">{entry.hours}h</span>
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
