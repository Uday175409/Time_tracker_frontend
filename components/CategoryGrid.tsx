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
    'Design', 'Learning', 'Other',
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
        <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/5 mb-4">
                <CardTitle className="text-gray-200 font-semibold tracking-wide">Start Tracking</CardTitle>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditMode(!editMode)}
                        className={cn("text-xs font-medium bg-white/5 hover:bg-white/10 rounded-lg transition-colors", editMode && "text-red-400 bg-red-500/10 hover:bg-red-500/20")}
                    >
                        {editMode ? 'Done' : 'Edit Categories'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowAdd(!showAdd)}
                        className="bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Plus size={16} className="text-gray-300" />
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
                                'text-xs px-3 py-1 rounded-full border transition-all font-medium',
                                filterTag === null
                                    ? 'border-blue-500/50 text-blue-400 bg-blue-500/20 shadow-md shadow-blue-500/10'
                                    : 'border-white/10 text-gray-400 bg-white/5 hover:bg-white/10 hover:text-gray-200'
                            )}
                        >
                            All Tasks
                        </button>
                        {Array.from(new Set(categories.map(c => c.tag).filter(Boolean))).map(tag => (
                            <button
                                key={tag}
                                onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                                className={cn(
                                    'text-xs px-3 py-1 rounded-full border transition-all font-medium',
                                    filterTag === tag
                                        ? 'border-blue-500/50 text-blue-400 bg-blue-500/20 shadow-md shadow-blue-500/10'
                                        : 'border-white/10 text-gray-400 bg-white/5 hover:bg-white/10 hover:text-gray-200'
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
                        <div key={cat._id} className="relative group perspective-1000">
                            <Button
                                variant="outline"
                                className={cn(
                                    "h-28 w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col gap-1.5 border relative overflow-hidden",
                                    activeCategory === cat.name
                                        ? "bg-blue-500/20 border-blue-400/50 shadow-blue-500/20"
                                        : "bg-white/5 border-white/5 shadow-black/50 hover:bg-white/10 hover:border-white/20"
                                )}
                                onClick={() => !editMode && onStart(cat.name)}
                                disabled={isLoading}
                            >
                                {/* Subtle animated shine effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                
                                <div className={cn("w-3 h-3 rounded-full shadow-sm", colorDots[cat.color] || colorDots.blue)}></div>
                                <span className={cn("text-base font-bold tracking-tight", activeCategory === cat.name ? "text-blue-100" : "text-gray-200")}>{cat.name}</span>
                                
                                <div className="flex gap-2 items-center text-[10px] font-medium opacity-60 uppercase tracking-wider">
                                    {cat.tag && <span>{cat.tag}</span>}
                                    {!cat.isProductive && <span className="text-red-300 bg-red-900/40 px-1 rounded">BREAK</span>}
                                </div>
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
