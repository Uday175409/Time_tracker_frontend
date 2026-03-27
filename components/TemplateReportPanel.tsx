'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReportTemplate, TemplateSection } from '@/hooks/useTemplates';
import { useEOD } from '@/hooks/useEOD';
import { Save, Plus, X, Clock, TrendingUp, Sparkles, Copy, Check } from 'lucide-react';

interface TemplateReportPanelProps {
  userId: string;
  date: string;
  template: ReportTemplate;
}

export function TemplateReportPanel({ userId, date, template }: TemplateReportPanelProps) {
  const { data: eod } = useEOD(userId, date);
  const [sectionData, setSectionData] = useState<Record<string, string | string[]>>({});
  const [copied, setCopied] = useState(false);

  // Initialize section data from template defaults
  useEffect(() => {
    const initial: Record<string, string | string[]> = {};
    template.sections.forEach((section) => {
      if (section.type === 'list') {
        initial[section.key] = [];
      } else if (section.type === 'text') {
        initial[section.key] = '';
      }
      // metrics and category_breakdown are auto-populated
    });
    setSectionData(initial);
  }, [template]);

  const updateText = (key: string, value: string) => {
    setSectionData((prev) => ({ ...prev, [key]: value }));
  };

  const addListItem = (key: string, item: string) => {
    if (!item.trim()) return;
    setSectionData((prev) => ({
      ...prev,
      [key]: [...((prev[key] as string[]) || []), item.trim()],
    }));
  };

  const removeListItem = (key: string, index: number) => {
    setSectionData((prev) => ({
      ...prev,
      [key]: ((prev[key] as string[]) || []).filter((_, i) => i !== index),
    }));
  };

  const generateReport = useCallback(() => {
    let report = `# ${template.name} — ${date}\n\n`;

    template.sections
      .sort((a, b) => a.order - b.order)
      .forEach((section) => {
        report += `## ${section.label}\n`;

        if (section.type === 'text') {
          const value = (sectionData[section.key] as string) || '';
          report += value ? `${value}\n` : '_No content_\n';
        } else if (section.type === 'list') {
          const items = (sectionData[section.key] as string[]) || [];
          if (items.length > 0) {
            items.forEach((item) => { report += `- ${item}\n`; });
          } else {
            report += '_No items_\n';
          }
        } else if (section.type === 'metrics' && eod) {
          report += `- Total Hours: ${eod.totalHours}h\n`;
          report += `- Productive Hours: ${eod.productiveHours}h\n`;
          const pct = eod.totalHours > 0 ? Math.round((eod.productiveHours / eod.totalHours) * 100) : 0;
          report += `- Productivity: ${pct}%\n`;
        } else if (section.type === 'category_breakdown' && eod?.categoryBreakdown) {
          Object.entries(eod.categoryBreakdown).forEach(([cat, seconds]) => {
            report += `- ${cat}: ${(seconds / 3600).toFixed(2)}h\n`;
          });
        }

        report += '\n';
      });

    return report;
  }, [template, date, sectionData, eod]);

  const copyReport = () => {
    const report = generateReport();
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="text-gray-200">{template.name}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={copyReport}
            className="gap-1 text-xs"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy Report'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedSections.map((section) => (
          <SectionRenderer
            key={section.key}
            section={section}
            value={sectionData[section.key]}
            eod={eod}
            onTextChange={(v) => updateText(section.key, v)}
            onAddItem={(item) => addListItem(section.key, item)}
            onRemoveItem={(idx) => removeListItem(section.key, idx)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function SectionRenderer({
  section,
  value,
  eod,
  onTextChange,
  onAddItem,
  onRemoveItem,
}: {
  section: TemplateSection;
  value: string | string[] | undefined;
  eod: any;
  onTextChange: (v: string) => void;
  onAddItem: (item: string) => void;
  onRemoveItem: (idx: number) => void;
}) {
  const [newItem, setNewItem] = useState('');

  if (section.type === 'metrics') {
    if (!eod) return <div className="text-xs text-gray-500">Loading metrics...</div>;
    const pct = eod.totalHours > 0 ? Math.round((eod.productiveHours / eod.totalHours) * 100) : 0;
    return (
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{section.label}</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <Clock size={14} className="mx-auto mb-1 text-blue-400" />
            <p className="text-lg font-bold text-white">{eod.totalHours}h</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <TrendingUp size={14} className="mx-auto mb-1 text-green-400" />
            <p className="text-lg font-bold text-green-400">{eod.productiveHours}h</p>
            <p className="text-[10px] text-gray-500">Productive</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <Sparkles size={14} className="mx-auto mb-1 text-purple-400" />
            <p className="text-lg font-bold text-purple-400">{pct}%</p>
            <p className="text-[10px] text-gray-500">Score</p>
          </div>
        </div>
      </div>
    );
  }

  if (section.type === 'category_breakdown') {
    if (!eod?.categoryBreakdown) return <div className="text-xs text-gray-500">Loading...</div>;
    return (
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{section.label}</p>
        <div className="space-y-1.5">
          {Object.entries(eod.categoryBreakdown).map(([cat, seconds]: [string, any]) => (
            <div key={cat} className="flex justify-between text-sm px-2 py-1 rounded hover:bg-gray-800/50">
              <span className="text-gray-300">{cat}</span>
              <span className="font-mono text-gray-400">{(seconds / 3600).toFixed(2)}h</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'list') {
    const items = (value as string[]) || [];
    return (
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{section.label}</p>
        <div className="space-y-1 mb-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-gray-800/40 border border-gray-700/50 rounded px-2 py-1 text-sm text-gray-300"
            >
              <span className="flex-1">{item}</span>
              <button onClick={() => onRemoveItem(idx)} className="text-gray-600 hover:text-red-400">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={section.placeholder || `Add ${section.label.toLowerCase()}...`}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onAddItem(newItem);
                setNewItem('');
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { onAddItem(newItem); setNewItem(''); }}
            disabled={!newItem.trim()}
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>
    );
  }

  // text
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{section.label}</p>
      <textarea
        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2.5 text-sm text-gray-200 resize-none placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder={section.placeholder || `Enter ${section.label.toLowerCase()}...`}
        rows={3}
        value={(value as string) || ''}
        onChange={(e) => onTextChange(e.target.value)}
      />
    </div>
  );
}
