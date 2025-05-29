import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const { id: eventId } = params;

    try {
        // Get userId from headers (matching your other endpoints)
        const userId = req.headers.get('x-user-id') || 'default_user';

        // Validate required parameters
        if (!eventId) {
            return NextResponse.json({
                error: 'Missing required parameters',
                details: 'eventId is required'
            }, { status: 400 });
        }

        const eventIdNum = parseInt(eventId, 10);
        if (isNaN(eventIdNum)) {
            return NextResponse.json({
                error: 'Invalid eventId',
                details: 'eventId must be a valid number'
            }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Check if the event exists
            const event = await tx.event.findUnique({
                where: { id: eventIdNum }
            });

            if (!event) {
                throw new Error('EVENT_NOT_FOUND');
            }

            // Find existing status using findFirst instead of findUnique to avoid constraint issues
            const existingStatus = await tx.user_event_status.findFirst({
                where: {
                    user_id: userId,
                    event_id: eventIdNum
                }
            });

            // If no status record exists, create one with saved: false
            if (!existingStatus) {
                const newStatus = await tx.user_event_status.create({
                    data: {
                        user_id: userId,
                        event_id: eventIdNum,
                        saved: false,
                        saved_count: 0,
                        last_interaction_date: new Date()
                    }
                });

                // Log the action
                await tx.user_event_actions.create({
                    data: {
                        user_id: userId,
                        event_id: eventIdNum,
                        action_type: 'unsaved',
                        created_at: new Date()
                    }
                });

                return newStatus;
            }

            // If event is already not saved, just return current status
            if (!existingStatus.saved) {
                return existingStatus;
            }

            // Update user_event_status to unsave
            const updatedStatus = await tx.user_event_status.update({
                where: {
                    id: existingStatus.id // Use the primary key instead of composite unique
                },
                data: {
                    saved: false,
                    saved_count: Math.max(0, (existingStatus.saved_count || 0) - 1),
                    last_interaction_date: new Date()
                }
            });

            // Update interactions_count
            await tx.interactions_count.upsert({
                where: { id: eventIdNum },
                update: {
                    saved_count: {
                        decrement: 1
                    },
                    last_updated: new Date()
                },
                create: {
                    id: eventIdNum,
                    saved_count: 0,
                    shared_count: 0,
                    attended_count: 0,
                    archived_count: 0,
                    last_updated: new Date()
                }
            });

            // Log the action
            await tx.user_event_actions.create({
                data: {
                    user_id: userId,
                    event_id: eventIdNum,
                    action_type: 'unsaved',
                    created_at: new Date()
                }
            });

            return updatedStatus;
        });

        return NextResponse.json({
            success: true,
            message: 'Event unsaved successfully',
            data: {
                eventId: eventIdNum,
                userId: userId,
                saved: false,
                lastInteractionDate: result.last_interaction_date
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error unsaving event:', error);

        if (error instanceof Error) {
            switch (error.message) {
                case 'EVENT_NOT_FOUND':
                    return NextResponse.json({
                        error: 'Event not found',
                        details: `Event with id ${eventId} does not exist`
                    }, { status: 404 });
                default:
                    return NextResponse.json({
                        error: 'Internal server error',
                        details: 'An error occurred while unsaving the event'
                    }, { status: 500 });
            }
        }

        return NextResponse.json({
            error: 'Internal server error',
            details: 'An unexpected error occurred'
        }, { status: 500 });
    }
}