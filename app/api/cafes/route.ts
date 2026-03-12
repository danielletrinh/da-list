import { NextResponse } from 'next/server'
import { cafeService } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recommended = searchParams.get('recommended');

    const cafes =
      recommended === 'true'
        ? await cafeService.getRecommendedCafes()
        : await cafeService.getAllCafes();

    return NextResponse.json(cafes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cafés' },
      { status: 500 }
    );
  }
}