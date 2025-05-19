import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseLocationParam, triggerRecommendations } from '@/lib/eventHelpers';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default_user';
    const searchParams = request.nextUrl.searchParams;
    const locationParam = searchParams.get('location');
    const [userLong, userLat] = parseLocationParam(locationParam);
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 100; // Default 100 mile radius
    const maxDaysOld = searchParams.get('maxDaysOld') ? parseInt(searchParams.get('maxDaysOld')!, 10) : undefined; // Parameter for filtering events within next X days

    const now = new Date();
    // Calculate the future cutoff date if maxDaysOld is provided (today + maxDaysOld days)
    const futureCutoffDate = maxDaysOld !== undefined ? new Date(now.getTime() + maxDaysOld * 24 * 60 * 60 * 1000) : undefined;

    // First, check if we have recommendations for this user
    const recommendationsResult = await prisma.recommended_events.findFirst({
      where: {
        user_id: userId,
        event_ids: {
          path: ['$'],
          not: {}
        }
      }
    });

    let event = null;

    // First, check if we need to trigger new recommendations based on total count
    if (!recommendationsResult ||
      (recommendationsResult && (recommendationsResult.event_ids as any).length < 100)) {
      // Trigger recommendations asynchronously with location - don't await to avoid delaying the response
      triggerRecommendations(userId, userLat, userLong);
    }

    // If we have recommendations, use the first one
    if (recommendationsResult && (recommendationsResult.event_ids as any).length > 0) {
      const eventIds = recommendationsResult.event_ids as number[];

      // Get the first event ID from the recommendations
      const idToUse = eventIds[0];
      const remainingIds = eventIds.slice(1);

      // Update the recommendations table to remove the used ID
      await prisma.recommended_events.update({
        where: { id: recommendationsResult.id },
        data: {
          event_ids: remainingIds,
          last_updated: new Date()
        }
      });

      // Fetch the full event details for the recommended ID with distance filtering
      const recommendedEventQuery = Prisma.sql`
        WITH event_coords AS (
          SELECT
            e.id,
            e.eventvenuename,
            e.eventname,
            e.eventdescription,
            e.eventstartdatetime,
            e.imagedata,
            e.metadata,
            e.geolocation,
            e.createdat,
            -- Calculate distance in miles using the Haversine formula
            (
  3958.8 *
  CASE
    -- If coordinates are identical, return 0
    WHEN (e.geolocation->>1)::float = ${userLat} AND (e.geolocation->>0)::float = ${userLong} THEN 0
    ELSE
      acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${userLat})) *
          cos(radians((e.geolocation->>1)::float)) *
          cos(radians((e.geolocation->>0)::float) - radians(${userLong})) +
          sin(radians(${userLat})) *
          sin(radians((e.geolocation->>1)::float))
        ))
      )
  END
) AS distance
          FROM events e
          LEFT JOIN user_event_status ues ON e.id = ues.event_id AND ues.user_id = ${userId}
          WHERE
            e.id = ${idToUse} AND
            e.eventstartdatetime > ${now} AND
            ${futureCutoffDate ? Prisma.sql`e.eventstartdatetime <= ${futureCutoffDate} AND` : Prisma.sql``}
            e.geolocation IS NOT NULL AND
            e.geolocation != '{}' AND
            (ues.archived IS NULL OR ues.archived = false)
        )
        SELECT * FROM event_coords
        WHERE distance <= ${radius};
      `;

      // Execute the raw query
      const recommendedEvents = await prisma.$queryRaw<any[]>(recommendedEventQuery);

      // If we found an event within the radius, use it
      if (recommendedEvents.length > 0) {
        event = recommendedEvents[0];
      } else {
        // If no recommended events are within radius, check how many total events are within radius
        const countQuery = Prisma.sql`
          WITH event_coords AS (
            SELECT
              e.id,
              -- Calculate distance in miles using the Haversine formula
              (
  3958.8 *
  CASE
    -- If coordinates are identical, return 0
    WHEN (e.geolocation->>1)::float = ${userLat} AND (e.geolocation->>0)::float = ${userLong} THEN 0
    ELSE
      acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${userLat})) *
          cos(radians((e.geolocation->>1)::float)) *
          cos(radians((e.geolocation->>0)::float) - radians(${userLong})) +
          sin(radians(${userLat})) *
          sin(radians((e.geolocation->>1)::float))
        ))
      )
  END
) AS distance
            FROM events e
            WHERE
              e.eventstartdatetime > ${now} AND
              ${futureCutoffDate ? Prisma.sql`e.eventstartdatetime <= ${futureCutoffDate} AND` : Prisma.sql``}
              e.geolocation IS NOT NULL AND
              e.geolocation != '{}'
          )
          SELECT COUNT(*) as count
          FROM event_coords
          WHERE distance <= ${radius};
        `;

        // Execute the query
        const result = await prisma.$queryRaw<[{ count: number }]>(countQuery);
        const eventsInRadiusCount = parseInt(result[0].count.toString());

        // If there are fewer than 100 events in radius, trigger recommendations with location
        if (eventsInRadiusCount < 100) {
          // Trigger recommendations with location to get more relevant events
          triggerRecommendations(userId, userLat, userLong);
          console.log(`Only ${eventsInRadiusCount} events found within ${radius} miles radius. Triggered location-based recommendations.`);
        }
      }
    }

    // If we don't have a valid recommended event, fall back to random
    if (!event) {
      // Create a raw SQL query to filter by distance using PostgreSQL's Haversine formula
      const randomEventsQuery = Prisma.sql`
        WITH event_coords AS (
          SELECT
            e.id,
            e.eventvenuename,
            e.eventname,
            e.eventdescription,
            e.eventstartdatetime,
            e.imagedata,
            e.metadata,
            e.geolocation,
            e.createdat,
            -- Calculate distance in miles using the Haversine formula
            (
  3958.8 *
  CASE
    -- If coordinates are identical, return 0
    WHEN (e.geolocation->>1)::float = ${userLat} AND (e.geolocation->>0)::float = ${userLong} THEN 0
    ELSE
      acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${userLat})) *
          cos(radians((e.geolocation->>1)::float)) *
          cos(radians((e.geolocation->>0)::float) - radians(${userLong})) +
          sin(radians(${userLat})) *
          sin(radians((e.geolocation->>1)::float))
        ))
      )
  END
) AS distance
          FROM events e
          LEFT JOIN user_event_status ues ON e.id = ues.event_id AND ues.user_id = ${userId}
          WHERE
            e.eventstartdatetime > ${now} AND
            ${futureCutoffDate ? Prisma.sql`e.eventstartdatetime <= ${futureCutoffDate} AND` : Prisma.sql``}
            e.geolocation IS NOT NULL AND
            e.geolocation != '{}' AND
            (ues.archived IS NULL OR ues.archived = false)
        )
        SELECT * FROM event_coords
        WHERE distance <= ${radius}
        ORDER BY RANDOM()
        LIMIT 50;
      `;

      // Execute the raw query
      const randomEvents = await prisma.$queryRaw<any[]>(randomEventsQuery);

      if (randomEvents.length === 0) {
        return NextResponse.json({ message: "No events found within the specified radius!" });
      }

      // Select a random event from those within radius
      const randomIndex = Math.floor(Math.random() * randomEvents.length);
      event = randomEvents[randomIndex];
    }

    // Format the response
    if (event) {
      const imageData = event.imagedata as any;
      (event as any).imageUrl = imageData?.selectedImg || "";
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching random event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
