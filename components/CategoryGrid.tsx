'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming cn utility exists, if not I'll create it. 
// Actually I'll create lib/utils.ts as well just in case.

const CATEGORIES = ['Python', 'SQL', 'Midas', 'Datasetu', 'Break', 'TT'];

const CategoryColors: Record<string, string> = {
    Python: 'hover:bg-blue-600 hover:text-white border-blue-600 text-blue-500',
    SQL: 'hover:bg-green-600 hover:text-white border-green-600 text-green-500',
    Midas: 'hover:bg-purple-600 hover:text-white border-purple-600 text-purple-500',
    Datasetu: 'hover:bg-orange-600 hover:text-white border-orange-600 text-orange-500',
    Break: 'hover:bg-gray-600 hover:text-white border-gray-600 text-gray-500',
    TT: 'hover:bg-red-600 hover:text-white border-red-600 text-red-500',
}

interface CategoryGridProps {
    onStart: (category: string) => void;
    activeCategory?: string;
    isLoading?: boolean;
}

export function CategoryGrid({ onStart, activeCategory, isLoading }: CategoryGridProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Start Tracking</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {CATEGORIES.map((category) => (
                        <Button
                            key={category}
                            variant={activeCategory === category ? 'default' : 'outline'}
                            className={cn(
                                "h-24 text-lg font-semibold transition-all hover:scale-105",
                                activeCategory === category
                                    ? "ring-2 ring-primary ring-offset-2"
                                    : CategoryColors[category] || ""
                            )}
                            onClick={() => onStart(category)}
                            disabled={isLoading}
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
