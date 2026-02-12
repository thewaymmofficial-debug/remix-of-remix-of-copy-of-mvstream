import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
}

export function FadeIn({ children, className = '' }: FadeInProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}
