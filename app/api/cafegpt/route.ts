import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

type ChatRequest = {
  message?: string;
  region?: string;
  type?: 'coffee' | 'bubble tea' | 'any';
  limit?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const query = (body.message || '').toLowerCase();
    const region = (body.region || '').toLowerCase();
    const limit = Math.min(Math.max(body.limit ?? 6, 1), 20);

    // Load ONLY the test dataset
    const dataset = await (async () => {
      const filePath = path.join(process.cwd(), 'data', 'cafegpt-test.json');
      const json = await fs.readFile(filePath, 'utf8');
      type TestCafe = { id: string; name: string; location: string; region: string; notes?: string; recommended?: boolean; image?: string };
      const items = JSON.parse(json) as TestCafe[];
      // Synthesize minimal features from freeform notes so scoring/type filters still work
      return items.map(item => {
        const notes = (item.notes || '').toLowerCase();
        const features: string[] = [];
        if (/coffee|espresso|latte|roast|pour-over|pour over/.test(notes)) features.push('coffee');
        if (/vietnamese/.test(notes)) features.push('vietnamese coffee');
        if (/bubble|boba|milk tea|tea/.test(notes)) features.push('bubble tea');
        return {
          id: item.id,
          name: item.name,
          location: item.location,
          region: item.region,
          features,
          recommended: Boolean(item.recommended),
          image: item.image,
          notes: item.notes || ''
        } as any;
      });
    })();

    let desiredType: 'coffee' | 'bubble tea' | 'any' = body.type ?? 'any';
    if (desiredType === 'any') {
      if (query.includes('bubble') || query.includes('boba') || query.includes('tea')) desiredType = 'bubble tea';
      else if (query.includes('coffee') || query.includes('espresso') || query.includes('latte')) desiredType = 'coffee';
    }

    const normalized = (s: string) => s.toLowerCase();

    const matchesType = (features: string[]) => {
      if (desiredType === 'any') return true;
      if (desiredType === 'coffee') return features.includes('coffee') || features.includes('vietnamese coffee');
      return features.includes('bubble tea');
    };

    const inferredRegion = (() => {
      if (region) return region;
      const knownRegions = Array.from(new Set(dataset.map((c: any) => c.region.toLowerCase())));
      const found = knownRegions.find(r => query.includes(r.split(',')[0]));
      return found || '';
    })();

    // Split on non-alphanumeric characters (ASCII) for compatibility with older JS targets
    const tokens = query.split(/[^a-z0-9]+/i).filter(Boolean);

    const scored = dataset
      .filter((c: any) => matchesType((c.features || []).map(normalized)))
      .filter(c => (inferredRegion ? normalized(c.region).includes(inferredRegion) : true))
      .map(c => {
        let score = 0;
        const hay = `${normalized(c.name)} ${normalized(c.location)} ${normalized(c.region)} ${(c.features || []).map(normalized).join(' ')} ${(c.notes || '').toLowerCase()}`;
        for (const t of tokens) {
          if (!t) continue;
          if (hay.includes(t)) score += 2;
        }
        if (c.recommended) score += 1.5;
        // Nudge toward more specific matches when both type and region align
        if (desiredType !== 'any') score += 0.5;
        if (inferredRegion) score += 0.5;
        return { cafe: c, score };
      })
      .filter(x => x.score > 0 || tokens.length === 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.cafe);

    const summary = (() => {
      const parts: string[] = [];
      if (desiredType !== 'any') parts.push(desiredType);
      if (inferredRegion) parts.push(`in ${inferredRegion}`);
      return parts.length ? parts.join(' ') : 'based on your query';
    })();

    return NextResponse.json({
      summary,
      count: scored.length,
      suggestions: scored.map((c: any) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        region: c.region,
        features: c.features,
        recommended: c.recommended,
        image: c.image ?? null,
        notes: c.notes ?? ''
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}


