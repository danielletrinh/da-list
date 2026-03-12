'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { dmSans, workSans } from '@/lib/fonts';
import { useHover } from '@/components/CustomCursor';
import type { Cafe, CafeRow } from '@/types/cafe';

const SEP = '、';

/** Max width so the wall doesn't overflow viewport. */
const WALL_MAX_WIDTH = 720;

export default function AllPage() {
  const { setHoverState } = useHover();
  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cafes')
      .then((res) => res.json())
      .then((data) => {
        setCafes(Array.isArray(data) ? data : []);
      })
      .catch(() => setCafes([]))
      .finally(() => setIsLoading(false));
  }, []);

  const regionsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cafes.forEach((c) => {
      const r = c.region || 'Other';
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [cafes]);

  const uniqueNames = useMemo(() => {
    const unique = Array.from(new Set(cafes.map((c) => c.name))).sort((a, b) => a.localeCompare(b));
    return unique;
  }, [cafes]);

  const nameToRegions = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    cafes.forEach((c) => {
      const r = c.region || 'Other';
      if (!map[c.name]) map[c.name] = new Set();
      map[c.name].add(r);
    });
    return map;
  }, [cafes]);

  const totalCount = cafes.length;

  const lastUpdated = useMemo(() => {
    if (cafes.length === 0) return null;
    const sorted = [...cafes].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });
    const mostRecent = sorted[0];
    const dateStr = mostRecent.created_at;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const formatted = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    return { date: formatted, name: mostRecent.name };
  }, [cafes]);

  return (
    <div className="min-h-screen bg-primary-offBlack">
      <header className="px-4 sm:px-6 pt-12 sm:pt-16 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:justify-between sm:text-left gap-4">
            <div className="flex flex-col items-center sm:items-start">
              <h1 className="font-dirtyline text-[40px] font-medium text-primary-pureWhite pt-10 sm:-ml-6">
                <span className="text-primary-primary">「 café</span>xcursions
                <span className="text-primary-primary"> 」</span>
              </h1>
              <p className={`text-sm text-primary-pureWhite ${dmSans.className} italic`}>
                {lastUpdated
                  ? `last updated on ${lastUpdated.date} with ⛾ ${lastUpdated.name}`
                  : '—'}
              </p>
            </div>
            <div className="pt-4 sm:pt-16">
              <Link
                href="/"
                draggable={false}
                className={`text-xs sm:text-sm text-primary-pureWhite ${workSans.className} hover:text-primary-primary transition-colors block`}
              >
                SEE FAVOURITES
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 flex flex-col items-center">
        {isLoading ? (
          <p className={`text-sm text-primary-offWhite ${workSans.className}`}></p>
        ) : (
          <>
            <div
              className="grid grid-cols-[1fr_auto] gap-4 flex-shrink-0 items-stretch"
              style={{ width: 'max-content', maxWidth: '100%' }}
            >
              <div
                className={`min-h-0 bg-primary-offBlack box-border text-primary-hiding overflow-auto ${workSans.className}`}
                style={{
                  maxWidth: WALL_MAX_WIDTH,
                  fontSize: '9px',
                  lineHeight: 1.3,
                  padding: '14px 16px',
                  boxSizing: 'border-box',
                  textAlign: 'justify',
                }}
              >
                {uniqueNames.map((name, i) => {
                  const isInHoveredRegion =
                    hoveredRegion != null && nameToRegions[name]?.has(hoveredRegion);
                  return (
                    <span key={`${name}-${i}`}>
                      {i > 0 ? SEP : null}
                      <span
                        className={
                          isInHoveredRegion
                            ? 'text-primary-primary font-medium transition-colors duration-150'
                            : 'transition-colors duration-150'
                        }
                      >
                        {name}
                      </span>
                    </span>
                  );
                })}
              </div>
              <div
                className={`flex flex-col justify-center gap-0.5 pt-1 ${workSans.className} text-[12px] sm:text-xs text-primary-pureWhite`}
              >
                {regionsWithCounts.map(([region, count]) => {
                  const isHovered = hoveredRegion === region;
                  return (
                    <div
                      key={region}
                      className="flex items-baseline gap-1 cursor-default"
                      onMouseEnter={() => setHoveredRegion(region)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    >
                      <span
                        className={`font-medium transition-colors duration-150 ${isHovered ? 'text-primary-offWhite' : 'text-primary-hiding'}`}
                      >
                        {region}
                      </span>
                      <span className={isHovered ? 'text-primary-grey' : 'text-primary-hiding'}>
                        ({count})
                      </span>
                    </div>
                  );
                })}
                <div className={`pt-1.5 text-primary-pureWhite ${workSans.className}`}>
                  TOTAL : {totalCount} !!
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
