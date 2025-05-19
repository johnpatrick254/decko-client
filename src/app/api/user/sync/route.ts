'use server'
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const body = await request.json();

    if (!body?.localId || !body.authId) {
        return NextResponse.json({
            success: false,
            message: 'Both localId and authId are required',
            error: 'Missing required IDs'
        }, { status: 400 })
    };

    const { authId, localId } = body;
    const syncStatus = await prisma.user.findUnique({
        where: { id: authId },
        select: { synced: true }
    });

    if (syncStatus && !syncStatus.synced) {
        try {
            // Use a transaction to ensure all updates succeed or fail together
            await prisma.$transaction(async (tx) => {
                // Sync user event actions
                await tx.user_event_actions.updateMany({
                    where: { user_id: localId },
                    data: { user_id: authId }
                });

                // Sync user event status
                await tx.user_event_status.updateMany({
                    where: { user_id: localId },
                    data: { user_id: authId }
                });


                // Mark user as synced
                await tx.user.update({
                    where: { id: authId },
                    data: { synced: true }
                });
            });

            console.log('Successfully synced all user data from localId:', localId, 'to authId:', authId);
            return NextResponse.json({
                success: true,
                message: 'User data sync successful',
                syncedFrom: localId,
                syncedTo: authId
            });

        } catch (error) {
            console.error('Error syncing user:', error);
            return NextResponse.json({
                success: false,
                message: 'Failed to sync user data',
                error: String(error),
                syncedFrom: localId,
                syncedTo: authId
            }, { status: 500 });
        }
    };

    return NextResponse.json({
        success: true,
        message: 'User already synced',
        syncedFrom: localId,
        syncedTo: authId
    });
}