import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { throwApiError } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type TemplateSection = {
  key: string;
  label: string;
  type: 'text' | 'list' | 'metrics' | 'category_breakdown';
  placeholder?: string;
  order: number;
};

export type ReportTemplate = {
  _id: string;
  userId: string;
  name: string;
  type: 'daily_standup' | 'weekly_summary' | 'project_status' | 'custom';
  isDefault: boolean;
  sections: TemplateSection[];
  createdAt: string;
  updatedAt: string;
};

async function fetchTemplates(userId: string): Promise<ReportTemplate[]> {
  const res = await fetch(`${API_URL}/api/templates?userId=${userId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch templates');
  const json = await res.json();
  return json.templates;
}

async function fetchTemplate(templateId: string, userId: string): Promise<ReportTemplate> {
  const res = await fetch(`${API_URL}/api/templates/${templateId}?userId=${userId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch template');
  const json = await res.json();
  return json.template;
}

async function createTemplate(data: {
  userId: string;
  name: string;
  sections: TemplateSection[];
}) {
  const res = await fetch(`${API_URL}/api/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create template');
  return res.json();
}

async function updateTemplate(data: {
  templateId: string;
  userId: string;
  name?: string;
  sections?: TemplateSection[];
}) {
  const { templateId, ...body } = data;
  const res = await fetch(`${API_URL}/api/templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update template');
  return res.json();
}

async function deleteTemplate(templateId: string, userId: string) {
  const res = await fetch(`${API_URL}/api/templates/${templateId}?userId=${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete template');
  return res.json();
}

export function useTemplates(userId: string | undefined) {
  return useQuery({
    queryKey: ['templates', userId],
    queryFn: () => fetchTemplates(userId!),
    enabled: !!userId,
  });
}

export function useTemplate(templateId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['template', templateId, userId],
    queryFn: () => fetchTemplate(templateId!, userId!),
    enabled: !!templateId && !!userId,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['templates', variables.userId] });
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['templates', variables.userId] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, userId }: { templateId: string; userId: string }) =>
      deleteTemplate(templateId, userId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['templates', variables.userId] });
    },
  });
}
