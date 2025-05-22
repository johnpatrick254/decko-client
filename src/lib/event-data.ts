export interface EventType {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl: string;
  price?: string;
  distance?: string;
  tags?: string[];
}

export interface DeckType {
  id: string;
  title: string;
  coverImage: string;
  events: EventType[];
  isCompleted?: boolean;
}

export const SAMPLE_EVENTS: EventType[] = [
  {
    id: "1",
    title: "Summer Music Festival",
    date: "Sat, Jul 15 • 7:00 PM",
    location: "Central Park, New York",
    imageUrl: "https://picsum.photos/seed/music-festival/800/600",
    price: "$45",
    distance: "2.5 miles",
    tags: ["Music", "Outdoor", "Festival"],
  },
  {
    id: "2",
    title: "Art Exhibition Opening",
    date: "Sun, Jul 16 • 2:00 PM",
    location: "Modern Art Museum, New York",
    imageUrl: "https://picsum.photos/seed/art-exhibition/800/600",
    price: "Free",
    distance: "1.2 miles",
    tags: ["Art", "Indoor", "Opening"],
  },
  {
    id: "3",
    title: "Food Truck Festival",
    date: "Sat, Jul 22 • 12:00 PM",
    location: "Riverside Park, New York",
    imageUrl: "https://picsum.photos/seed/food-truck/800/600",
    price: "$10",
    distance: "3.0 miles",
    tags: ["Food", "Outdoor", "Festival"],
  },
  {
    id: "4",
    title: "Family Fun Day",
    date: "Sun, Jul 23 • 10:00 AM",
    location: "Children's Museum, New York",
    imageUrl: "https://picsum.photos/seed/family-fun/800/600",
    price: "$15",
    distance: "1.8 miles",
    tags: ["Family", "Indoor", "Kids"],
  },
  {
    id: "5",
    title: "Jazz Night",
    date: "Wed, Jul 19 • 8:00 PM",
    location: "Blue Note Jazz Club, New York",
    imageUrl: "https://picsum.photos/seed/jazz-night/800/600",
    price: "$30",
    distance: "0.5 miles",
    tags: ["Music", "Jazz", "Nightlife"],
  },
  {
    id: "6",
    title: "Comedy Show",
    date: "Thu, Jul 20 • 9:00 PM",
    location: "Comedy Cellar, New York",
    imageUrl: "https://picsum.photos/seed/comedy-show/800/600",
    price: "$25",
    distance: "1.0 miles",
    tags: ["Comedy", "Nightlife", "Indoor"],
  },
  {
    id: "7",
    title: "Farmers Market",
    date: "Sat, Jul 15 • 8:00 AM",
    location: "Union Square, New York",
    imageUrl: "https://picsum.photos/seed/farmers-market/800/600",
    price: "Free",
    distance: "0.7 miles",
    tags: ["Food", "Shopping", "Outdoor"],
  },
  {
    id: "8",
    title: "Yoga in the Park",
    date: "Sun, Jul 16 • 9:00 AM",
    location: "Washington Square Park, New York",
    imageUrl: "https://picsum.photos/seed/yoga-park/800/600",
    price: "$5",
    distance: "0.3 miles",
    tags: ["Fitness", "Outdoor", "Wellness"],
  },
];


// Enhanced sample decks based on all filter categories
export const SAMPLE_DECKS: DeckType[] = [
  {
    id: "all",
    title: "All Events",
    coverImage: "https://picsum.photos/seed/all-events/400/600",
    events: SAMPLE_EVENTS,
  },
  {
    id: "weekend",
    title: "This Weekend",
    coverImage: "https://picsum.photos/seed/weekend-events/400/600",
    events: SAMPLE_EVENTS.filter(
      (event) => event.tags?.includes("This Weekend")
    ),
  },
  {
    id: "next-week",
    title: "Next Week",
    coverImage: "https://picsum.photos/seed/next-week-events/400/600",
    events: SAMPLE_EVENTS.filter(
      (event) => event.tags?.includes("Next Week")
    ),
  },
  {
    id: "corporate",
    title: "Corporate",
    coverImage: "https://picsum.photos/seed/corporate-events/400/600",
    events: SAMPLE_EVENTS.filter(
      (event) => event.tags?.includes("Corporate")
    ),
  },
  {
    id: "sports",
    title: "Sports",
    coverImage: "https://picsum.photos/seed/sports-events/400/600",
    events: SAMPLE_EVENTS.filter(
      (event) => event.tags?.includes("Sports")
    ),
  },
  {
    id: "music",
    title: "Live Music",
    coverImage: "https://picsum.photos/seed/music-events/400/600",
    events: SAMPLE_EVENTS.filter(
      (event) => event.tags?.includes("Music")
    ),
  },
  {
    id: "family",
    title: "Family Events",
    coverImage: "https://picsum.photos/seed/family-events/400/600",
    events: SAMPLE_EVENTS.filter(
      (event) => event.tags?.includes("Family") || event.tags?.includes("Kids")
    ),
  },
  {
    id: "arts",
    title: "Arts & Entertainment",
    coverImage: "https://picsum.photos/seed/arts-events/400/600",
    events: SAMPLE_EVENTS.filter(
      (event) => event.tags?.includes("Arts & Entertainment")
    ),
  },
  {
    id: "festival",
    title: "Festivals",
    coverImage: "https://picsum.photos/seed/festival-events/400/600",
    events: SAMPLE_EVENTS.filter(
      (event) => event.tags?.includes("Festival")
    ),
  },
  {
    id: "food",
    title: "Food & Drink",
    coverImage: "https://picsum.photos/seed/food-events/400/600",
    events: SAMPLE_EVENTS.filter(
      (event) => event.tags?.includes("Food & Drink")
    ),
  },
  {
    id: "other",
    title: "Other Events",
    coverImage: "https://picsum.photos/seed/other-events/400/600",
    events: SAMPLE_EVENTS.filter(
      (event) => event.tags?.includes("Other")
    ),
  },
  {
    id: "popular",
    title: "Popular Today",
    coverImage: "https://picsum.photos/seed/popular-events/400/600",
    events: [SAMPLE_EVENTS[1], SAMPLE_EVENTS[9], SAMPLE_EVENTS[12]],
    isCompleted: true,
  },
];

export const SAVED_EVENTS: EventType[] = SAMPLE_EVENTS.slice(0, 3);
