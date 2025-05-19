import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseLocationParam } from '@/lib/eventHelpers';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default_user';
    const searchParams = request.nextUrl.searchParams;
    const locationParam = searchParams.get('location');
    const [userLong, userLat] = parseLocationParam(locationParam);
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 100; // Default 100 mile radius
    const maxDaysOld = searchParams.get('maxDaysOld') ? parseInt(searchParams.get('maxDaysOld')!, 10) : undefined; // Parameter for filtering events within next X days

    const today = new Date();
    // Calculate the future cutoff date if maxDaysOld is provided (today + maxDaysOld days)
    const futureCutoffDate = maxDaysOld !== undefined ? new Date(today.getTime() + maxDaysOld * 24 * 60 * 60 * 1000) : undefined;

    // Use a raw SQL query to count events within the radius
    const countQuery = Prisma.sql`
      WITH event_coords AS (
        SELECT
          e.id,
          -- Calculate distance in miles using the Haversine formula
          (
            3958.8 * acos(
              cos(radians(${userLat})) *
              cos(radians((e.geolocation->>1)::float)) *
              cos(radians((e.geolocation->>0)::float) - radians(${userLong})) +
              sin(radians(${userLat})) *
              sin(radians((e.geolocation->>1)::float))
            )
          ) AS distance
        FROM events e
        LEFT JOIN user_event_status ues ON e.id = ues.event_id AND ues.user_id = ${userId}
        WHERE
          e.eventstartdatetime > ${today} AND
          ${futureCutoffDate ? Prisma.sql`e.eventstartdatetime <= ${futureCutoffDate} AND` : Prisma.sql``}
          e.geolocation IS NOT NULL AND
          e.geolocation != '{}' AND
          (ues.user_id IS NULL OR (
            (ues.archived IS NULL OR ues.archived = false) AND
            (ues.saved IS NULL OR ues.saved = false) AND
            (ues.opened_count IS NULL OR ues.opened_count = 0)
          ))
      )
      SELECT COUNT(*) as count
      FROM event_coords
      WHERE distance <= ${radius};
    `;

    // Execute the query
    const result = await prisma.$queryRaw<[{ count: number }]>(countQuery);
    const count = parseInt(result[0].count.toString());

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
