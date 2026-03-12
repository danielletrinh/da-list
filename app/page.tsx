'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Cafe, GroupedCafe } from '@/types/cafe';
import CafeImage from '@/components/CafeImage';
import { dmSans, gupter, workSans } from '@/lib/fonts';
import { useHover } from '@/components/CustomCursor';

export default function Home() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState<string>('recommended');
  const [showMatchaTea, setShowMatchaTea] = useState(true);
  const [showCoffee, setShowCoffee] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const { setHoverState } = useHover();

  const hasCoffee = (cafe: Cafe) =>
    cafe.features.includes('coffee') || cafe.features.includes('vietnamese coffee');
  const hasMatchaTea = (cafe: Cafe) =>
    cafe.features.includes('bubble tea') || cafe.features.includes('matcha');
  const matchesTypeFilter = (cafe: Cafe) =>
    (showCoffee && hasCoffee(cafe)) || (showMatchaTea && hasMatchaTea(cafe));

  const currentCafes = useMemo(() => {
    let filtered = cafes.filter(matchesTypeFilter);
    if (activeRegion === 'recommended') {
      filtered = filtered.filter(cafe => cafe.recommended);
    } else if (activeRegion !== 'all') {
      filtered = filtered.filter(cafe => cafe.region === activeRegion);
    }
    if (activeRegion === 'all') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [cafes, showMatchaTea, showCoffee, activeRegion]);

  const groupedCafes = useMemo(() => {
    if (activeRegion !== 'recommended') return currentCafes;
    const grouped = currentCafes.reduce((acc, cafe) => {
      if (!acc[cafe.name]) acc[cafe.name] = [];
      acc[cafe.name].push(cafe);
      return acc;
    }, {} as Record<string, Cafe[]>);
    return Object.entries(grouped).map(([name, cafes]) => ({
      id: cafes[0].id,
      name,
      locations: cafes.map(c => c.location),
      region: cafes[0].region,
      features: cafes[0].features,
      recommended: cafes[0].recommended,
      image: cafes[0].image,
      description: cafes[0].description
    })) as GroupedCafe[];
  }, [currentCafes, activeRegion]);

  const displayCafes = activeRegion === 'recommended' ? groupedCafes : currentCafes;

  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isHydrated) return;
    const preloadImage = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          setPreloadedImages(prev => new Set(Array.from(prev).concat(src)));
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });

    const preloadVisibleImages = async () => {
      const imagesToPreload = displayCafes
        .filter(cafe => cafe.image && !preloadedImages.has(cafe.image))
        .slice(0, 8);
      if (imagesToPreload.length > 0) {
        await Promise.allSettled(imagesToPreload.map(cafe => preloadImage(cafe.image!)));
      }
    };
    const timeoutId = setTimeout(preloadVisibleImages, 200);
    return () => clearTimeout(timeoutId);
  }, [displayCafes, isHydrated, preloadedImages]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const el = e.currentTarget as HTMLElement;
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const handlePantoneEnter = (cafeId: string) => () => {
    setHoverState('clickable');
    setHoveredCardId(cafeId);
  };
  const handlePantoneLeave = () => {
    setHoverState(false);
    setHoveredCardId(null);
  };

  useEffect(() => {
    const fetchCafes = async () => {
      try {
        const response = await fetch('/api/cafes?recommended=true');
        if (response.ok) {
          const data = await response.json();
          setCafes(data);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchCafes();
  }, []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div className="min-h-screen bg-primary-offBlack">
      <header className="px-4 sm:px-6 pt-12 sm:pt-16 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:justify-between sm:text-left gap-4">
            <div className="flex flex-col items-center sm:items-start">
              <h1 className="font-dirtyline text-4xl sm:text-5xl font-medium text-primary-pureWhite pt-10 sm:-ml-6">
              <span className="text-primary-primary">「 café</span>xcursions<span className="text-primary-primary"> 」</span>
              </h1>
              <p className={`text-sm text-primary-pureWhite ${dmSans.className} italic`}>
                <a
                href="https://danielletrinh.com/"
                onMouseEnter={() => setHoverState('help')}
                onMouseLeave={() => setHoverState(false)}
              >
                my favourites (not by ranking) from around the world &lt;3
              </a>
              </p>
            </div>
            <div className="pt-4 sm:pt-16">
              <Link
                href="/all"
                draggable={false}
                className={`text-xs sm:text-sm text-primary-pureWhite ${workSans.className} hover:text-primary-primary transition-colors block`}
              >
                SEE FULL LISTS
              </Link>
            </div>
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="px-4 sm:px-6 py-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className={`text-sm text-primary-offWhite ${workSans.className}`}></p>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="px-4 sm:px-6 py-6">
          <div className="max-w-4xl mx-auto">
            {currentCafes.length === 0 ? (
              <div className="text-center py-12">
                <p className={`text-sm text-primary-offWhite ${workSans.className}`}>( select the bottom left things )</p>
              </div>
            ) : activeRegion === 'recommended' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {displayCafes.map((cafe, index) => {
                return (
                  <div
                    key={cafe.id}
                    className="w-full group relative"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handlePantoneEnter(cafe.id)}
                    onMouseLeave={handlePantoneLeave}
                  >
                    <div className="bg-primary-offWhite rounded-sm">
                      <div className="w-full h-48 bg-primary-offBlack flex items-center justify-center overflow-hidden">
                        {cafe.image && (
                          <CafeImage
                            src={cafe.image}
                            alt={cafe.name}
                            priority={index < 2}
                            isPreloaded={preloadedImages.has(cafe.image)}
                          />
                        )}
                      </div>

                      {/* pantone café info */}
                      <div className="px-4 pt-4 pb-3 flex flex-col border-x border-b border-primary-offBlack">
                        <div>
                          <div className={`font-medium text-sm text-primary-offBlack leading-tight tracking-tight ${workSans.className}`}>
                            {cafe.name}
                          </div>
                          <div className={`text-xs text-primary-offBlack pt-1 mb-1`}>
                            {cafe.description}
                          </div>
                        </div>
                      </div>
                    </div>

                    {hoveredCardId === cafe.id && (
                      <div
                        className="absolute opacity-100 transition-opacity duration-200 pointer-events-none z-10"
                        style={{
                          left: 'var(--mouse-x, 0px)',
                          top: 'var(--mouse-y, 0px)',
                          transform: 'translate(8px, 8px)',
                          willChange: 'transform'
                        }}
                      >
                        <div className="bg-primary-tooltip/40 text-white text-xs px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
                          ⚲ {(cafe as GroupedCafe).locations.length > 1 || (cafe as GroupedCafe).locations.includes('[too many]') ? 'various locations in ' + (cafe as GroupedCafe).region : (cafe as GroupedCafe).locations[0] + ', ' + (cafe as GroupedCafe).region}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="space-y-0">
                {currentCafes.map((cafe, index) => (
                  <div key={cafe.id} className="flex items-start py-1 rounded px-2 group">
                    <span className="text-white/80 text-sm font-mono mr-4 mt-1 w-12 text-right rounded-full px-2 py-1 group-hover:bg-primary-offBlack group-hover:text-primary-primary">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <div className={`font-medium text-primary-offBlack ${gupter.className} group-hover:text-primary-primary`}>{cafe.name}</div>
                      <div className="text-sm text-primary-offBlack/80 mt-0.5 group-hover:text-primary-primary">
                        ⚲ {cafe.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-16" />

      <div
        className={`fixed bottom-6 left-6 z-[100] flex flex-col gap-3 ${workSans.className} text-sm`}
      >
        <button
          type="button"
          onClick={() => setShowMatchaTea((v) => !v)}
          className="text-left text-white/90  hover:text-primary-primary transition-colors block font-inherit whitespace-pre"
        >
          {'‹  '}<span className={showMatchaTea ? "opacity-100" : "text-transparent"}>⟡</span>{'  ›'}  MATCHA / TEA
        </button>
        <button
          type="button"
          onClick={() => setShowCoffee((v) => !v)}
          className="text-left text-white/90  hover:text-primary-primary transition-colors block font-inherit whitespace-pre"
        >
          {'‹  '}<span className={showCoffee ? "opacity-100" : "text-transparent"}>⟡</span>{'  ›'}  COFFEE
        </button>
      </div>
    </div>
  );
}