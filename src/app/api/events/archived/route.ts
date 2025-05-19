import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default_user';
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const offset = (page - 1) * pageSize;
    
    // Count total archived events
    const totalEvents = await prisma.user_event_status.count({
      where: {
        user_id: userId,
        archived: true
      }
    });

    // Get the paginated archived events
    const archivedEvents = await prisma.user_event_status.findMany({
      where: {
        user_id: userId,
        archived: true
      },
      select: {
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
      orderBy: {
        last_interaction_date: 'desc'
      },
      take: pageSize,
      skip: offset
    });

    // Format the events for the response
    const events = archivedEvents.map((archivedEvent) => ({
      ...archivedEvent.events,
      imageUrl: (archivedEvent.events.imagedata as any)?.selectedImg || ""
    }));

    return NextResponse.json({
      events,
      pagination: {
        total: totalEvents,
        page,
        pageSize,
        totalPages: Math.ceil(totalEvents / pageSize)
      }
    });
  } catch (error) {
    console.error("Error fetching archived events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
