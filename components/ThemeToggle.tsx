import React, { useRef, useEffect, useState } from 'react';

interface ThemeToggleProps {
  isCoffeeMode: boolean;
  coffeeCount: number;
  bubbleTeaCount: number;
  onToggle?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'small' | 'large';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isCoffeeMode,
  coffeeCount,
  bubbleTeaCount,
  onToggle,
  disabled = false,
  className = '',
  size = 'large',
}) => {
  const coffeeRef = useRef<HTMLSpanElement>(null);
  const bubbleTeaRef = useRef<HTMLSpanElement>(null);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [sliderLeft, setSliderLeft] = useState(0);

  useEffect(() => {
    if (coffeeRef.current && bubbleTeaRef.current) {
      const coffeeWidth = coffeeRef.current.offsetWidth;
      const bubbleTeaWidth = bubbleTeaRef.current.offsetWidth;

      // Position slider based on active mode
      if (isCoffeeMode) {
        setSliderWidth(coffeeWidth + 24);
        setSliderLeft(4); // Start closer to the left edge
      } else {
        setSliderWidth(bubbleTeaWidth + 24);
        // Calculate position for bubble tea text
        const toggleWidth = size === 'small' ? 192 : 224; // w-48 = 192px, w-56 = 224px
        const bubbleTeaLeft = toggleWidth - 30 - bubbleTeaWidth; // Adjust for better alignment
        setSliderLeft(bubbleTeaLeft);
      }
    }
  }, [isCoffeeMode, size]);

  return (
    <div className={`flex items-center justify-center space-x-6 ${className}`}>
      {/* Coffee Count */}
      <div className="text-center">
        <div className={`${size === 'small' ? 'text-xs' : 'text-sm'} mb-1 ${isCoffeeMode ? 'text-coffee-primary' : 'text-gray-500'}`}>{coffeeCount}</div>
        <span className={`${size === 'small' ? 'text-lg' : 'text-2xl'} ${isCoffeeMode ? 'text-coffee-secondary' : 'text-gray-600'}`}>☕</span>
      </div>

      {/* Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={isCoffeeMode}
        tabIndex={disabled ? -1 : 0}
        disabled={disabled}
        onClick={disabled ? undefined : onToggle}
        className={`relative ${size === 'small' ? 'w-48 h-12' : 'w-56 h-14'} rounded-full border transition-all duration-300 flex items-center justify-between px-0 overflow-hidden backdrop-blur-lg select-none
          ${isCoffeeMode ? 'bg-coffee-headerBg/50 border-coffee-primary/30 shadow-lg shadow-coffee-primary/20' : 'bg-bubbleTea-headerBg/50 border-bubbleTea-primary/30 shadow-lg shadow-bubbleTea-primary/20'}
          ${disabled ? 'pointer-events-none opacity-60 grayscale' : ''}
        `}
      >
        {/* Water glass effect */}
        <div className={`absolute inset-0 opacity-60 ${isCoffeeMode ? 'bg-gradient-to-br from-white/50 via-transparent to-coffee-primary/25' : 'bg-gradient-to-br from-white/50 via-transparent to-bubbleTea-primary/25'}`}></div>
        <div className={`absolute inset-0 opacity-40 ${isCoffeeMode ? 'bg-gradient-to-tl from-coffee-primary/15 via-transparent to-white/30' : 'bg-gradient-to-tl from-bubbleTea-primary/15 via-transparent to-white/30'}`}></div>
        <div className={`absolute inset-0 opacity-25 ${isCoffeeMode ? 'bg-gradient-to-b from-coffee-primary/20 via-transparent to-transparent' : 'bg-gradient-to-b from-bubbleTea-primary/20 via-transparent to-transparent'}`}></div>
        <div className={`absolute inset-0 opacity-20 ${isCoffeeMode ? 'bg-gradient-to-r from-coffee-primary/10 via-transparent to-coffee-primary/5' : 'bg-gradient-to-r from-bubbleTea-primary/10 via-transparent to-bubbleTea-primary/5'}`}></div>

        {/* Slider */}
        <span
          aria-hidden
          className={`absolute top-0.55 ${size === 'small' ? 'h-10' : 'h-12'} rounded-full bg-white shadow-lg transition-all duration-500 ease-in-out z-10`}
          style={{
            transitionProperty: 'transform, background, box-shadow, width, left',
            width: `${sliderWidth}px`,
            left: `${sliderLeft}px`
          }}
        />

        {/* Labels */}
        <div className="relative w-full flex z-20 px-4 justify-between">
          <div className="flex items-center">
            <span
              ref={coffeeRef}
              className={`${size === 'small' ? 'text-sm' : 'text-lg'} font-semibold transition-colors duration-300 ${isCoffeeMode ? 'text-coffee-primary' : 'text-gray-400'}`}
            >
              COFFEE
            </span>
          </div>
          <div className="flex items-center">
            <span
              ref={bubbleTeaRef}
              className={`${size === 'small' ? 'text-sm' : 'text-lg'} font-semibold transition-colors duration-300 ${isCoffeeMode ? 'text-gray-400' : 'text-bubbleTea-primary'}`}
            >
              BUBBLE TEA
            </span>
          </div>
        </div>
      </button>

      {/* Bubble Tea Count */}
      <div className="text-center">
        <div className={`${size === 'small' ? 'text-xs' : 'text-sm'} mb-1 ${isCoffeeMode ? 'text-gray-500' : 'text-bubbleTea-primary'}`}>{bubbleTeaCount}</div>
        <span className={`${size === 'small' ? 'text-lg' : 'text-2xl'} ${isCoffeeMode ? 'text-gray-600' : 'text-bubbleTea-secondary'}`}>🧋</span>
      </div>
    </div>
  );
};

export default ThemeToggle;