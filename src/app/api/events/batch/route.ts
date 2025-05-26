import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseLocationParam, triggerRecommendations } from '@/lib/eventHelpers';
import { Prisma } from '@prisma/client';

// Cache for event counts by location radius
const eventCountCache = new Map<string, { count: number, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to trigger recommendations in the background without awaiting
function triggerRecommendationsAsync(userId: string, userLat?: number, userLong?: number) {
  // Use setTimeout with 0ms to push this to the next event loop iteration
  setTimeout(() => {
    triggerRecommendations(userId, userLat, userLong)
      .catch(err => console.error('Background recommendation trigger failed:', err));
  }, 0);
}

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const locationParam = searchParams.get('location');
    const [userLong, userLat] = parseLocationParam(locationParam);
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 100; // Default 100 mile radius
    const maxDaysOld = searchParams.get('maxDaysOld') ? parseInt(searchParams.get('maxDaysOld')!, 10) : undefined; // Parameter for filtering events within next X days

    const today = new Date();
    // Calculate the future cutoff date if maxDaysOld is provided (today + maxDaysOld days)
    const futureCutoffDate = maxDaysOld !== undefined ? new Date(today.getTime() + maxDaysOld * 24 * 60 * 60 * 1000) : undefined;
    const userId = request.headers.get('x-user-id') || 'default_user';

    // Create a location key for caching
    const locationKey = `${userLat.toFixed(4)},${userLong.toFixed(4)},${radius}`;

    let events: any[] = [];
    let needsRecommendations = false;
    let recommendationsResult;
    let updatePromise: Promise<any> = Promise.resolve(); // Default empty promise

    // Parallel query to check for recommendations
    const recommendationsPromise = prisma.recommended_events.findFirst({
      where: {
        user_id: userId,
        event_ids: {
          path: ['$'],
          not: {}
        }
      }
    });

    // Check if we have a cached count for this location
    const cachedCount = eventCountCache.get(locationKey);
    let eventsInRadiusCount = 0;

    // If we don't have a valid cache entry, we'll need to check the count later
    const needsCountCheck = !cachedCount || (Date.now() - cachedCount.timestamp > CACHE_TTL);

    // If we have a valid cache entry and it shows fewer than 100 events, trigger recommendations
    if (cachedCount && cachedCount.count < 50) {
      needsRecommendations = true;
      triggerRecommendationsAsync(userId, userLat, userLong);
    }

    // Wait for the recommendations query to complete
    recommendationsResult = await recommendationsPromise;

    // Check if we need to trigger recommendations based on recommendation count
    if (!recommendationsResult ||
      (recommendationsResult && (recommendationsResult.event_ids as any).length < 50)) {
      needsRecommendations = true;
      triggerRecommendationsAsync(userId, userLat, userLong);
    }

    // If we have recommendations, use them
    if (recommendationsResult && (recommendationsResult.event_ids as any).length > 0) {
      const eventIds = recommendationsResult.event_ids as number[];

      // Get up to 'limit' event IDs from the recommendations
      const idsToUse = eventIds.slice(0, limit);
      const remainingIds = eventIds.slice(limit);

      // Start the update operation but don't await it yet
      updatePromise = prisma.recommended_events.update({
        where: { id: recommendationsResult.id },
        data: {
          event_ids: remainingIds,
          last_updated: new Date()
        }
      });

      // Fetch the full event details for the recommended IDs with distance filtering
      if (idsToUse.length > 0) {
        // Optimized query with only necessary fields and simplified distance calculation
        const recommendedEventsQuery = Prisma.sql`
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
          e.id IN (${Prisma.join(idsToUse)}) AND
          e.eventstartdatetime > ${today} AND
          ${futureCutoffDate ? Prisma.sql`e.eventstartdatetime <= ${futureCutoffDate} AND` : Prisma.sql``}
          e.geolocation IS NOT NULL AND
          (ues.archived IS NULL OR ues.archived = false) AND
          (ues.saved IS NULL OR ues.saved = false)
          )
          SELECT
          id,
          eventvenuename,
          eventname,
          eventdescription,
          eventstartdatetime,
          imagedata,
          createdat,
          distance
          FROM event_coords
          WHERE distance <= ${radius}
          ORDER BY id ASC;
        `;

        // Execute the raw query
        const recommendedEvents = await prisma.$queryRaw<any[]>(recommendedEventsQuery);

        // Add the events to our results
        events = recommendedEvents;

        // If we have fewer recommended events within radius than requested and need to check count
        if (events.length < idsToUse.length && needsCountCheck) {
          // Use a simpler, faster count query
          const countQuery = Prisma.sql`
            SELECT COUNT(*) as count
            FROM events e
            WHERE
              e.eventstartdatetime > ${today} AND
              ${futureCutoffDate ? Prisma.sql`e.eventstartdatetime <= ${futureCutoffDate} AND` : Prisma.sql``}
              e.geolocation IS NOT NULL AND
              (
                3958.8 * acos(
                  cos(radians(${userLat})) *
                  cos(radians((e.geolocation->>1)::float)) *
                  cos(radians((e.geolocation->>0)::float) - radians(${userLong})) +
                  sin(radians(${userLat})) *
                  sin(radians((e.geolocation->>1)::float))
                )
              ) <= ${radius};
          `;

          // Execute the query
          const result = await prisma.$queryRaw<[{ count: number }]>(countQuery);
          eventsInRadiusCount = parseInt(result[0].count.toString());

          // Update the cache
          eventCountCache.set(locationKey, {
            count: eventsInRadiusCount,
            timestamp: Date.now()
          });

          // If there are fewer than 100 events in radius, trigger recommendations with location
          if (eventsInRadiusCount < 100) {
            needsRecommendations = true;
          }
        }
      }
    }

    // If we don't have enough recommended events, fall back to random events
    if (events.length < limit) {
      const additionalLimit = limit - events.length;

      // Get IDs of events we already have to exclude them
      const existingIds = events.map(event => event.id);

      // Optimized query with only necessary fields
      const randomEventsQuery = Prisma.sql`
          WITH event_coords AS (
            SELECT
              e.id,
              e.eventvenuename,
              e.eventname,
              e.eventdescription,
              e.eventstartdatetime,
              e.imagedata,
              e.createdat,
              e.metadata,
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
              e.eventstartdatetime > ${today} AND
              ${futureCutoffDate ? Prisma.sql`e.eventstartdatetime <= ${futureCutoffDate} AND` : Prisma.sql``}
              e.geolocation IS NOT NULL AND
              (ues.archived IS NULL OR ues.archived = false) AND
              (ues.saved IS NULL OR ues.saved = false) AND
              ${existingIds.length > 0 ? Prisma.sql`e.id NOT IN (${Prisma.join(existingIds)})` : Prisma.sql`TRUE`}
          )
          SELECT
            id,
            eventvenuename,
            eventname,
            eventdescription,
            eventstartdatetime,
            imagedata,
            createdat,
            distance,
            metadata
          FROM event_coords
          WHERE distance <= ${radius}
          ORDER BY RANDOM()
          LIMIT ${additionalLimit};
      `;

      // Execute the raw query
      const randomEvents = await prisma.$queryRaw<any[]>(randomEventsQuery);

      // Add the events to our results
      events = [...events, ...randomEvents];

      // If we still don't have enough events, it might indicate a location with few events
      if (events.length < limit && randomEvents.length < additionalLimit) {
        needsRecommendations = true;
      }
    }

    // Now await the update promise to ensure it completes
    await updatePromise;

    // If we determined we need recommendations, trigger them now
    if (needsRecommendations) {
      triggerRecommendationsAsync(userId, userLat, userLong);
      console.log(`Triggered location-based recommendations for user ${userId} at [${userLong}, ${userLat}]`);
    }

    // Format the response - optimize by directly extracting the image URL
    const formattedEvents = events.map((event) => ({
      ...event,
      imageUrl: event.imagedata?.selectedImg || ""
    }));

    const endTime = Date.now();
    console.log(`Batch events request completed in ${endTime - startTime}ms`);

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching event batch:", error);
    return NextResponse.json({
      message: "Internal server error",
      errorMessage: (error as Error).message,
      stack: process.env.NODE_ENV === "production" ? undefined : (error as Error).stack,
    }, { status: 500 });
  }
}
