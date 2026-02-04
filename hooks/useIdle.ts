import { useState, useEffect } from 'react';

export function useIdle(timeoutSeconds: number = 300) {
    const [isIdle, setIsIdle] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleActivity = () => {
            setIsIdle(false);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => setIsIdle(true), timeoutSeconds * 1000);
        };

        // Events to track
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        events.forEach(event => window.addEventListener(event, handleActivity));

        // Initial start
        timeoutId = setTimeout(() => setIsIdle(true), timeoutSeconds * 1000);

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            clearTimeout(timeoutId);
        };
    }, [timeoutSeconds]);

    return isIdle;
}
