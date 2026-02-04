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

    const handleLogin = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password }),
            });
            const data = await res.json();
            if (data.success) {
                onLogin(data.user);
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (e) {
            alert('Login error');
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
                />
                <input
                    className="w-full p-2 border rounded bg-background"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button onClick={handleLogin} className="w-full">
                    Login
                </Button>
            </CardContent>
        </Card>
    );
}
