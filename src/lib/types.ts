export const MAX_TRIP_DAYS = 10;

export function tripLengthDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.floor((end - start) / 86_400_000) + 1;
}

export type StaysTier = "budget" | "standard" | "comfort" | "luxury";

export const STAYS_TIERS: Array<{
  id: StaysTier;
  label: string;
  tagline: string;
  description: string;
  examples: string;
  prices: string;
}> = [
  {
    id: "budget",
    label: "Budget",
    tagline: "Get the basics right, save the cash for everything else.",
    description: "Hostels (private rooms), guesthouses, family-run B&Bs, budget chains. Clean, wifi, walkable — no frills.",
    examples: "Generator hostels, family guesthouses, Holiday Inn Express.",
    prices: "~$25–80 SE Asia · $30–80 S. America · $80–150 W. Europe · $100–180 US",
  },
  {
    id: "standard",
    label: "Standard",
    tagline: "Comfortable and reliable, gets you a good night's sleep.",
    description: "3-star hotels, mid-range Airbnbs, well-reviewed B&Bs. Predictable quality, decent location, sometimes a pool or gym.",
    examples: "Hilton Garden Inn, ibis Styles, AC Hotels, solid mid-tier Airbnbs.",
    prices: "~$50–150 SE Asia · $60–150 S. America · $150–250 W. Europe · $200–350 US",
  },
  {
    id: "comfort",
    label: "Comfort",
    tagline: "A place worth coming back to — design, location, character.",
    description: "4-star, boutique hotels, design-forward Airbnbs, curated B&Bs. Thoughtful interiors, walkable neighborhoods, great rooftop/breakfast.",
    examples: "Ace Hotel, citizenM, The Hoxton, The Standard.",
    prices: "~$100–250 SE Asia · $120–280 S. America · $250–400 W. Europe · $350–550 US",
  },
  {
    id: "luxury",
    label: "Luxury",
    tagline: "Splurge — the property is part of the trip.",
    description: "5-star, luxury resorts, design hotels, top-end Airbnbs. Service, amenities, often destinations themselves.",
    examples: "Aman, Six Senses, Ritz-Carlton, Rosewood, Airbnb Luxe.",
    prices: "~$250–500 SE Asia · $300–600 S. America · $500–900 W. Europe · $700–1500 US",
  },
];

export type Profile = {
  name?: string;
  homeAirport: string;
  stays: {
    style: string;
    avoid: string;
    tierSolo: StaysTier;
    tierFamily: StaysTier;
    regionalAdjustments: string;
  };
  food: {
    style: string;
    dietary: string;
    avoid: string;
  };
  pace: "packed" | "balanced" | "slow";
  soloMode: string;
  familyMode: string;
  freeform: string;
};

export type TripRequest = {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  mode: "solo" | "family" | "couple" | "friends";
  notes?: string;
};

export type FlightOption = {
  airline: string;
  price: string;
  duration: string;
  stops: number;
  departure: string;
  arrival: string;
  bookingLink: string;
};

export type AccommodationOption = {
  name: string;
  style: string;
  pricePerNight: string;
  whyItFits: string;
  bookingLink: string;
};

export type ItineraryDay = {
  date: string;
  title: string;
  activities: { time: string; description: string; tip?: string }[];
  meals: { meal: string; suggestion: string; why: string }[];
};

export type BudgetSummary = {
  flights: string;
  accommodation: string;
  foodAndActivities: string;
  estimatedTotal: string;
  notes?: string;
};

export type TripPlan = {
  destination: string;
  summary: string;
  budgetSummary: BudgetSummary;
  flights: FlightOption[];
  accommodations: AccommodationOption[];
  localTransport: string;
  itinerary: ItineraryDay[];
  packingList: { category: string; items: string[] }[];
  weatherSummary: string;
};

export const DEFAULT_PROFILE: Profile = {
  name: "",
  homeAirport: "",
  stays: {
    style: "",
    avoid: "",
    tierSolo: "comfort",
    tierFamily: "standard",
    regionalAdjustments: "",
  },
  food: {
    style: "",
    dietary: "",
    avoid: "",
  },
  pace: "balanced",
  soloMode: "",
  familyMode: "",
  freeform: "",
};
