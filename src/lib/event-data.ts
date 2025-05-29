import { Category, FILTERS } from "@/store/services/events.api";


export interface DeckType {
  title:Category | FILTERS;
  coverImage: string;
  isCompleted?: boolean;
}


export const SAMPLE_DECKS: DeckType[] = [
  {
    title: "All",
    coverImage: "https://picsum.photos/seed/all-events/400/600",
  },
  {
    title: "This Weekend",
    coverImage: "https://picsum.photos/seed/weekend-events/400/600",

  },
  {
    title: "Next Week",
    coverImage: "https://picsum.photos/seed/next-week-events/400/600",

  },
  {
    title: "Corporate",
    coverImage: "https://picsum.photos/seed/corporate-events/400/600",

  },
  {
    title: "Sports",
    coverImage: "https://picsum.photos/seed/sports-events/400/600",

  },
  {
    title: "Music",
    coverImage: "https://picsum.photos/seed/music-events/400/600",

  },
  {
    title: "Family",
    coverImage: "https://picsum.photos/seed/family-events/400/600",

  },
  {
    title: "Arts & Entertainment",
    coverImage: "https://picsum.photos/seed/arts-events/400/600",

  },
  {
    title: "Festival",
    coverImage: "https://picsum.photos/seed/festival-events/400/600",

  },
  {
    title: "Food & Drink",
    coverImage: "https://picsum.photos/seed/food-events/400/600",

  },
  {
    title: "Other",
    coverImage: "https://picsum.photos/seed/other-events/400/600",
  }
];

