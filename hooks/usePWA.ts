'use client';

import { useEffect, useState } from 'react';

/**
 * Registers the service worker and listens for online/offline events.
 * Replays any queued mutations when the browser comes back online.
 */
export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service worker registered', reg.scope);
          // Purge any stale sync entries on load
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage('PURGE_STALE');
          }
        })
        .catch((err) => {
          console.warn('[PWA] SW registration failed:', err);
        });
    }

    // Online/offline tracking
    const goOnline = () => {
      setIsOnline(true);
      // Replay queued mutations
      navigator.serviceWorker?.controller?.postMessage('REPLAY_SYNC');
    };
    const goOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Install prompt capture
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
    return result.outcome === 'accepted';
  };

  return { isOnline, isInstalled, canInstall: !!installPrompt, promptInstall };
}

// ─── Type for the install prompt event ──────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
