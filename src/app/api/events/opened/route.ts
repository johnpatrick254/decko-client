import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Missing event ID." }, { status: 400 });
    }
    
    const userId = request.headers.get('x-user-id') || 'default_user';
    const eventId = typeof id === 'string' ? parseInt(id, 10) : id;

    // Upsert the user_event_status record
    await prisma.user_event_status.upsert({
      where: {
        user_id_event_id: {
          user_id: userId,
          event_id: eventId
        }
      },
      update: {
        opened_count: { increment: 1 },
        last_interaction_date: new Date()
      },
      create: {
        user_id: userId,
        event_id: eventId,
        opened_count: 1,
        last_interaction_date: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording event open:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
