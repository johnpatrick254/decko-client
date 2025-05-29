import { prisma } from '@/lib/prisma';

// Helper function to get date range for the week
export const getWeekDateRange = (weekOffset = 0) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + (weekOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start from Sunday

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

// Helper function to trigger recommendation with location filtering
export const triggerRecommendations = async (userId: string, userLat?: number, userLong?: number) => {
  try {
    // Build the URL with location parameters if provided
    let url = `https://reco-service-production.up.railway.app/trigger/${userId}?count=100&radius_miles=100&include_details=true`;

    // Add location parameters if available
    if (userLat !== undefined && userLong !== undefined) {
      url += `&lat=${userLat}&lng=${userLong}`;
    }

    await fetch(url);
    console.log(`Triggered recommendations for user ${userId}${userLat ? ` at location [${userLong},${userLat}]` : ''}`);
  } catch (error) {
    console.error(`Error triggering recommendations for user ${userId}:`, error);
  }
};

export const calculateDistance = (lon1: number, lat1: number, lon2: number, lat2: number): number => {
  // If coordinates are exactly identical, return 0
  if (lon1 === lon2 && lat1 === lat2) {
    return 0;
  }

  // Convert coordinates from degrees to radians
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // Clamp the value to the range [-1, 1] to prevent acos errors
  const c = 2 * Math.atan2(Math.sqrt(Math.min(a, 1)), Math.sqrt(Math.max(0, 1 - a)));
  const distance = R * c; // Distance in miles

  return distance;
};

// Helper function to parse location string from request
export const parseLocationParam = (locationParam?: string | string[] | null) => {
  try {
    if (!locationParam) {
      // Default to Fort Lauderdale coordinates if no location provided
      return [27.9575, -82.457603];
    }

    // Parse location from string format "[long,lat]"
    if (typeof locationParam === 'string') {
      // Remove brackets and split by comma
      const coords = locationParam.replace('[', '').replace(']', '').split(',');
      return [parseFloat(coords[1]), parseFloat(coords[0])];
    }

    // If it's already an array
    if (Array.isArray(locationParam)) {
      return [parseFloat(locationParam[1]), parseFloat(locationParam[0])];
    }

    // Default location if parsing fails
    return [27.9575, -82.457603];
  } catch (error) {
    console.error("Error parsing location parameter:", error);
    // Default to Fort Lauderdale coordinates if parsing fails
    return [27.9575, -82.457603];
  }
};

/**
 * Helper to update the interactions_count table
 * This keeps a summarized count of all interactions with an event across all users
 */
export async function updateInteractionsCount(eventId: number, actionType: 'SAVED' | 'ARCHIVED' | 'ATTENDING' | 'SHARED') {
  try {
    let columnName: string | null = null;

    switch (actionType) {
      case 'SAVED':
        columnName = 'saved_count';
        break;
      case 'ARCHIVED':
        columnName = 'archived_count';
        break;
      case 'ATTENDING':
        columnName = 'attended_count';
        break;
      case 'SHARED':
        columnName = 'shared_count';
        break;
      default:
        return; // No update needed for this action type
    }

    // Skip the operation if we have no column to update
    if (!columnName) {
      return;
    }

    // Check if a record exists for this event
    const interactionCount = await prisma.interactions_count.findUnique({
      where: { id: eventId }
    });

    if (interactionCount) {
      // Update existing record
      await prisma.interactions_count.update({
        where: { id: eventId },
        data: {
          [columnName]: { increment: 1 },
          last_updated: new Date()
        }
      });
    } else {
      // Create new record with the specific count column set to 1
      await prisma.interactions_count.create({
        data: {
          id: eventId,
          [columnName]: 1,
          last_updated: new Date()
        }
      });
    }
  } catch (error) {
    console.error(`Error updating interactions count (${actionType}):`, error);
    // Log error but don't fail the operation
  }
}

export type Category = "Corporate" | "Sports" | "Music" | "Arts & Entertainment" | "Food & Drink" | "Festival" | "Family" | "Other"
export type FILTERS = "All" | "This Weekend" | "Next Week"

export type Event = {
  id: number;
  eventname: string;
  eventvenuename: string;
  eventdescription: string;
  eventstartdatetime: string;
  city: string;
  state: string;
  imageUrl: string;
  geolocation: string[];
  imagedata: { selectedImg: string, alts: { choice: number, imgUrl: string }[] };
  metadata: { eventTags: { Categories: Category[] }, url: string, eventLongDescription: string, google_calendar_url: string, soldOut: boolean, address: string, price: string | null };
  createdat: string;
  attending?: boolean;
  saved?: boolean;
}




// Alternative version for different SQL databases:
export function generateEventFilterSQL(filter: FILTERS | Category): string {
  const getCurrentDate = () => new Date().toISOString().split('T')[0];

  const getCurrentWeekendDates = () => {
    const now = new Date();
    const currentDay = now.getDay();

    const daysUntilSaturday = currentDay === 0 ? 6 : 6 - currentDay;

    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    saturday.setHours(0, 0, 0, 0);

    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);

    return {
      start: saturday.toISOString(),
      end: sunday.toISOString()
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

    return {
      start: nextMonday.toISOString(),
      end: nextSunday.toISOString()
    };
  };

  switch (filter) {
    case "All":
      return "1=1";

    case "This Weekend": {
      const weekend = getCurrentWeekendDates();
      return `eventstartdatetime >= '${weekend.start}' AND eventstartdatetime <= '${weekend.end}'`;
    }

    case "Next Week": {
      const nextWeek = getNextWeekDates();
      return `eventstartdatetime >= '${nextWeek.start}' AND eventstartdatetime <= '${nextWeek.end}'`;
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
      return `metadata->'eventTags'->'Categories' ? '${filter}'`;

    default:
      return "1=1";
  }
}