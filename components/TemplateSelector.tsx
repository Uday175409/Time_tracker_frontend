'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  ReportTemplate,
  TemplateSection,
} from '@/hooks/useTemplates';
import {
  FileText,
  Plus,
  Trash2,
  X,
  ChevronDown,
  Layout,
  CalendarDays,
  Briefcase,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

const typeIcons: Record<string, React.ReactNode> = {
  daily_standup: <CalendarDays size={14} className="text-blue-400" />,
  weekly_summary: <Layout size={14} className="text-green-400" />,
  project_status: <Briefcase size={14} className="text-purple-400" />,
  custom: <Wand2 size={14} className="text-orange-400" />,
};

const typeLabels: Record<string, string> = {
  daily_standup: 'Daily Standup',
  weekly_summary: 'Weekly Summary',
  project_status: 'Project Status',
  custom: 'Custom',
};

interface TemplateSelectorProps {
  userId: string;
  selectedTemplate: ReportTemplate | null;
  onSelect: (template: ReportTemplate) => void;
}

export function TemplateSelector({ userId, selectedTemplate, onSelect }: TemplateSelectorProps) {
  const { data: templates, isLoading } = useTemplates(userId);
  const createMut = useCreateTemplate();
  const deleteMut = useDeleteTemplate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Create template form state
  const [newName, setNewName] = useState('');
  const [newSections, setNewSections] = useState<TemplateSection[]>([
    { key: 'summary', label: 'Summary', type: 'text', placeholder: 'Summarize...', order: 0 },
  ]);

  const handleCreate = () => {
    if (!newName.trim() || newSections.length === 0) return;
    createMut.mutate(
      { userId, name: newName.trim(), sections: newSections },
      {
        onSuccess: () => {
          setNewName('');
          setNewSections([{ key: 'summary', label: 'Summary', type: 'text', placeholder: '', order: 0 }]);
          setShowCreateForm(false);
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  const addSection = () => {
    const order = newSections.length;
    setNewSections([
      ...newSections,
      { key: `section_${order}`, label: '', type: 'text', placeholder: '', order },
    ]);
  };

  const updateSection = (index: number, field: keyof TemplateSection, value: string | number) => {
    const updated = [...newSections];
    (updated[index] as any)[field] = value;
    if (field === 'label') {
      updated[index].key = (value as string).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    setNewSections(updated);
  };

  const removeSection = (index: number) => {
    setNewSections(newSections.filter((_, i) => i !== index));
  };

  const handleDelete = (templateId: string) => {
    if (!confirm('Delete this template?')) return;
    deleteMut.mutate(
      { templateId, userId },
      {
        onError: (err) => alert(getErrorMessage(err, 'Failed to delete template')),
      }
    );
  };

  if (isLoading) return <div className="text-xs text-gray-500">Loading templates...</div>;

  return (
    <div className="space-y-3">
      {/* Template dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 hover:border-gray-600 transition-colors"
        >
          <span className="flex items-center gap-2">
            {selectedTemplate ? (
              <>
                {typeIcons[selectedTemplate.type]}
                {selectedTemplate.name}
              </>
            ) : (
              <>
                <FileText size={14} className="text-gray-500" />
                Select a template...
              </>
            )}
          </span>
          <ChevronDown size={14} className={cn('transition-transform text-gray-500', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            {templates?.map((t) => (
              <button
                key={t._id}
                onClick={() => { onSelect(t); setIsOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-700 transition-colors',
                  selectedTemplate?._id === t._id ? 'bg-gray-700/50 text-white' : 'text-gray-300'
                )}
              >
                <span className="flex items-center gap-2">
                  {typeIcons[t.type]}
                  {t.name}
                  {t.isDefault && (
                    <span className="text-[9px] bg-blue-900/30 text-blue-400 rounded px-1 py-0.5">built-in</span>
                  )}
                </span>
                {!t.isDefault && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }}
                    className="text-gray-500 hover:text-red-400 p-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </button>
            ))}
            <button
              onClick={() => { setShowCreateForm(true); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200 border-t border-gray-700"
            >
              <Plus size={14} /> Create Custom Template
            </button>
          </div>
        )}
      </div>

      {/* Create template form */}
      {showCreateForm && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wand2 size={14} className="text-orange-400" />
              Create Custom Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Template name (e.g., Sprint Review)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />

            <div className="space-y-2">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Sections</p>
              {newSections.map((section, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-gray-900/50 rounded p-2 border border-gray-700/50">
                  <div className="flex-1 space-y-1.5">
                    <input
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder:text-gray-500"
                      placeholder="Section label"
                      value={section.label}
                      onChange={(e) => updateSection(idx, 'label', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <select
                        value={section.type}
                        onChange={(e) => updateSection(idx, 'type', e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300"
                      >
                        <option value="text">Text</option>
                        <option value="list">List</option>
                        <option value="metrics">Auto Metrics</option>
                        <option value="category_breakdown">Category Breakdown</option>
                      </select>
                      <input
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder:text-gray-500"
                        placeholder="Placeholder text"
                        value={section.placeholder || ''}
                        onChange={(e) => updateSection(idx, 'placeholder', e.target.value)}
                      />
                    </div>
                  </div>
                  {newSections.length > 1 && (
                    <button onClick={() => removeSection(idx)} className="text-gray-500 hover:text-red-400 mt-1">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addSection} className="text-xs text-gray-400 gap-1">
                <Plus size={12} /> Add Section
              </Button>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newName.trim() || newSections.length === 0 || createMut.isPending}
                className="text-xs"
              >
                {createMut.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
