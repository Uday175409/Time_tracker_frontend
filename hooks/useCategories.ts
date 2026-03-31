import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { throwApiError } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type Category = {
  _id: string;
  userId: string;
  name: string;
  color: string;
  tag: string;
  isProductive: boolean;
  order: number;
};

async function fetchCategories(userId: string): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories?userId=${userId}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch categories');
  const json = await res.json();
  return json.categories;
}

async function addCategory(data: {
  userId: string;
  name: string;
  color?: string;
  tag?: string;
  isProductive?: boolean;
}) {
  const res = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) await throwApiError(res, 'Failed to add category');
  return res.json();
}

async function deleteCategory(categoryId: string, userId: string) {
  const res = await fetch(`${API_URL}/api/categories/${categoryId}?userId=${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete category');
  return res.json();
}

/** Fetch user's categories (auto-seeds defaults on first call) */
export function useCategories(userId: string | undefined) {
  return useQuery({
    queryKey: ['categories', userId],
    queryFn: () => fetchCategories(userId!),
    enabled: !!userId,
  });
}

/** Add a new category */
export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addCategory,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['categories', variables.userId] });
    },
  });
}

/** Delete a category */
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, userId }: { categoryId: string; userId: string }) =>
      deleteCategory(categoryId, userId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['categories', variables.userId] });
    },
  });
}
