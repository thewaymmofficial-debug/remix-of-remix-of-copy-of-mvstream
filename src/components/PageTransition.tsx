import { ReactNode, useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [stage, setStage] = useState<'visible' | 'fading-out' | 'fading-in'>('visible');
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      setStage('fading-out');
    } else {
      // Same path, just update children directly
      setDisplayChildren(children);
    }
  }, [location.pathname, children]);

  useEffect(() => {
    if (stage === 'fading-out') {
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        window.scrollTo(0, 0);
        setStage('fading-in');
      }, 120);
      return () => clearTimeout(timeout);
    }
    if (stage === 'fading-in') {
      const timeout = setTimeout(() => setStage('visible'), 200);
      return () => clearTimeout(timeout);
    }
  }, [stage, children]);

  return (
    <div
      style={{
        opacity: stage === 'fading-out' ? 0 : 1,
        transform: stage === 'fading-out' ? 'translateY(6px)' : stage === 'fading-in' ? 'translateY(0)' : undefined,
        transition: stage === 'fading-out'
          ? 'opacity 120ms ease-out, transform 120ms ease-out'
          : 'opacity 200ms ease-out, transform 200ms ease-out',
      }}
    >
      {displayChildren}
    </div>
  );
}
