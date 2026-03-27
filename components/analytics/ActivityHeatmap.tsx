'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeatmapPoint } from '@/hooks/useAnalytics';

// ─── Intensity levels ───────────────────────────────────────
function getIntensityClass(hours: number): string {
  if (hours === 0) return 'bg-gray-800';
  if (hours < 1) return 'bg-green-900/60';
  if (hours < 2) return 'bg-green-700/70';
  if (hours < 4) return 'bg-green-600';
  if (hours < 6) return 'bg-green-500';
  return 'bg-green-400';
}

interface HeatmapProps {
  data: HeatmapPoint[];
}

export function ActivityHeatmap({ data }: HeatmapProps) {
  // Group data into weeks (columns) starting from Sunday
  const { weeks, monthLabels } = useMemo(() => {
    if (!data.length) return { weeks: [], monthLabels: [] };

    const weeksArr: HeatmapPoint[][] = [];
    let currentWeek: HeatmapPoint[] = [];

    // Pad the first week so columns align by day-of-week
    const firstDate = new Date(data[0].date + 'T00:00:00');
    const firstDow = firstDate.getDay(); // 0=Sun
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push({ date: '', hours: -1 }); // empty placeholder
    }

    data.forEach((d) => {
      const dow = new Date(d.date + 'T00:00:00').getDay();
      if (dow === 0 && currentWeek.length > 0) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(d);
    });
    if (currentWeek.length) weeksArr.push(currentWeek);

    // Calculate month labels for the top axis
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeksArr.forEach((week, colIdx) => {
      const validDay = week.find((d) => d.date);
      if (validDay) {
        const month = new Date(validDay.date + 'T00:00:00').getMonth();
        if (month !== lastMonth) {
          labels.push({
            label: new Date(validDay.date + 'T00:00:00').toLocaleDateString('en', {
              month: 'short',
            }),
            col: colIdx,
          });
          lastMonth = month;
        }
      }
    });

    return { weeks: weeksArr, monthLabels: labels };
  }, [data]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-200 text-base">
          Activity Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="flex ml-8 mb-1 text-[10px] text-gray-500">
            {monthLabels.map((ml, i) => (
              <span
                key={i}
                style={{ position: 'relative', left: `${ml.col * 14}px` }}
                className="absolute"
              >
                {ml.label}
              </span>
            ))}
          </div>

          <div className="flex gap-[2px] mt-5">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-[2px] mr-1">
              {dayLabels.map((l, i) => (
                <div
                  key={i}
                  className="w-5 h-[12px] text-[9px] text-gray-500 flex items-center"
                >
                  {l}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {weeks.map((week, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-[2px]">
                {week.map((day, rowIdx) => (
                  <div
                    key={rowIdx}
                    className={`w-[12px] h-[12px] rounded-[2px] ${
                      day.hours < 0
                        ? 'bg-transparent'
                        : getIntensityClass(day.hours)
                    }`}
                    title={
                      day.date
                        ? `${day.date}: ${day.hours}h`
                        : ''
                    }
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1 mt-3 text-[10px] text-gray-500">
            <span>Less</span>
            {['bg-gray-800', 'bg-green-900/60', 'bg-green-700/70', 'bg-green-600', 'bg-green-500', 'bg-green-400'].map(
              (cls, i) => (
                <div key={i} className={`w-[12px] h-[12px] rounded-[2px] ${cls}`} />
              )
            )}
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
