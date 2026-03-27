'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyCategoryPoint } from '@/hooks/useAnalytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

const COLORS = [
  '#3b82f6', '#4ade80', '#a855f7', '#f97316',
  '#ef4444', '#14b8a6', '#eab308', '#ec4899',
];

interface CategoryComparisonChartProps {
  data: WeeklyCategoryPoint[];
}

export function CategoryComparisonChart({ data }: CategoryComparisonChartProps) {
  // Pivot: rows = weeks, columns = categories
  const { chartData, categories } = useMemo(() => {
    const cats = new Set<string>();
    const weekMap: Record<string, Record<string, number>> = {};

    data.forEach((d) => {
      cats.add(d.category);
      if (!weekMap[d.week]) weekMap[d.week] = {};
      weekMap[d.week][d.category] = d.hours;
    });

    const catArray = Array.from(cats);
    const rows = Object.entries(weekMap).map(([week, vals]) => ({
      week,
      ...vals,
    }));

    return { chartData: rows, categories: catArray };
  }, [data]);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-200 text-base">
          Weekly Category Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="week" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} unit="h" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {categories.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={cat}
                fill={COLORS[i % COLORS.length]}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
