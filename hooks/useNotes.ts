import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiUrl, throwApiError } from '@/lib/api';

const API_URL = getApiUrl();

// --- Types ---

export type WorkNote = {
  _id: string;
  userId: string;
  linkedType: 'SESSION' | 'DAY';
  referenceId: string;
  content: string;
  versions: { content: string; editedAt: string }[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

// --- Fetch helpers ---

async function fetchNotes(
  userId: string,
  linkedType: 'SESSION' | 'DAY',
  referenceId: string
): Promise<WorkNote[]> {
  const params = new URLSearchParams({ userId, linkedType, referenceId });
  const res = await fetch(`${API_URL}/api/notes?${params}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch notes');
  const json = await res.json();
  return json.notes;
}

async function createNote(data: {
  userId: string;
  linkedType: 'SESSION' | 'DAY';
  referenceId: string;
  content: string;
}) {
  const res = await fetch(`${API_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create note');
  return res.json();
}

async function updateNote(data: { noteId: string; userId: string; content: string }) {
  const res = await fetch(`${API_URL}/api/notes/${data.noteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: data.userId, content: data.content }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update note');
  return res.json();
}

async function deleteNote(noteId: string, userId: string) {
  const res = await fetch(`${API_URL}/api/notes/${noteId}?userId=${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete note');
  return res.json();
}

// --- Hooks ---

/**
 * Fetch notes for a specific context (session or day).
 * Query key encodes all three dimensions so React Query caches correctly.
 */
export function useNotes(
  userId: string | undefined,
  linkedType: 'SESSION' | 'DAY',
  referenceId: string | undefined
) {
  return useQuery({
    queryKey: ['notes', userId, linkedType, referenceId],
    queryFn: () => fetchNotes(userId!, linkedType, referenceId!),
    enabled: !!userId && !!referenceId,
  });
}

/** Create a new note and invalidate the relevant notes cache */
export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNote,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ['notes', variables.userId, variables.linkedType, variables.referenceId],
      });
    },
  });
}

/** Update an existing note's content (previous version is preserved on backend) */
export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateNote,
    onSuccess: () => {
      // Broad invalidation — the note could appear in session or day views
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

/** Soft-delete a note */
export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, userId }: { noteId: string; userId: string }) =>
      deleteNote(noteId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
