'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, WorkNote } from '@/hooks/useNotes';
import { MessageSquarePlus, Save, Pencil, Trash2, Clock } from 'lucide-react';

interface SessionNotesProps {
  userId: string;
  /** The _id of the currently running TimeEntry */
  sessionId: string;
  /** Category name shown as context */
  category: string;
}

/**
 * Contextual notes panel that appears alongside an active timer.
 * Notes are linked to the specific TimeEntry session — never free-floating.
 */
export function SessionNotes({ userId, sessionId, category }: SessionNotesProps) {
  const { data: notes, isLoading } = useNotes(userId, 'SESSION', sessionId);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();

  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleCreate = () => {
    if (!newNote.trim()) return;
    createMutation.mutate(
      { userId, linkedType: 'SESSION', referenceId: sessionId, content: newNote.trim() },
      { onSuccess: () => setNewNote('') }
    );
  };

  const handleUpdate = (noteId: string) => {
    if (!editContent.trim()) return;
    updateMutation.mutate(
      { noteId, userId, content: editContent.trim() },
      { onSuccess: () => { setEditingId(null); setEditContent(''); } }
    );
  };

  const handleDelete = (noteId: string) => {
    deleteMutation.mutate({ noteId, userId });
  };

  const startEditing = (note: WorkNote) => {
    setEditingId(note._id);
    setEditContent(note.content);
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-gray-300">
          <MessageSquarePlus size={16} />
          Session Notes
          <span className="text-xs text-gray-500 font-normal ml-auto">
            linked to {category} session
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* New note input */}
        <div className="flex gap-2">
          <textarea
            className="flex-1 bg-gray-800 border border-gray-700 rounded-md p-2 text-sm text-gray-200 resize-none placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="What's on your mind about this task..."
            rows={2}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCreate();
            }}
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!newNote.trim() || createMutation.isPending}
            className="self-end"
          >
            <Save size={14} />
          </Button>
        </div>

        {/* Existing notes */}
        {isLoading ? (
          <p className="text-xs text-gray-500">Loading notes...</p>
        ) : notes && notes.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note._id}
                className="bg-gray-800/60 rounded p-2 text-sm border border-gray-700/50 group"
              >
                {editingId === note._id ? (
                  <div className="flex gap-2">
                    <textarea
                      className="flex-1 bg-gray-700 rounded p-1.5 text-sm text-gray-200 resize-none focus:outline-none"
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleUpdate(note._id)}>
                        <Save size={12} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        ✕
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(note.updatedAt).toLocaleTimeString()}
                        {note.versions.length > 0 && ` · edited ${note.versions.length}x`}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          className="text-gray-500 hover:text-gray-300"
                          onClick={() => startEditing(note)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="text-gray-500 hover:text-red-400"
                          onClick={() => handleDelete(note._id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-2">
            No notes yet. Capture context while you work.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
