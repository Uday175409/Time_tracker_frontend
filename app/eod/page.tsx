'use client';

import { useState, useEffect } from 'react';
import { EODSummaryPanel } from '@/components/EODSummaryPanel';
import { HistoryList } from '@/components/HistoryList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { TemplateSelector } from '@/components/TemplateSelector';
import { TemplateReportPanel } from '@/components/TemplateReportPanel';
import { ReportTemplate } from '@/hooks/useTemplates';
import { useCurrentEOD } from '@/hooks/useEOD';

/**
 * Dedicated EOD page. Users can browse daily summaries by date,
 * view auto-computed metrics, and add summary / highlights / blockers.
 * Supports multiple report templates (daily standup, weekly, project status, custom).
 */
export default function EODPage() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const { data: currentEOD } = useCurrentEOD(user?.id);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!date && currentEOD?.date) {
      setDate(currentEOD.date);
    }
  }, [currentEOD, date]);

  if (!user) return <div className="p-8 text-gray-400">Please login first</div>;
  if (!date) return <div className="p-8 text-gray-400">Loading current date...</div>;

  const changeDate = (days: number) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);
    const nextDate = d.toISOString().split('T')[0];
    const currentDate = currentEOD?.date;

    // Don't allow going into the future beyond the server canonical date.
    if (currentDate && nextDate > currentDate) return;

    setDate(nextDate);
  };

  const isToday = date === currentEOD?.date;

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#020617] text-gray-100 dark relative overflow-hidden font-sans">
      {/* Animated Background Blobs */}
      <div className="fixed w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -top-32 -left-32 animate-blob mix-blend-screen pointer-events-none"></div>
      <div className="fixed w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] top-1/4 right-0 animate-blob animation-delay-2000 mix-blend-screen pointer-events-none"></div>
      <div className="fixed w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[100px] -bottom-32 left-1/4 animate-blob animation-delay-4000 mix-blend-screen pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 animate-fade-in-up">
        {/* Header */}
        <header className="flex items-center gap-4 pb-6 border-b border-white/10">
          <Link href="/">
            <Button variant="ghost" size="sm" className="hover:bg-white/10 transition-all rounded-xl"><ArrowLeft size={18} /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
              End-of-Day Report
            </h1>
            <p className="text-sm text-gray-400 mt-1">{user.name}</p>
          </div>
        </header>

        {/* Date navigator */}
        <div className="flex items-center justify-center gap-4 py-2">
          <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft size={18} />
          </Button>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-200">{date}</p>
            {isToday && <p className="text-xs text-green-400">Today</p>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeDate(1)}
            disabled={isToday}
          >
            <ChevronRight size={18} />
          </Button>
        </div>

        {/* Template selector */}
        <div className="max-w-md mx-auto">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Report Template</p>
          <TemplateSelector
            userId={user.id}
            selectedTemplate={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
        </div>

        {/* EOD content */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <EODSummaryPanel userId={user.id} date={date} />
            {selectedTemplate && (
              <TemplateReportPanel userId={user.id} date={date} template={selectedTemplate} />
            )}
          </div>
          <div>
            <HistoryList userId={user.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
