import React from 'react';
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
  backdropClass,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm select-none ${backdropClass || ''}`}>
      <Spinner className="size-6 text-white" />
    </div>
  );
}
