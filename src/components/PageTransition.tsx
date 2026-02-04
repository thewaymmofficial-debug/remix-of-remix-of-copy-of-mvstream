import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage('exit');
    }
  }, [children, displayChildren]);

  useEffect(() => {
    if (transitionStage === 'exit') {
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('enter');
      }, 150); // Match exit animation duration

      return () => clearTimeout(timeout);
    }
  }, [transitionStage, children]);

  return (
    <div
      className={cn(
        'transition-all duration-150 ease-out',
        transitionStage === 'enter' && 'animate-fade-in opacity-100',
        transitionStage === 'exit' && 'opacity-0'
      )}
      key={location.pathname}
    >
      {displayChildren}
    </div>
  );
}
