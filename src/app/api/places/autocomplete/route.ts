import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get('input');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    if (!input) {
      return NextResponse.json({ error: 'Input parameter is required' }, { status: 400 });
    }

    // Call Google Places Autocomplete API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    );

    console.log(`Fetching autocomplete for: ${input}`);

    if (!response.ok) {
      throw new Error(`Google API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in places autocomplete API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location suggestions' },
      { status: 500 }
    );
  }
}
