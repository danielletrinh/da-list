'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cafes } from '../data/cafes';
import { Cafe, GroupedCafe } from '../types/cafe';
import { Inter, Overpass, DM_Serif_Display, Archivo } from 'next/font/google';
import CafeImage from '../components/CafeImage';

const inter = Inter({ subsets: ['latin'] });
const overpass = Overpass({ subsets: ['latin'] });
const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400'
});
const archivo = Archivo({
  subsets: ['latin'],
  weight: '700'
});

export default function Home() {
  const [activeRegion, setActiveRegion] = useState<string>('recommended');
  const [isCoffeeMode, setIsCoffeeMode] = useState<boolean>(true);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState<'toggle' | 'card' | 'clickable' | false>(false);
  const [sparkles, setSparkles] = useState<Array<{id: number, x: number, y: number, opacity: number, symbol: string}>>([]);
  const [clickedCards, setClickedCards] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);
  const sparkleId = useRef(0);
  const lastMouseMove = useRef(0);

  // Group cafés by region
  const cafesByRegion = useMemo(() => {
    const grouped = cafes.reduce((acc, cafe) => {
      const region = cafe.region;
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(cafe);
      return acc;
    }, {} as Record<string, Cafe[]>);

    // Sort cafés within each region by name
    Object.keys(grouped).forEach(region => {
      grouped[region].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, []);

  // Get filtered counts by region for current mode
  const getFilteredRegionCount = (region: string) => {
    if (region === 'all') {
      return isCoffeeMode
        ? cafes.filter(cafe => cafe.features.includes('coffee') || cafe.features.includes('vietnamese coffee')).length
        : cafes.filter(cafe => cafe.features.includes('bubble tea')).length;
    }

    if (region === 'recommended') {
      return isCoffeeMode
        ? cafes.filter(cafe => cafe.recommended && (cafe.features.includes('coffee') || cafe.features.includes('vietnamese coffee'))).length
        : cafes.filter(cafe => cafe.recommended && cafe.features.includes('bubble tea')).length;
    }

    const regionCafes = cafesByRegion[region] || [];
    return isCoffeeMode
      ? regionCafes.filter(cafe => cafe.features.includes('coffee') || cafe.features.includes('vietnamese coffee')).length
      : regionCafes.filter(cafe => cafe.features.includes('bubble tea')).length;
  };

  const regions = ['recommended', 'all', ...Object.keys(cafesByRegion).sort()];

  // Filter cafés based on mode and region
  const currentCafes = useMemo(() => {
    let filtered = cafes;

    // Filter by mode (coffee vs bubble tea)
    if (isCoffeeMode) {
      filtered = filtered.filter(cafe => cafe.features.includes('coffee') || cafe.features.includes('vietnamese coffee'));
    } else {
      filtered = filtered.filter(cafe => cafe.features.includes('bubble tea'));
    }

    // Filter by region
    if (activeRegion === 'recommended') {
      filtered = filtered.filter(cafe => cafe.recommended);
    } else if (activeRegion !== 'all') {
      filtered = filtered.filter(cafe => cafe.region === activeRegion);
    }

    return filtered;
  }, [isCoffeeMode, activeRegion]);

  // Group cafés by name for recommended view
  const groupedCafes = useMemo(() => {
    if (activeRegion !== 'recommended') return currentCafes;

    const grouped = currentCafes.reduce((acc, cafe) => {
      if (!acc[cafe.name]) {
        acc[cafe.name] = [];
      }
      acc[cafe.name].push(cafe);
      return acc;
    }, {} as Record<string, Cafe[]>);

    const result = Object.entries(grouped).map(([name, cafes]) => ({
      id: cafes[0].id,
      name,
      locations: cafes.map(c => c.location),
      region: cafes[0].region,
      features: cafes[0].features,
      recommended: cafes[0].recommended,
      image: cafes[0].image
    })) as GroupedCafe[];

    console.log('Grouped cafes:', result);
    return result;
  }, [currentCafes, activeRegion]);

  // Use grouped cafes for recommended view, regular cafes for others
  const displayCafes = activeRegion === 'recommended' ? groupedCafes : currentCafes;

  // Preload images for better performance
  useEffect(() => {
    if (activeRegion === 'recommended') {
      displayCafes.forEach((cafe, index) => {
        if (index < 8 && cafe.image) {
          const img = new window.Image();
          img.src = cafe.image;
        }
      });
    }
  }, [displayCafes, activeRegion]);

  // Count cafés by type
  const coffeeCount = cafes.filter(cafe => cafe.features.includes('coffee') || cafe.features.includes('vietnamese coffee')).length;
  const bubbleTeaCount = cafes.filter(cafe => cafe.features.includes('bubble tea')).length;

  const toggleTheme = () => {
    setIsCoffeeMode(!isCoffeeMode);
  };

  const handleCardClick = (cafeId: string) => {
    setClickedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cafeId)) {
        newSet.delete(cafeId);
      } else {
        newSet.add(cafeId);
      }
      return newSet;
    });
  };

      // Mouse tracking for tooltips with throttling
  const handleMouseMove = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastMouseMove.current < 8) return; // Reduced throttling for smoother tooltips
    lastMouseMove.current = now;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    (e.currentTarget as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
    (e.currentTarget as HTMLElement).style.setProperty('--mouse-y', `${y}px`);

    // Also update global cursor position for smooth tracking
    setCursorPosition({ x: e.clientX, y: e.clientY });
  };

      // Global mouse tracking for custom cursor
  const handleGlobalMouseMove = (e: MouseEvent) => {
    const now = Date.now();
    if (now - lastMouseMove.current < 16) return; // ~60fps throttling
    lastMouseMove.current = now;

    // Only update cursor position if not hovering over interactive elements
    if (!isHovering || isHovering === 'card') {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    }

    // Create sparkle with throttling (disabled on mobile)
    if (window.innerWidth > 768 && Math.random() < 0.15) {
      const symbols = ['⋆', '.', '˚', '•'];
      const newSparkle = {
        id: sparkleId.current++,
        x: e.clientX + (Math.random() - 0.5) * 20,
        y: e.clientY + (Math.random() - 0.5) * 20,
        opacity: 0.8,
        symbol: symbols[Math.floor(Math.random() * symbols.length)]
      };

      setSparkles(prev => {
        const updated = [...prev, newSparkle];
        return updated.slice(-15);
      });
    }
  };

  // Handle mouse enter/leave for cursor scaling
  const handleMouseEnter = () => setIsHovering('card');
  const handleMouseLeave = () => setIsHovering(false);
  const handlePantoneEnter = () => setIsHovering('clickable');
  const handlePantoneLeave = () => setIsHovering(false);

  // Clean up sparkles
  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles(prev => prev.map(sparkle => ({
        ...sparkle,
        opacity: Math.max(0, sparkle.opacity - 0.15) // Faster fade
      })).filter(sparkle => sparkle.opacity > 0));
    }, 100); // Slower interval (was 50ms)

    return () => clearInterval(interval);
  }, []);

  // Add global mouse tracking
  useEffect(() => {
    setIsHydrated(true);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isCoffeeMode ? 'bg-coffee-pageBg' : 'bg-bubbleTea-pageBg'
    }`}>
      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="fixed pointer-events-none z-[9998] text-xs"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            opacity: sparkle.opacity,
            transform: 'translate(-50%, -50%)',
            color: isCoffeeMode ? '#78634a' : '#5a7a4a'
          }}
        >
          {sparkle.symbol}
        </div>
      ))}

      {/* Custom Cursor */}
      <div
        className={`custom-cursor ${isHovering === 'card' ? 'hover' : ''} ${isHovering === 'toggle' ? 'hidden' : ''} ${isHovering === 'clickable' ? 'clickable' : ''}`}
        style={{
          left: cursorPosition.x - 10,
          top: cursorPosition.y - 10,
          '--primary-color': isCoffeeMode ? '#78634a' : '#5a7a4a'
        } as React.CSSProperties}
      >
        {isHovering === 'clickable' ? '⊹' : '𖧋'}
      </div>

      {/* Simple Header */}
      <header className={`border-b border-gray-200 px-6 pt-16 pb-6 transition-colors duration-300 ${
        isCoffeeMode ? 'bg-coffee-headerBg' : 'bg-bubbleTea-headerBg'
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div className="flex-1">
              <h1 className={`text-3xl font-normal ${archivo.className} ${
                isCoffeeMode ? 'text-coffee-primary' : 'text-bubbleTea-primary'
              }`}>⛾ [ DA ] LIST .𖥔 ݁ ˖</h1>
              <p className={`text-sm italic font-bold mt-1 ${
                isCoffeeMode ? 'text-coffee-secondary' : 'text-bubbleTea-secondary'
              }`}>danel's personal café list; loosely ranked based on quality + aesthetic + vibes ⊹₊⟡⋆</p>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center space-x-2 flex-shrink-0 self-end">
              <div className="text-center">
                <div className={`text-xs mb-1 ${
                  isCoffeeMode ? 'text-coffee-primary' : 'text-gray-500'
                }`}>{coffeeCount}</div>
                <span className={`text-base ${
                  isCoffeeMode ? 'text-coffee-secondary' : 'text-gray-600'
                }`}>☕</span>
              </div>
              <button
                onClick={toggleTheme}
                onMouseEnter={() => setIsHovering('clickable')}
                onMouseLeave={() => setIsHovering(false)}
                className={`toggle-button relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                  isCoffeeMode ? 'bg-coffee-secondary' : 'bg-bubbleTea-secondary'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    isCoffeeMode ? 'translate-x-1' : 'translate-x-6'
                  }`}
                />
              </button>
              <div className="text-center">
                <div className={`text-xs mb-1 ${
                  isCoffeeMode ? 'text-gray-500' : 'text-bubbleTea-primary'
                }`}>{bubbleTeaCount}</div>
                <span className={`text-base ${
                  isCoffeeMode ? 'text-gray-600' : 'text-bubbleTea-secondary'
                }`}>🧋</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Region Tabs */}
      <div>
        <div className="px-6">
          <div className="max-w-4xl mx-auto">
            <nav className="flex space-x-8 overflow-x-auto pb-2 -mb-2">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  onMouseEnter={() => setIsHovering('clickable')}
                  onMouseLeave={() => setIsHovering(false)}
                  className={`region-tab py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeRegion === region
                      ? isCoffeeMode
                        ? 'border-coffee-secondary text-coffee-secondary'
                        : 'border-bubbleTea-secondary text-bubbleTea-secondary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {region === 'all' ? 'all regions' : region === 'recommended' ? 'recommended' : region}
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {getFilteredRegionCount(region)}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Simple Numbered List */}
      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {currentCafes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">no cafés found in this region (yet)</p>
            </div>
                    ) : activeRegion === 'recommended' ? (
            // Pantone tile layout for recommended
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayCafes.map((cafe, index) => {
                const isClicked = clickedCards.has(cafe.id);



                return (
                  <div
                    key={cafe.id}
                    className="w-full group relative cursor-pointer"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handlePantoneEnter}
                    onMouseLeave={handlePantoneLeave}
                    onClick={() => handleCardClick(cafe.id)}
                  >
                    <div className="bg-white">
                      {/* Color Swatch or Custom Image */}
                      <div className={`w-full h-48 ${
                        isCoffeeMode ? 'bg-coffee-headerBg' : 'bg-bubbleTea-headerBg'
                      } flex items-center justify-center overflow-hidden transition-all duration-300`}>
                        {isClicked && cafe.image && (
                          <CafeImage
                            src={cafe.image}
                            alt={cafe.name}
                            isCoffeeMode={isCoffeeMode}
                            priority={index < 8}
                          />
                        )}
                      </div>

                      {/* Café Info - Pantone Style */}
                      <div className={`px-4 pt-3 pb-3 flex flex-col border-x border-b ${
                        isCoffeeMode ? 'border-coffee-headerBg' : 'border-bubbleTea-headerBg'
                      }`}>
                        <div>
                          <div className={`font-black text-xl text-gray-900 uppercase tracking-tighter mb-1 ${archivo.className}`}>
                            [ DA ] LIST .𖥔 ݁ ˖
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {(cafe as GroupedCafe).locations.join(', ').length > 28
                              ? (cafe as GroupedCafe).locations.join(', ').slice(0, 25) + '...'
                              : (cafe as GroupedCafe).locations.join(', ')
                            }
                          </div>
                          <div className="font-medium text-sm text-gray-900 leading-tight">
                            {cafe.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tooltip */}
                    {isHydrated && (
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
                           style={{
                             left: 'var(--mouse-x, 0px)',
                             top: 'var(--mouse-y, 0px)',
                             transform: 'translate(8px, 8px)',
                             willChange: 'transform'
                           }}>
                        <div className="bg-gray-600/40 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
                          ⚲ {(cafe as GroupedCafe).locations.length > 1 ? 'various locations' : (cafe as GroupedCafe).locations[0] + ', ' + (cafe as GroupedCafe).region}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Regular list layout for other tabs
            <div className="space-y-0">
              {currentCafes.map((cafe, index) => (
                <div key={cafe.id} className={`flex items-start py-1 rounded px-2 transition-colors duration-300 group`}>
                  <span className={`text-gray-500 text-sm font-mono mr-4 mt-1 min-w-[2rem] rounded-full px-2 py-1 transition-colors duration-300 ${
                    isCoffeeMode
                      ? 'group-hover:bg-coffee-headerBg group-hover:text-coffee-primary'
                      : 'group-hover:bg-bubbleTea-headerBg group-hover:text-bubbleTea-primary'
                  }`}>
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <div className={`font-medium text-gray-900 transition-colors duration-300 ${
                      isCoffeeMode
                        ? 'group-hover:text-coffee-primary'
                        : 'group-hover:text-bubbleTea-primary'
                    }`}>{cafe.name}</div>
                    <div className={`text-sm text-gray-600 mt-0.5 transition-colors duration-300 ${
                      isCoffeeMode
                        ? 'group-hover:text-coffee-primary'
                        : 'group-hover:text-bubbleTea-primary'
                    }`}>
                      ⚲ {cafe.location}
                    </div>
                  </div>
                  {cafe.features && cafe.features.length > 0 && (
                    <div className={`text-sm text-gray-500 ml-4 text-right italic transition-colors duration-300 ${
                      isCoffeeMode
                        ? 'group-hover:text-coffee-primary'
                        : 'group-hover:text-bubbleTea-primary'
                    }`}>
                      {cafe.features.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}