import { useState, useEffect, useRef } from 'react';

export function useIdle(timeoutSeconds: number = 300) {
    const [isIdle, setIsIdle] = useState(false);
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const resetTimeout = () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
            timeoutIdRef.current = setTimeout(() => {
                setIsIdle(true);
            }, timeoutSeconds * 1000);
        };

        const handleActivity = () => {
            setIsIdle((prev) => {
                if (prev) return false;
                return prev;
            });
            resetTimeout();
        };

        // Events to track. Removed mousemove and scroll to avoid extreme performance degradation.
        const events = ['mousedown', 'keydown', 'touchstart', 'click'];

        events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

        // Initial start
        resetTimeout();

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, [timeoutSeconds]);

    return isIdle;
}
