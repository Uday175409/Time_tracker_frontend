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

    const handleLogin = async () => {
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
        <Card className="max-w-md mx-auto mt-20">
            <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <input
                    className="w-full p-2 border rounded bg-background"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading) {
                            void handleLogin();
                        }
                    }}
                />
                <input
                    className="w-full p-2 border rounded bg-background"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading) {
                            void handleLogin();
                        }
                    }}
                />
                <Button onClick={handleLogin} className="w-full" disabled={loading || !name.trim() || !password.trim()}>
                    {loading ? 'Signing in...' : 'Login'}
                </Button>
            </CardContent>
        </Card>
    );
}
