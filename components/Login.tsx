'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LoginProps {
    onLogin: (user: { id: string; name: string }) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function Login({ onLogin }: LoginProps) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!name.trim() || !password.trim()) {
            alert('Please enter both name and password');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), password }),
            });
            const data = await res.json();
            if (data.success) {
                onLogin(data.user);
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (e) {
            alert('Login error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="absolute w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-3xl -top-20 -left-20 animate-blob mix-blend-screen opacity-70"></div>
            <div className="absolute w-[400px] h-[400px] bg-purple-600/30 rounded-full blur-3xl top-40 right-10 animate-blob animation-delay-2000 mix-blend-screen opacity-70"></div>
            <div className="absolute w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl -bottom-40 left-20 animate-blob animation-delay-4000 mix-blend-screen opacity-70"></div>

            <Card className="w-full max-w-md mx-4 relative z-10 backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl animate-fade-in-up">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Flow State
                    </CardTitle>
                    <p className="text-sm text-center text-gray-400">Sign in to sync your deep work sessions</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Username</label>
                            <input
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder-gray-500 outline-none"
                                placeholder="e.g. jdoe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Password</label>
                            <input
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder-gray-500 outline-none"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button 
                            type="submit" 
                            className="w-full py-6 text-md font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]" 
                            disabled={loading || !name.trim() || !password.trim()}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                    Authenticating...
                                </div>
                            ) : 'Enter Flow'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
