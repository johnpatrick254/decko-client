'use client'
import DeckCarousel from "@/components/deck-carousel";
import { SavedEvents } from "@/components/saved/savedevents";
import { SAMPLE_DECKS } from "@/lib/event-data";

export default function Home() {
  return (
    <div className="pt-14 px-4 flex-1">
      <section className="py-4 mx-auto w-full h-full max-w-7xl">
        <div className="w-full overflow-x-hidden">
          <DeckCarousel decks={SAMPLE_DECKS} />
        </div>        
        <SavedEvents />
      </section>
    </div>
  );
}
