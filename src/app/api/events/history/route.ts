import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default_user';
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    // Use a larger page size (20) by default for better infinite scroll experience
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const offset = (page - 1) * pageSize;

    // Count total events the user has interacted with
    const totalEvents = await prisma.user_event_status.count({
      where: {
        user_id: userId,
        // We want all events the user has interacted with
        // This includes both saved and archived events
      }
    });

    // Get the paginated history events
    const historyEvents = await prisma.user_event_status.findMany({
      where: {
        user_id: userId,
        // No additional filters - we want all events the user has interacted with
      },
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
            createdat: true
          }
        }
      },
      orderBy: {
        last_interaction_date: 'desc' // Most recent interactions first
      },
      take: pageSize,
      skip: offset
    });

    // Format the events for the response
    const events = historyEvents.map((historyEvent) => ({
      ...historyEvent.events,
      imageUrl: (historyEvent.events.imagedata as any)?.selectedImg || "",
      saved: historyEvent.saved || false,
      archived: historyEvent.archived || false,
      attending: historyEvent.attending || false,
      last_interaction_date: historyEvent.last_interaction_date
    }));

    return NextResponse.json({
      events,
      pagination: {
        total: totalEvents,
        page,
        pageSize,
        totalPages: Math.ceil(totalEvents / pageSize),
        hasMore: page < Math.ceil(totalEvents / pageSize)
      }
    });
  } catch (error) {
    console.error("Error fetching history events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
