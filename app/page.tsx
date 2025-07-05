'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { cafes } from '../data/cafes';
import { Cafe, GroupedCafe } from '../types/cafe';
import { Inter, Overpass, DM_Serif_Display, Archivo } from 'next/font/google';
import CafeImage from '../components/CafeImage';
import ThemeToggle from '../components/ThemeToggle';

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
  const [showThemePopup, setShowThemePopup] = useState(true);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
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

  const regions = useMemo(() => {
    const regionCounts = Object.keys(cafesByRegion).map(region => ({
      name: region,
      count: getFilteredRegionCount(region)
    }));

    // Sort regions by count (descending) and filter out regions with 0 cafes
    const sortedRegions = regionCounts
      .filter(region => region.count > 0)
      .sort((a, b) => b.count - a.count)
      .map(region => region.name);

    return ['recommended', 'all', ...sortedRegions];
  }, [cafesByRegion, isCoffeeMode]);

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

    // Sort alphabetically by name for all regions tab
    if (activeRegion === 'all') {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
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

    // Enhanced image preloading system
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);

  // Preload images for better performance
  useEffect(() => {
    if (!isHydrated) return;

    const preloadImage = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          setPreloadedImages(prev => new Set(Array.from(prev).concat([src])));
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    };

    const preloadVisibleImages = async () => {
      setIsPreloading(true);
      const imagesToPreload = displayCafes
        .filter(cafe => cafe.image && !preloadedImages.has(cafe.image))
        .slice(0, 8); // Preload up to 8 images at a time

      if (imagesToPreload.length > 0) {
        try {
          await Promise.allSettled(
            imagesToPreload.map(cafe => preloadImage(cafe.image!))
          );
        } catch (error) {
          console.warn('Some images failed to preload:', error);
        }
      }
      setIsPreloading(false);
    };

    // Preload images with a small delay to avoid blocking initial render
    const timeoutId = setTimeout(preloadVisibleImages, 200);
    return () => clearTimeout(timeoutId);
  }, [displayCafes, isHydrated, preloadedImages]);

  // Count cafés by type
  const coffeeCount = cafes.filter(cafe => cafe.features.includes('coffee') || cafe.features.includes('vietnamese coffee')).length;
  const bubbleTeaCount = cafes.filter(cafe => cafe.features.includes('bubble tea')).length;

  const toggleTheme = useCallback(() => {
    setIsCoffeeMode(!isCoffeeMode);
  }, [isCoffeeMode]);

  const selectTheme = useCallback((theme: 'coffee' | 'bubble-tea') => {
    setIsCoffeeMode(theme === 'coffee');
    setShowThemePopup(false);
  }, []);

  const handleCardClick = useCallback((cafeId: string) => {
    setClickedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cafeId)) {
        newSet.delete(cafeId);
      } else {
        newSet.add(cafeId);
      }
      return newSet;
    });
  }, []);

      // Mouse tracking for tooltips with throttling
  const handleMouseMove = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastMouseMove.current < 16) return; // Increased throttling for better performance
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
    if (window.innerWidth > 768 && Math.random() < 0.25) {
      const symbols = ['⋆', '.', '˚', '•'];
      const newSparkle = {
        id: sparkleId.current++,
        x: e.clientX + (Math.random() - 0.5) * 30,
        y: e.clientY + (Math.random() - 0.5) * 30,
        opacity: 0.8,
        symbol: symbols[Math.floor(Math.random() * symbols.length)]
      };

      setSparkles(prev => {
        const updated = [...prev, newSparkle];
        return updated.slice(-25);
      });
    }
  };

  // Handle mouse enter/leave for cursor scaling
  const handleMouseEnter = () => setIsHovering('card');
  const handleMouseLeave = () => setIsHovering(false);
  const handlePantoneEnter = (cafeId: string) => () => {
    setIsHovering('clickable');
    setHoveredCardId(cafeId);
  };
  const handlePantoneLeave = () => {
    setIsHovering(false);
    setHoveredCardId(null);
  };

  // Clean up sparkles
  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles(prev => prev.map(sparkle => ({
        ...sparkle,
        opacity: Math.max(0, sparkle.opacity - 0.15)
      })).filter(sparkle => sparkle.opacity > 0));
    }, 50);

    return () => clearInterval(interval);
  }, []);

    // Check if mobile and handle resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add global mouse tracking (disabled on mobile)
  useEffect(() => {
    setIsHydrated(true);

    // Only add mouse tracking on desktop devices
    if (!isMobile) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
    }
  }, [isMobile]);

  // Update document background color based on theme
  useEffect(() => {
    document.documentElement.style.backgroundColor = isCoffeeMode ? '#f5f1ed' : '#f0f7ed';
    document.body.style.backgroundColor = isCoffeeMode ? '#f5f1ed' : '#f0f7ed';
  }, [isCoffeeMode]);



  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isCoffeeMode ? 'bg-coffee-pageBg' : 'bg-bubbleTea-pageBg'
    }`} style={{
      backgroundColor: isCoffeeMode ? '#f5f1ed' : '#f0f7ed'
    }}>
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

      {/* Custom Cursor (hidden on mobile) */}
      {!isMobile && (
        <div
          className={`custom-cursor ${isHovering === 'card' ? 'hover' : ''} ${isHovering === 'toggle' ? 'hidden' : ''} ${isHovering === 'clickable' ? 'clickable' : ''}`}
          style={{
            left: cursorPosition.x - 10,
            top: cursorPosition.y - 10,
            '--primary-color': isCoffeeMode ? '#78634a' : '#5a7a4a',
            zIndex: 10000
          } as React.CSSProperties}
        >
          {isHovering === 'clickable' ? '⊹' : '𖧋'}
        </div>
      )}

                        {/* Theme Selection Popup */}
      {showThemePopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-lg p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden border border-gray-200/50">
            {/* Light glass base layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-gray-100/30"></div>
            {/* Glass surface reflections */}
            <div className="absolute inset-0 opacity-50">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/50 via-white/20 to-transparent"></div>
              <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-white/40 via-transparent to-transparent"></div>
            </div>
            {/* Light depth and shadows */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-b from-gray-200/20 via-transparent to-transparent"></div>
            <div className="absolute inset-0 opacity-25 bg-gradient-to-r from-gray-200/15 via-transparent to-transparent"></div>
            {/* Subtle light glass texture */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
            <div className="absolute inset-0 opacity-15 bg-gradient-to-tl from-white/15 via-transparent to-transparent"></div>
            {/* Theme color hints */}
            <div className="absolute top-0 left-0 w-1/2 h-1/2 opacity-10 bg-gradient-to-br from-coffee-primary/20 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-10 bg-gradient-to-tl from-bubbleTea-primary/20 via-transparent to-transparent"></div>
            {/* Light glass edge highlights */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-t from-white/40 via-transparent to-transparent"></div>
            <div className="absolute inset-0 opacity-25 bg-gradient-to-l from-white/30 via-transparent to-transparent"></div>
            <div className="relative z-10">
              <div className="text-center mb-8 pt-4">
                <h1 className={`text-3xl font-normal ${archivo.className} text-gray-900 mb-2`}>
                  ⛾ [ DA ] LIST .𖥔 ݁ ˖
                </h1>
                <p className="text-sm text-gray-700">
                  danel's WORK IN PROGRESS personal café list
                </p>
                <p className="text-sm text-gray-700">
                  mostly alphabetical for the time being, look on desktop not mobile pls
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => selectTheme('coffee')}
                  onMouseEnter={() => setIsHovering('clickable')}
                  onMouseLeave={() => setIsHovering(false)}
                  className="flex-1 py-4 px-6 bg-white/70 backdrop-blur-lg hover:bg-coffee-primary hover:text-white transition-all duration-300 rounded-md text-center group relative overflow-hidden border border-gray-200/50"
                >
                  {/* Light glass card effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-transparent"></div>
                  <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-white/30 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 opacity-25 bg-gradient-to-l from-white/20 via-transparent to-transparent"></div>
                  {/* Coffee color hint */}
                  <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-coffee-primary/15 via-transparent to-transparent"></div>
                  <div className="relative">
                    <div className="text-lg font-semibold text-coffee-primary group-hover:text-white transition-colors">
                      SEE COFFEE
                    </div>
                    <div className="text-sm text-coffee-secondary group-hover:text-white/80 transition-colors">
                      {coffeeCount} cafés
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => selectTheme('bubble-tea')}
                  onMouseEnter={() => setIsHovering('clickable')}
                  onMouseLeave={() => setIsHovering(false)}
                  className="flex-1 py-4 px-6 bg-white/70 backdrop-blur-lg hover:bg-bubbleTea-primary hover:text-white transition-all duration-300 rounded-md text-center group relative overflow-hidden border border-gray-200/50"
                >
                  {/* Light glass card effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-transparent"></div>
                  <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-white/30 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 opacity-25 bg-gradient-to-l from-white/20 via-transparent to-transparent"></div>
                  {/* Bubble tea color hint */}
                  <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-bubbleTea-primary/15 via-transparent to-transparent"></div>
                  <div className="relative">
                    <div className="text-lg font-semibold text-bubbleTea-primary group-hover:text-white transition-colors">
                      SEE BUBBLE TEA
                    </div>
                    <div className="text-sm text-bubbleTea-secondary group-hover:text-white/80 transition-colors">
                      {bubbleTeaCount} cafés
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent layout shift when popup appears */}
      {showThemePopup && (
        <div className="h-32"></div>
      )}

      {/* Theme Toggle (only shown after theme selection) */}
      {!showThemePopup && (
        <div className="px-4 mt-8 mb-8">
          <div className="max-w-4xl mx-auto">
            <ThemeToggle
              isCoffeeMode={isCoffeeMode}
              coffeeCount={coffeeCount}
              bubbleTeaCount={bubbleTeaCount}
              onToggle={toggleTheme}
              size="small"
              onMouseEnter={() => setIsHovering('clickable')}
              onMouseLeave={() => setIsHovering(false)}
            />
          </div>
        </div>
      )}

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
                  <span className="ml-2 text-xs">
                    ‹ {getFilteredRegionCount(region)} ›
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
                    onMouseEnter={handlePantoneEnter(cafe.id)}
                    onMouseLeave={handlePantoneLeave}
                    onClick={() => handleCardClick(cafe.id)}
                  >
                    <div className="bg-white rounded-sm">
                      {/* Color Swatch or Custom Image */}
                      <div className={`w-full h-48 ${
                        isCoffeeMode ? 'bg-coffee-headerBg' : 'bg-bubbleTea-headerBg'
                      } flex items-center justify-center overflow-hidden`}>
                        {isClicked && cafe.image && (
                          <CafeImage
                            src={cafe.image}
                            alt={cafe.name}
                            isCoffeeMode={isCoffeeMode}
                            priority={index < 2}
                            isPreloaded={preloadedImages.has(cafe.image)}
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
                    {hoveredCardId === cafe.id && (
                      <div className="absolute opacity-100 transition-opacity duration-200 pointer-events-none z-10"
                           style={{
                             left: 'var(--mouse-x, 0px)',
                             top: 'var(--mouse-y, 0px)',
                             transform: 'translate(8px, 8px)',
                             willChange: 'transform'
                           }}>
                        <div className="bg-gray-600/40 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
                          ⚲ {(cafe as GroupedCafe).locations.length > 1 || (cafe as GroupedCafe).locations.includes('[too many]') ? 'various locations in ' + (cafe as GroupedCafe).region : (cafe as GroupedCafe).locations[0] + ', ' + (cafe as GroupedCafe).region}
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
                <div key={cafe.id} className={`flex items-start py-1 rounded px-2 group`}>
                  <span className={`text-gray-500 text-sm font-mono mr-4 mt-1 w-12 text-right rounded-full px-2 py-1 ${
                    isCoffeeMode
                      ? 'group-hover:bg-coffee-headerBg group-hover:text-coffee-primary'
                      : 'group-hover:bg-bubbleTea-headerBg group-hover:text-bubbleTea-primary'
                  }`}>
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <div className={`font-medium text-gray-900 ${
                      isCoffeeMode
                        ? 'group-hover:text-coffee-primary'
                        : 'group-hover:text-bubbleTea-primary'
                    }`}>{cafe.name}</div>
                    <div className={`text-sm text-gray-600 mt-0.5 ${
                      isCoffeeMode
                        ? 'group-hover:text-coffee-primary'
                        : 'group-hover:text-bubbleTea-primary'
                    }`}>
                      ⚲ {cafe.location}
                    </div>
                  </div>
                  {cafe.features && cafe.features.length > 0 && (
                    <div className={`text-sm text-gray-500 ml-4 text-right italic ${
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

      {/* Footer spacing */}
      <div className="h-16"></div>
    </div>
  );
}