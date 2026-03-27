'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendPoint } from '@/hooks/useAnalytics';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface SessionLengthChartProps {
  data: TrendPoint[];
}

export function SessionLengthChart({ data }: SessionLengthChartProps) {
  const formatted = data
    .filter((d) => d.sessions > 0)
    .map((d) => ({
      ...d,
      label: new Date(d.date + 'T00:00:00').toLocaleDateString('en', {
        month: 'short',
        day: 'numeric',
      }),
    }));

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-200 text-base">
          Avg Session Length
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="sessionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="label"
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} unit="m" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(value) => [`${value} min`, 'Avg Session']}
            />
            <Area
              type="monotone"
              dataKey="avgSessionMinutes"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#sessionGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
