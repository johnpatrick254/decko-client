import { EventDetail } from "@/components/events/eventdetail";


export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const eventId = (await params).id;

    return <EventDetail eventId={eventId} />;
}

