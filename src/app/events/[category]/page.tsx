
import { EventPage } from '@/components/events/eventsPage';
import { generateMetadata } from './metadata';
import { Category, FILTERS } from '@/store/services/events.api';


export { generateMetadata };

export default async function Page({params}:{params:Promise<{category:FILTERS | Category}>}) {
    const filter = (await params).category
    return <EventPage filter={filter} />;
}