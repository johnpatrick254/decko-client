import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateInteractionsCount } from '@/lib/eventHelpers';

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

    // Get the attending status for this event
    const status = await prisma.user_event_status.findUnique({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: eventId
        }
      },
      select: {
        attending: true
      }
    });

    return NextResponse.json({
      success: true,
      attending: status?.attending || false
    });
  } catch (error) {
    console.error("Error fetching attending status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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

    // Check if a user_event_status record already exists and get current attending status
    const existingStatus = await prisma.user_event_status.findUnique({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: eventId
        }
      },
      select: {
        attending: true
      }
    });

    // Toggle the attending status
    const newAttendingValue = existingStatus ? !(existingStatus.attending || false) : true;

    // Upsert the user_event_status record
    await prisma.user_event_status.upsert({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: eventId
        }
      },
      update: {
        attending: newAttendingValue,
        last_interaction_date: new Date()
      },
      create: {
        user_id: userId,
        event_id: eventId,
        attending: newAttendingValue,
        last_interaction_date: new Date()
      }
    });

    // Log the action if attending was set to true
    if (newAttendingValue) {
      try {
        // Add to user_event_actions
        await prisma.user_event_actions.create({
          data: {
            user_id: userId,
            event_id: eventId,
            action_type: 'ATTENDING'
          }
        });

        // Update global interactions counter
        await updateInteractionsCount(eventId, 'ATTENDING');
      } catch (logError) {
        console.error("Error logging attending action:", logError);
        // Continue even if logging fails
      }
    }

    return NextResponse.json({ success: true, attending: newAttendingValue });
  } catch (error) {
    console.error("Error toggling event attending status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
