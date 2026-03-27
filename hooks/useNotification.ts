'use client';

import { useEffect, useState, useCallback } from 'react';

type NotificationPermission = 'default' | 'granted' | 'denied';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied' as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!('Notification' in window)) return;

      // Auto-request permission if not yet granted
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          setPermission(perm);
          if (perm === 'granted') {
            new Notification(title, {
              icon: '/icons/icon-192.svg',
              badge: '/icons/icon-192.svg',
              ...options,
            });
          }
        });
        return;
      }

      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
          ...options,
        });

        // Auto-close after 8 seconds
        setTimeout(() => notification.close(), 8000);
        return notification;
      }
    },
    []
  );

  const notifyPomodoroComplete = useCallback(
    (category: string, breakMinutes: number) => {
      sendNotification('🎯 Pomodoro Complete!', {
        body: `Great work on ${category}! Take a ${breakMinutes} min break.`,
        tag: 'pomodoro-complete',
        requireInteraction: true,
      });
    },
    [sendNotification]
  );

  const notifyBreakOver = useCallback(
    (category?: string) => {
      sendNotification('⏰ Break Over!', {
        body: category
          ? `Time to get back to ${category}!`
          : 'Break is over — ready to focus again?',
        tag: 'break-over',
        requireInteraction: true,
      });
    },
    [sendNotification]
  );

  const notifyBreakStarted = useCallback(
    (minutes: number) => {
      sendNotification('☕ Break Time!', {
        body: `Enjoy your ${minutes} minute break. You've earned it!`,
        tag: 'break-started',
      });
    },
    [sendNotification]
  );

  const notifyWorkStarted = useCallback(
    (category: string, minutes: number) => {
      sendNotification('🔥 Focus Time!', {
        body: `${minutes} min session on ${category}. Let's go!`,
        tag: 'work-started',
      });
    },
    [sendNotification]
  );

  return {
    permission,
    requestPermission,
    sendNotification,
    notifyPomodoroComplete,
    notifyBreakOver,
    notifyBreakStarted,
    notifyWorkStarted,
  };
}
