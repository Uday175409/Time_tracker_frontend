'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';
import { useCreateManualEntry } from '@/hooks/useTime';
import { getErrorMessage } from '@/lib/api';
import { CalendarClock } from 'lucide-react';

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateOnly(date: Date): string {
  return formatDateTimeLocal(date).slice(0, 10);
}

function timeFromDate(date: Date): string {
  return formatDateTimeLocal(date).slice(11, 16);
}

function combineLocalDateTime(datePart: string, timePart: string): Date {
  return new Date(`${datePart}T${timePart}:00`);
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const totalMins = i * 15;
  const h = String(Math.floor(totalMins / 60)).padStart(2, '0');
  const m = String(totalMins % 60).padStart(2, '0');
  return `${h}:${m}`;
});

export function ManualEntryForm({ userId }: { userId: string }) {
  const { data: categories } = useCategories(userId);
  const createMutation = useCreateManualEntry();

  const now = useMemo(() => new Date(), []);
  const startDefault = useMemo(() => new Date(now.getTime() - (60 * 60 * 1000)), [now]);

  const [category, setCategory] = useState('Python');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatDateOnly(now));
  const [startTime, setStartTime] = useState(timeFromDate(startDefault));
  const [endTime, setEndTime] = useState(timeFromDate(now));
  const [overwrite, setOverwrite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categories || categories.length === 0) return;
    const exists = categories.some((c) => c.name === category);
    if (!exists) setCategory(categories[0].name);
  }, [categories, category]);

  const startDateObj = useMemo(() => combineLocalDateTime(date, startTime), [date, startTime]);
  const endDateObj = useMemo(() => combineLocalDateTime(date, endTime), [date, endTime]);

  const durationMinutes = useMemo(() => {
    const start = startDateObj.getTime();
    const end = endDateObj.getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return 0;
    return Math.max(0, Math.floor((end - start) / 60000));
  }, [startDateObj, endDateObj]);

  const isInvalidRange = !date || !startTime || !endTime || startDateObj >= endDateObj;

  const applyPreset = (mins: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - mins * 60 * 1000);
    setDate(formatDateOnly(end));
    setStartTime(timeFromDate(start));
    setEndTime(timeFromDate(end));
  };

  const onSubmit = () => {
    if (isInvalidRange) {
      setError('Start time must be before end time.');
      return;
    }

    setError(null);
    createMutation.mutate(
      {
        userId,
        category,
        description: description.trim(),
        startTime: startDateObj.toISOString(),
        endTime: endDateObj.toISOString(),
        overwrite,
      },
      {
        onSuccess: () => {
          setDescription('');
        },
        onError: (err) => {
          setError(getErrorMessage(err, 'Failed to create manual entry'));
        },
      }
    );
  };

  return (
    <Card className="bg-gradient-to-br from-white/[0.05] via-sky-500/5 to-emerald-500/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-white/10 bg-black/10">
        <CardTitle className="text-base text-gray-100 flex items-center gap-2">
          <CalendarClock size={16} className="text-sky-300" />
          Manual Time Entry
        </CardTitle>
        <p className="text-xs text-gray-300">Create a custom time block with quick presets and precise range selection.</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset(30)}
            className="text-xs px-2.5 py-1 rounded-full border border-sky-500/40 text-sky-200 bg-sky-500/10 hover:bg-sky-500/20"
          >
            Last 30m
          </button>
          <button
            type="button"
            onClick={() => applyPreset(60)}
            className="text-xs px-2.5 py-1 rounded-full border border-sky-500/40 text-sky-200 bg-sky-500/10 hover:bg-sky-500/20"
          >
            Last 1h
          </button>
          <button
            type="button"
            onClick={() => {
              setDate(formatDateOnly(new Date()));
              setStartTime('09:00');
              setEndTime('12:00');
            }}
            className="text-xs px-2.5 py-1 rounded-full border border-emerald-500/40 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20"
          >
            Morning 9-12
          </button>
          <button
            type="button"
            onClick={() => {
              setDate(formatDateOnly(new Date()));
              setStartTime('13:00');
              setEndTime('17:00');
            }}
            className="text-xs px-2.5 py-1 rounded-full border border-emerald-500/40 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20"
          >
            Afternoon 1-5
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-300 block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-900/80 border border-white/15 rounded-md px-3 py-2 text-sm text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Start Time</label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-gray-900/80 border border-white/15 rounded-md px-3 py-2 text-sm text-gray-100"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={`start-${t}`} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">End Time</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-gray-900/80 border border-white/15 rounded-md px-3 py-2 text-sm text-gray-100"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={`end-${t}`} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-900/80 border border-white/15 rounded-md px-3 py-2 text-sm text-gray-100"
            >
              {(categories || []).map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Duration</label>
            <div className="h-10 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 flex items-center text-sm text-emerald-300 font-mono">
              {(durationMinutes / 60).toFixed(2)}h
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-gray-900/80 border border-white/15 rounded-md px-3 py-2 text-sm text-gray-100"
            placeholder="What work was completed in this time range?"
          />
        </div>

        <label className="flex items-start gap-3 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-gray-900"
          />
          <span className="text-xs text-amber-100 leading-relaxed">
            Overwrite overlapping entries with this manual entry.
            {" "}
            Existing sessions in the same time range will be adjusted or removed.
          </span>
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={createMutation.isPending || isInvalidRange || !category}>
            {createMutation.isPending ? 'Saving...' : 'Add Manual Entry'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
