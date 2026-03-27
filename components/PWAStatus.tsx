'use client';

import { usePWA } from '@/hooks/usePWA';
import { WifiOff, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PWAStatus() {
  const { isOnline, canInstall, promptInstall } = usePWA();

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-50 bg-yellow-600 text-black text-center text-xs py-1.5 flex items-center justify-center gap-2">
          <WifiOff size={14} />
          You&apos;re offline — changes will sync when you reconnect
        </div>
      )}

      {/* Install button (floating, bottom-right) */}
      {canInstall && (
        <Button
          onClick={promptInstall}
          className="fixed bottom-4 right-4 z-40 gap-2 shadow-lg bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Download size={14} />
          Install App
        </Button>
      )}
    </>
  );
}
