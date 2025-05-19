import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWeekDateRange } from '@/lib/eventHelpers';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default_user';
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const filter = searchParams.get('filter') || 'all'; // Can be "all" or "attending"
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0', 10);
    const { startOfWeek, endOfWeek } = getWeekDateRange(weekOffset);
    const offset = (page - 1) * pageSize;
    const currentDate = new Date(); // Get current date and time

    // Build the where clause based on the filter
    const whereClause = {
      user_id: userId,
      saved: true,
      ...(filter === 'attending' ? { attending: true } : {})
    };

    // Count total events matching the criteria
    const totalEvents = await prisma.user_event_status.count({
      where: {
        ...whereClause,
        events: {
          eventstartdatetime: {
            gte: currentDate,
            lte: endOfWeek
          }
        }
      }
    });

    // Get the paginated events
    const savedEvents = await prisma.user_event_status.findMany({
      where: {
        ...whereClause,
        events: {
          eventstartdatetime: {
            gte: currentDate,
            lte: endOfWeek
          }
        }
      },
      select: {
        attending: true,
        events: {
          select: {
            id: true,
            eventvenuename: true,
            eventname: true,
            eventdescription: true,
            eventstartdatetime: true,
            imagedata: true,
            createdat: true
          }
        }
      },
      orderBy: [
        { events: { createdat: 'asc' } },
        { last_interaction_date: 'desc' }
      ],
      take: pageSize,
      skip: offset
    });

    // Format the events for the response
    const events = savedEvents.map((savedEvent) => ({
      ...savedEvent.events,
      imageUrl: (savedEvent.events.imagedata as any)?.selectedImg || "",
      attending: savedEvent.attending || false
    }));

    return NextResponse.json({
      events,
      pagination: {
        total: totalEvents,
        page,
        pageSize,
        totalPages: Math.ceil(totalEvents / pageSize)
      },
      timeframe: {
        start: startOfWeek,
        end: endOfWeek,
        weekOffset
      },
      filter
    });
  } catch (error) {
    console.error("Error fetching saved events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
