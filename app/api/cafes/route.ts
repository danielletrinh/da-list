import { NextResponse } from 'next/server'
import { cafeService } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    console.log('API route called');

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables are not set');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const recommended = searchParams.get('recommended')
    console.log('Recommended param:', recommended);

    let cafes
    if (recommended === 'true') {
      console.log('Fetching recommended cafes...');
      cafes = await cafeService.getRecommendedCafes()
    } else {
      console.log('Fetching all cafes...');
      cafes = await cafeService.getAllCafes()
    }

    console.log('Fetched cafes count:', cafes?.length || 0);
    console.log('First cafe:', cafes?.[0]);

    return NextResponse.json(cafes)
  } catch (error) {
    console.error('Error fetching cafés:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cafés' },
      { status: 500 }
    )
  }
}