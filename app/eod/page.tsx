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

/**
 * Dedicated EOD page. Users can browse daily summaries by date,
 * view auto-computed metrics, and add summary / highlights / blockers.
 * Supports multiple report templates (daily standup, weekly, project status, custom).
 */
export default function EODPage() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  if (!user) return <div className="p-8 text-gray-400">Please login first</div>;

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    // Don't allow going into the future
    if (d > new Date()) return;
    setDate(d.toISOString().split('T')[0]);
  };

  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <main className="min-h-screen p-4 md:p-8 bg-black text-gray-100 dark">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost"><ArrowLeft size={18} /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
              End-of-Day Report
            </h1>
            <p className="text-sm text-gray-500">{user.name}</p>
          </div>
        </header>

        {/* Date navigator */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
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
