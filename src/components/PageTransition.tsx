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
      setDisplayChildren(children);
    }
  }, [location.pathname, children]);

  useEffect(() => {
    if (stage === 'fading-out') {
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        window.scrollTo(0, 0);
        setStage('fading-in');
      }, 150);
      return () => clearTimeout(timeout);
    }
    if (stage === 'fading-in') {
      const timeout = setTimeout(() => setStage('visible'), 250);
      return () => clearTimeout(timeout);
    }
  }, [stage, children]);

  const style: React.CSSProperties =
    stage === 'fading-out'
      ? {
          opacity: 0,
          transform: 'scale(0.985) translateY(8px)',
          transition: 'opacity 150ms cubic-bezier(.4,0,.6,1), transform 150ms cubic-bezier(.4,0,.6,1)',
          willChange: 'opacity, transform',
        }
      : stage === 'fading-in'
        ? {
            opacity: 1,
            transform: 'scale(1) translateY(0)',
            transition: 'opacity 250ms cubic-bezier(0,0,.2,1), transform 250ms cubic-bezier(0,0,.2,1)',
            willChange: 'opacity, transform',
          }
        : {
            opacity: 1,
            transform: 'none',
          };

  return <div style={style}>{displayChildren}</div>;
}
