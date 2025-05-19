import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placeId = searchParams.get('place_id');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    if (!placeId) {
      return NextResponse.json({ error: 'place_id parameter is required' }, { status: 400 });
    }

    // Call Google Places Details API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    );

    console.log(`Fetching details for place_id: ${placeId}`);

    if (!response.ok) {
      throw new Error(`Google API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in places details API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location details' },
      { status: 500 }
    );
  }
}
