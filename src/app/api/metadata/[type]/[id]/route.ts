import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    try {
        const { type, id } = await params;
        const parsedId = parseInt(id, 10);

        if (isNaN(parsedId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        let metadata = {
            title: "Decko",
            description: "Your daily dose of events",
            image: "/favicon.ico",
            url: request.nextUrl.origin + request.nextUrl.pathname
        };

        if (type === 'event') {
            const event = await prisma.event.findUnique({
                where: { id: parsedId },
                select: {
                    id: true,
                    eventname: true,
                    eventdescription: true,
                    imagedata: true
                }
            });

            if (event) {
                // Extract image URL from imagedata if available
                let imageUrl = '/favicon.ico';
                if (event.imagedata && typeof event.imagedata === 'object') {
                    const imgData = event.imagedata as any;
                    if (imgData.selectedImg) {
                        imageUrl = imgData.selectedImg;
                    }
                }

                metadata = {
                    title: event.eventname || "Decko Event",
                    description: event.eventdescription || "Check out this event on Decko",
                    image: imageUrl,
                    url: request.nextUrl.origin + `/events/${id}`
                };
            }
        }

        return NextResponse.json(metadata);
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metadata' },
            { status: 500 }
        );
    }
}