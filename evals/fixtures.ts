import type { Profile, TripRequest } from "@/lib/types";

export type Fixture = {
  id: string;
  label: string;
  profile: Profile;
  request: TripRequest;
};

export type RefinementFixture = {
  id: string;
  label: string;
  profile: Profile;
  request: TripRequest;
  tweak: string;
};

export const GENERATION_FIXTURES: Fixture[] = [
  {
    id: "budget-solo-tokyo",
    label: "Budget solo / Tokyo 3 days",
    profile: {
      homeAirport: "LAX",
      stays: {
        style: "Clean and central, don't care about amenities",
        avoid: "Party hostels",
        tierSolo: "budget",
        tierFamily: "standard",
        regionalAdjustments: "",
      },
      food: { style: "Local street food, ramen, izakayas", dietary: "", avoid: "Fine dining" },
      pace: "packed",
      soloMode: "Explore neighborhoods on foot, museums, people-watching",
      familyMode: "",
      freeform: "",
    },
    request: {
      destination: "Tokyo, Japan",
      startDate: "2026-09-01",
      endDate: "2026-09-03",
      travelers: 1,
      mode: "solo",
    },
  },
  {
    id: "luxury-couple-paris",
    label: "Luxury couple / Paris 5 days",
    profile: {
      homeAirport: "JFK",
      stays: {
        style: "Design hotels, boutique, great location",
        avoid: "Chain hotels, anything near airports",
        tierSolo: "luxury",
        tierFamily: "luxury",
        regionalAdjustments: "",
      },
      food: { style: "Bistros, wine bars, tasting menus", dietary: "", avoid: "Fast food" },
      pace: "balanced",
      soloMode: "",
      familyMode: "",
      freeform: "We celebrate anniversaries in style. Wine is always important.",
    },
    request: {
      destination: "Paris, France",
      startDate: "2026-10-05",
      endDate: "2026-10-09",
      travelers: 2,
      mode: "couple",
    },
  },
  {
    id: "standard-family-bali",
    label: "Standard family / Bali 7 days (vegetarian)",
    profile: {
      homeAirport: "SYD",
      stays: {
        style: "Villas with pools, family-friendly resorts",
        avoid: "Party areas like Kuta",
        tierSolo: "comfort",
        tierFamily: "standard",
        regionalAdjustments: "",
      },
      food: { style: "Fresh, local, healthy", dietary: "Vegetarian", avoid: "Meat, fish" },
      pace: "slow",
      soloMode: "",
      familyMode: "2 kids aged 6 and 9. Need kid-friendly activities. Early dinners.",
      freeform: "",
    },
    request: {
      destination: "Bali, Indonesia",
      startDate: "2026-07-10",
      endDate: "2026-07-16",
      travelers: 4,
      mode: "family",
    },
  },
  {
    id: "comfort-friends-nyc",
    label: "Comfort group of friends / NYC 4 days",
    profile: {
      homeAirport: "ORD",
      stays: {
        style: "Hip neighborhoods, walkable, good common areas",
        avoid: "Times Square, tourist traps",
        tierSolo: "comfort",
        tierFamily: "comfort",
        regionalAdjustments: "",
      },
      food: { style: "Trendy spots, cocktail bars, brunch", dietary: "", avoid: "" },
      pace: "packed",
      soloMode: "",
      familyMode: "",
      freeform: "Group of 4 friends, late 20s. We want to do the city properly.",
    },
    request: {
      destination: "New York City, USA",
      startDate: "2026-08-15",
      endDate: "2026-08-18",
      travelers: 4,
      mode: "friends",
    },
  },
  {
    id: "budget-solo-barcelona",
    label: "Budget solo / Barcelona 5 days (slow pace)",
    profile: {
      homeAirport: "LHR",
      stays: {
        style: "Guesthouses and local B&Bs",
        avoid: "Big chain hotels",
        tierSolo: "budget",
        tierFamily: "budget",
        regionalAdjustments: "",
      },
      food: { style: "Tapas bars, markets, local haunts", dietary: "", avoid: "" },
      pace: "slow",
      soloMode: "I like wandering without a plan, reading in cafes, sketching",
      familyMode: "",
      freeform: "",
    },
    request: {
      destination: "Barcelona, Spain",
      startDate: "2026-09-20",
      endDate: "2026-09-24",
      travelers: 1,
      mode: "solo",
    },
  },
  {
    id: "comfort-family-costa-rica",
    label: "Comfort family / Costa Rica 6 days",
    profile: {
      homeAirport: "MIA",
      stays: {
        style: "Eco-lodges, nature retreats, pool a must",
        avoid: "All-inclusive resorts",
        tierSolo: "comfort",
        tierFamily: "comfort",
        regionalAdjustments: "",
      },
      food: { style: "Fresh local food, gallo pinto, ceviche", dietary: "One nut allergy", avoid: "Nuts" },
      pace: "balanced",
      soloMode: "",
      familyMode: "Kids aged 8 and 12. Love wildlife and outdoor activities.",
      freeform: "",
    },
    request: {
      destination: "Costa Rica",
      startDate: "2026-11-01",
      endDate: "2026-11-06",
      travelers: 4,
      mode: "family",
    },
  },
];

export const REFINEMENT_FIXTURES: RefinementFixture[] = [
  {
    id: "refine-hotel-cheaper",
    label: "Refine: downgrade hotel only",
    profile: GENERATION_FIXTURES[1].profile,
    request: GENERATION_FIXTURES[1].request,
    tweak: "The hotel is too expensive. Find something in the standard tier instead.",
  },
  {
    id: "refine-day-relaxed",
    label: "Refine: make one day more relaxed",
    profile: GENERATION_FIXTURES[0].profile,
    request: GENERATION_FIXTURES[0].request,
    tweak: "Make day 2 more relaxed — fewer activities, more wandering and cafe time.",
  },
];
