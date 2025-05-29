import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseLocationParam, triggerRecommendations } from '@/lib/eventHelpers';
import { Prisma } from '@prisma/client';
import { Category, FILTERS } from '@/store/services/events.api';

// Function to generate filter conditions for Prisma SQL
function generateEventFilterCondition(filter: FILTERS | Category): Prisma.Sql {

  const getCurrentWeekendDates = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    let startDate = new Date(now);
    let endDate = new Date(now);

    if (currentDay === 0) {
      // Today is Sunday - show events from now until end of Sunday
      startDate = new Date(now);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (currentDay === 6) {
      // Today is Saturday - show events from now until end of Sunday
      startDate = new Date(now);
      endDate = new Date(now);
      endDate.setDate(now.getDate() + 1); // Tomorrow (Sunday)
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Monday through Friday - show events from upcoming Saturday through Sunday
      const daysUntilSaturday = 6 - currentDay;

      startDate = new Date(now);
      startDate.setDate(now.getDate() + daysUntilSaturday);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1); // Sunday
      endDate.setHours(23, 59, 59, 999);
    }

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
  };

  const getNextWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay();

    const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay;

    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilNextMonday);
    nextMonday.setHours(0, 0, 0, 0);

    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);

    console.log('Next Week Debug:', {
      today: now.toISOString(),
      currentDay,
      daysUntilNextMonday,
      nextMonday: nextMonday.toISOString(),
      nextSunday: nextSunday.toISOString()
    });

    return {
      start: nextMonday.toISOString(),
      end: nextSunday.toISOString()
    };
  };

  switch (filter) {
    case "All":
      return Prisma.sql`TRUE`;

    case "This Weekend": {
      const weekend = getCurrentWeekendDates();
      // Cast the date strings to timestamptz to fix the type mismatch
      return Prisma.sql`e.eventstartdatetime >= ${weekend.start}::timestamptz AND e.eventstartdatetime <= ${weekend.end}::timestamptz`;
    }

    case "Next Week": {
      const nextWeek = getNextWeekDates();
      // Cast the date strings to timestamptz to fix the type mismatch
      return Prisma.sql`e.eventstartdatetime >= ${nextWeek.start}::timestamptz AND e.eventstartdatetime <= ${nextWeek.end}::timestamptz`;
    }

    // PostgreSQL JSON query syntax
    case "Corporate":
    case "Sports":
    case "Music":
    case "Arts & Entertainment":
    case "Food & Drink":
    case "Festival":
    case "Family":
    case "Other":
      return Prisma.sql`e.metadata->'eventTags'->'Categories' ? ${filter}`;

    default:
      return Prisma.sql`TRUE`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default_user';
    const searchParams = request.nextUrl.searchParams;
    const locationParam = searchParams.get('location');
    const [userLat, userLong] = parseLocationParam(locationParam);
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 100; // Default 100 mile radius
    const filter = (searchParams.get('filter') || 'All') as FILTERS | Category;

    const now = new Date();

    // Generate the filter condition
    const filterCondition = generateEventFilterCondition(filter);

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
      (recommendationsResult && (recommendationsResult.event_ids as any).length < 50)) {
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
            e.geolocation IS NOT NULL AND
            e.geolocation != '{}' AND
            (ues.archived IS NULL OR ues.archived = false) AND
            ${filterCondition}
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
              e.geolocation IS NOT NULL AND
              e.geolocation != '{}' AND
              ${filterCondition}
          )
          SELECT COUNT(*) as count
          FROM event_coords
          WHERE distance <= ${radius};
        `;

        // Execute the query
        const result = await prisma.$queryRaw<[{ count: number }]>(countQuery);
        const eventsInRadiusCount = parseInt(result[0].count.toString());

        // If there are fewer than 100 events in radius, trigger recommendations with location
        if (eventsInRadiusCount < 50) {
          // Trigger recommendations with location to get more relevant events
          triggerRecommendations(userId, userLat, userLong);
          console.log(`Only ${eventsInRadiusCount} events found within ${radius} miles radius with filter "${filter}". Triggered location-based recommendations.`);
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
            e.geolocation IS NOT NULL AND
            e.geolocation != '{}' AND
            (ues.archived IS NULL OR ues.archived = false) AND
            ${filterCondition}
        )
        SELECT * FROM event_coords
        WHERE distance <= ${radius}
        ORDER BY RANDOM()
        LIMIT 50;
      `;

      // Execute the raw query
      const randomEvents = await prisma.$queryRaw<any[]>(randomEventsQuery);

      if (randomEvents.length === 0) {
        return NextResponse.json({
          message: `No events found within the specified radius with filter "${filter}"!`
        });
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

    console.log(`Single event request completed with filter: ${filter}`);

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching random event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}