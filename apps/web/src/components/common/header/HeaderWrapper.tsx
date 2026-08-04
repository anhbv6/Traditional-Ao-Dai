import type { ReactNode } from 'react';

type HeaderWrapperProps = {
  children: ReactNode;
  sticky?: boolean;
};

export function HeaderWrapper({ children, sticky = false }: HeaderWrapperProps) {
  return (
    <div
      className={[
        'w-full bg-background',
        sticky ? 'sticky top-0 z-50' : '',
      ].join(' ')}
    >
      {children}
    </div>
  );
}
