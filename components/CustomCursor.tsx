'use client';

import { useState, useEffect, useRef, createContext, useContext } from 'react';

type HoverState = 'toggle' | 'card' | 'clickable' | 'help' | false;

const HoverContext = createContext<{
  hoverState: HoverState;
  setHoverState: (state: HoverState) => void;
}>({
  hoverState: false,
  setHoverState: () => {},
});

export const useHover = () => useContext(HoverContext);

export function HoverProvider({ children }: { children: React.ReactNode }) {
  const [hoverState, setHoverState] = useState<HoverState>(false);
  return (
    <HoverContext.Provider value={{ hoverState, setHoverState }}>
      {children}
    </HoverContext.Provider>
  );
}

export default function CustomCursor() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [sparkles, setSparkles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    opacity: number;
    symbol: string;
  }>>([]);
  const [isMobile, setIsMobile] = useState(false);
  const sparkleId = useRef(0);
  const lastMouseMove = useRef(0);
  const { hoverState } = useHover();

  const handleGlobalMouseMove = (e: MouseEvent) => {
    const now = Date.now();
    if (now - lastMouseMove.current < 16) return;
    lastMouseMove.current = now;

    if (!hoverState || hoverState === 'card' || hoverState === 'help') {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    }

    if (window.innerWidth > 768 && Math.random() < 0.25) {
      const symbols = ['⋆', '.', '˚', '•'];
      const newSparkle = {
        id: sparkleId.current++,
        x: e.clientX + (Math.random() - 0.5) * 30,
        y: e.clientY + (Math.random() - 0.5) * 30,
        opacity: 0.8,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
      };

      setSparkles((prev) => {
        const updated = [...prev, newSparkle];
        return updated.slice(-30);
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles((prev) =>
        prev
          .map((sparkle) => ({
            ...sparkle,
            opacity: Math.max(0, sparkle.opacity - 0.15),
          }))
          .filter((sparkle) => sparkle.opacity > 0)
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
    }
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="fixed pointer-events-none z-[9998] text-xs"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            opacity: sparkle.opacity,
            transform: 'translate(-50%, -50%)',
            color: 'white',
          }}
        >
          {sparkle.symbol}
        </div>
      ))}

      <div
        className={`custom-cursor ${hoverState === 'card' ? 'hover' : ''} ${hoverState === 'toggle' ? 'hidden' : ''} ${hoverState === 'clickable' ? 'clickable' : ''} ${hoverState === 'help' ? 'help' : ''}`}
        style={{
          left: cursorPosition.x - 10,
          top: cursorPosition.y - 10,
          '--primary-color': 'white',
          zIndex: 10000,
        } as React.CSSProperties}
      >
        {hoverState === 'help' ? '?' : hoverState === 'clickable' ? '⊹' : '𖧋'}
      </div>
    </>
  );
}
