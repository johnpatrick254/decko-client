import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define the categories type from your TypeScript definitions
type Category = "Corporate" | "Sports" | "Music" | "Arts & Entertainment" | "Food & Drink" | "Festival" | "Family" | "Other";

// Valid categories for validation
const VALID_CATEGORIES: Category[] = [
  "Corporate",
  "Sports",
  "Music",
  "Arts & Entertainment",
  "Food & Drink",
  "Festival",
  "Family",
  "Other"
];

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default_user';
    const searchParams = request.nextUrl.searchParams;

    // Get filter parameters
    const categories = searchParams.getAll('category');
    const filterParam = searchParams.get('filter');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * pageSize;

    const allFilters = [
      ...categories,
      ...(filterParam ? [filterParam] : [])
    ];

    const validCategories = allFilters.filter((filter): filter is Category =>
      VALID_CATEGORIES.includes(filter as Category)
    );

    // Build the where clause - MAIN CRITERIA: ONLY SAVED EVENTS
    let whereClause: any = {
      user_id: userId,
      saved: true, // PRIMARY FILTER: Only return saved events
    };

    // Add category filtering if valid categories are provided
    if (validCategories.length > 0) {
      // Use Prisma's JSON filtering to check if any of the specified categories
      // are present in the metadata.eventTags.Categories array
      whereClause.events = {
        metadata: {
          path: ['eventTags', 'Categories'],
          array_contains: validCategories
        }
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.user_event_status.count({
      where: whereClause
    });

    // Get the paginated saved events with category filtering
    const historyEvents = await prisma.user_event_status.findMany({
      where: whereClause,
      select: {
        saved: true,
        archived: true,
        attending: true,
        last_interaction_date: true,
        events: {
          select: {
            id: true,
            eventvenuename: true,
            eventname: true,
            eventdescription: true,
            eventstartdatetime: true,
            imagedata: true,
            metadata: true,
            createdat: true,
            geolocation: true
          }
        }
      },
      orderBy: {
        last_interaction_date: 'desc'
      },
      take: pageSize,
      skip: offset
    });

    // Format the events for the response
    const events = historyEvents.map((historyEvent) => {
      const imagedata = historyEvent.events.imagedata as any;
      const metadata = historyEvent.events.metadata as any;

      return {
        ...historyEvent.events,
        imageUrl: imagedata?.selectedImg || "",
        saved: historyEvent.saved || false, // Will always be true due to our filter
        archived: historyEvent.archived || false,
        attending: historyEvent.attending || false,
        last_interaction_date: historyEvent.last_interaction_date,
        // Ensure metadata structure is consistent
        metadata: {
          ...metadata,
          eventTags: {
            Categories: metadata?.eventTags?.Categories || []
          }
        }
      };
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      events,
      pagination: {
        page,
        pageSize,
        totalEvents: totalCount,
        totalPages,
        hasMore: page < totalPages
      },
      // Include applied filters in response for debugging/frontend state
      appliedFilters: {
        categories: validCategories,
        invalidFilters: allFilters.filter(f => !VALID_CATEGORIES.includes(f as Category)),
        savedOnly: true // Indicate this endpoint only returns saved events
      }
    });
  } catch (error) {
    console.error("Error fetching history events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}