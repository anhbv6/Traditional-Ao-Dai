import React from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';

export interface LoadingOverlayProps {
  visible: boolean;
  messageKey?: string;
  messageNamespace?: string;
  message?: string;
  backdropClass?: string;
}

export function LoadingOverlay({
  visible,
  messageKey,
  messageNamespace = 'Auth',
  message,
  backdropClass,
}: LoadingOverlayProps) {
  const t = useTranslations(messageNamespace);

  if (!visible) return null;

  const displayMessage = message || (messageKey ? t(messageKey) : undefined);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[3px] ${backdropClass || ''}`}>
      <div className="flex flex-col items-center justify-center gap-3 select-none">
        <Spinner className="size-9 text-white" />
        {displayMessage && (
          <p className="text-xs font-bold uppercase tracking-widest text-white/90 animate-pulse">
            {displayMessage}
          </p>
        )}
      </div>
    </div>
  );
}
