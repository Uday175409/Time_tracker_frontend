'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCategories, useAddCategory, useDeleteCategory, Category } from '@/hooks/useCategories';
import { Plus, X, Trash2, Tag } from 'lucide-react';

const AVAILABLE_TAGS = [
    'Development', 'Meetings', 'Bug Fixes', 'Code Review',
    'Research', 'Documentation', 'Testing', 'DevOps',
    'Design', 'Learning', 'Break', 'Other',
];

// Map color keys to Tailwind classes for category buttons
const colorMap: Record<string, string> = {
    blue: 'hover:bg-blue-600 hover:text-white border-blue-600 text-blue-500',
    green: 'hover:bg-green-600 hover:text-white border-green-600 text-green-500',
    purple: 'hover:bg-purple-600 hover:text-white border-purple-600 text-purple-500',
    orange: 'hover:bg-orange-600 hover:text-white border-orange-600 text-orange-500',
    red: 'hover:bg-red-600 hover:text-white border-red-600 text-red-500',
    gray: 'hover:bg-gray-600 hover:text-white border-gray-600 text-gray-500',
    pink: 'hover:bg-pink-600 hover:text-white border-pink-600 text-pink-500',
    teal: 'hover:bg-teal-600 hover:text-white border-teal-600 text-teal-500',
    cyan: 'hover:bg-cyan-600 hover:text-white border-cyan-600 text-cyan-500',
    yellow: 'hover:bg-yellow-600 hover:text-white border-yellow-600 text-yellow-500',
    indigo: 'hover:bg-indigo-600 hover:text-white border-indigo-600 text-indigo-500',
    emerald: 'hover:bg-emerald-600 hover:text-white border-emerald-600 text-emerald-500',
};

const colorDots: Record<string, string> = {
    blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
    orange: 'bg-orange-500', red: 'bg-red-500', gray: 'bg-gray-500',
    pink: 'bg-pink-500', teal: 'bg-teal-500', cyan: 'bg-cyan-500',
    yellow: 'bg-yellow-500', indigo: 'bg-indigo-500', emerald: 'bg-emerald-500',
};

const AVAILABLE_COLORS = Object.keys(colorMap);

interface CategoryGridProps {
    userId: string;
    onStart: (category: string) => void;
    activeCategory?: string;
    isLoading?: boolean;
}

export function CategoryGrid({ userId, onStart, activeCategory, isLoading }: CategoryGridProps) {
    const { data: categories, isLoading: catsLoading } = useCategories(userId);
    const addMutation = useAddCategory();
    const deleteMutation = useDeleteCategory();

    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('blue');
    const [newTag, setNewTag] = useState('Development');
    const [newProductive, setNewProductive] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [filterTag, setFilterTag] = useState<string | null>(null);

    const handleAdd = () => {
        if (!newName.trim()) return;
        addMutation.mutate(
            { userId, name: newName.trim(), color: newColor, tag: newTag, isProductive: newProductive },
            {
                onSuccess: () => { setNewName(''); setShowAdd(false); },
                onError: (err) => alert(err.message),
            }
        );
    };

    const handleDelete = (cat: Category) => {
        if (!confirm(`Delete "${cat.name}"? Existing time entries won't be affected.`)) return;
        deleteMutation.mutate({ categoryId: cat._id, userId });
    };

    if (catsLoading) {
        return (
            <Card>
                <CardContent className="p-6 text-gray-500 text-sm">Loading categories...</CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Start Tracking</CardTitle>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditMode(!editMode)}
                        className={cn("text-xs", editMode && "text-red-400")}
                    >
                        {editMode ? 'Done' : 'Edit'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdd(!showAdd)}
                    >
                        <Plus size={14} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Add category form */}
                {showAdd && (
                    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3">
                        <input
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Category name (e.g. React, Meetings)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                            autoFocus
                        />
                        {/* Color picker */}
                        <div className="flex flex-wrap gap-1.5">
                            {AVAILABLE_COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setNewColor(c)}
                                    className={cn(
                                        'w-6 h-6 rounded-full transition-all',
                                        colorDots[c],
                                        newColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' : 'opacity-60 hover:opacity-100'
                                    )}
                                />
                            ))}
                        </div>
                        {/* Productive toggle */}
                        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newProductive}
                                onChange={(e) => setNewProductive(e.target.checked)}
                                className="rounded"
                            />
                            Counts as productive
                        </label>
                        {/* Tag selector */}
                        <div>
                            <label className="text-[11px] text-gray-500 block mb-1">
                                <Tag size={10} className="inline mr-1" />Category Tag
                            </label>
                            <select
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {AVAILABLE_TAGS.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || addMutation.isPending}>
                                {addMutation.isPending ? 'Adding...' : 'Add Category'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tag filter bar */}
                {categories && categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        <button
                            onClick={() => setFilterTag(null)}
                            className={cn(
                                'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                                filterTag === null
                                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                                    : 'border-gray-700 text-gray-500 hover:border-gray-600'
                            )}
                        >
                            All
                        </button>
                        {Array.from(new Set(categories.map(c => c.tag).filter(Boolean))).map(tag => (
                            <button
                                key={tag}
                                onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                                className={cn(
                                    'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                                    filterTag === tag
                                        ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                                        : 'border-gray-700 text-gray-500 hover:border-gray-600'
                                )}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                {/* Category grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {categories?.filter(cat => !filterTag || cat.tag === filterTag).map((cat) => (
                        <div key={cat._id} className="relative group">
                            <Button
                                variant={activeCategory === cat.name ? 'default' : 'outline'}
                                className={cn(
                                    "h-24 w-full text-lg font-semibold transition-all hover:scale-105 flex flex-col gap-0.5",
                                    activeCategory === cat.name
                                        ? "ring-2 ring-primary ring-offset-2"
                                        : colorMap[cat.color] || colorMap.blue
                                )}
                                onClick={() => !editMode && onStart(cat.name)}
                                disabled={isLoading}
                            >
                                {cat.name}
                                {cat.tag && (
                                    <span className="block text-[9px] font-normal opacity-50">{cat.tag}</span>
                                )}
                                {!cat.isProductive && (
                                    <span className="block text-[10px] font-normal opacity-60">break</span>
                                )}
                            </Button>
                            {/* Delete button — visible in edit mode */}
                            {editMode && (
                                <button
                                    onClick={() => handleDelete(cat)}
                                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 shadow-lg transition-transform hover:scale-110"
                                    disabled={deleteMutation.isPending}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
