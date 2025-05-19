import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const userId = request.headers.get('x-user-id') || 'default_user';

    // Get the event with user status information
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        eventvenuename: true,
        eventname: true,
        eventdescription: true,
        eventstartdatetime: true,
        imagedata: true,
        metadata: true,
        createdat: true,
        user_event_status: {
          where: { user_id: userId },
          select: {
            attending: true,
            saved: true,
            archived: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Format the response
    const userStatus = event.user_event_status[0] || { attending: false, saved: false, archived: false };
    const formattedEvent = {
      ...event,
      attending: userStatus.attending || false,
      saved: userStatus.saved || false,
      archived: userStatus.archived || false,
      imageUrl: (event.imagedata as any)?.selectedImg || "",
      user_event_status: undefined // Remove the nested user_event_status
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
