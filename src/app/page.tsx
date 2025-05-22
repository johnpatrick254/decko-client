'use client'
import DeckCarousel from "@/components/deck-carousel";
import { SavedEvents } from "@/components/saved/savedevents";
import { SAMPLE_DECKS, SAVED_EVENTS } from "@/lib/event-data";
import { useState } from "react";

export default function Home() {
  const [decks] = useState(SAMPLE_DECKS);
  return (
    <div className="pt-14 px-4 flex-1">
      <section className="py-4 mx-auto w-full h-full max-w-7xl">
        <div className="w-full overflow-x-hidden">
        <DeckCarousel decks={decks} />
        </div>        
        <SavedEvents />
      </section>
    </div>
  );
}
