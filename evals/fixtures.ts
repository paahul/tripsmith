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

  // ── gap coverage ────────────────────────────────────────────────────────────

  {
    id: "regional-adjustment-vienna",
    label: "Regional override: budget global but comfort Europe",
    profile: {
      homeAirport: "BKK",
      stays: {
        style: "Clean, central, good wifi",
        avoid: "Party areas",
        tierSolo: "budget",
        tierFamily: "budget",
        regionalAdjustments: "I always go budget in SE Asia but bump up to comfort in Western Europe — costs are just too different.",
      },
      food: { style: "Local cafes, markets, wine bars", dietary: "", avoid: "" },
      pace: "balanced",
      soloMode: "Wandering, coffee shops, architecture",
      familyMode: "",
      freeform: "",
    },
    request: {
      destination: "Vienna, Austria",
      startDate: "2026-10-12",
      endDate: "2026-10-15",
      travelers: 1,
      mode: "solo",
    },
  },

  {
    id: "heavy-freeform-nyc",
    label: "Heavy freeform notes / NYC 4 days",
    profile: {
      homeAirport: "LAX",
      stays: {
        style: "Boutique, character, not corporate",
        avoid: "Times Square area, anything generic",
        tierSolo: "comfort",
        tierFamily: "comfort",
        regionalAdjustments: "",
      },
      food: { style: "Serious food — I read restaurant reviews obsessively", dietary: "", avoid: "Chain restaurants, anything touristy" },
      pace: "balanced",
      soloMode: "",
      familyMode: "",
      freeform: "I'm a jazz musician. Every trip I need at least one great live jazz night — Village Vanguard, Smalls, Mezzrow level. I've been to NYC 6 times so please skip the obvious stuff (Statue of Liberty, Times Square, Empire State). I want the version locals actually do.",
    },
    request: {
      destination: "New York City, USA",
      startDate: "2026-09-10",
      endDate: "2026-09-13",
      travelers: 1,
      mode: "solo",
    },
  },

  {
    id: "one-day-trip",
    label: "Edge case: 1-day trip",
    profile: {
      homeAirport: "SFO",
      stays: {
        style: "Doesn't matter for one night",
        avoid: "",
        tierSolo: "standard",
        tierFamily: "standard",
        regionalAdjustments: "",
      },
      food: { style: "Whatever is good and local", dietary: "", avoid: "" },
      pace: "packed",
      soloMode: "See as much as possible",
      familyMode: "",
      freeform: "",
    },
    request: {
      destination: "Portland, Oregon, USA",
      startDate: "2026-08-20",
      endDate: "2026-08-20",
      travelers: 1,
      mode: "solo",
    },
  },

  {
    id: "obscure-home-airport",
    label: "Obscure home airport / Bozeman to Tokyo",
    profile: {
      homeAirport: "BZN",
      stays: {
        style: "Ryokans and small guesthouses",
        avoid: "Business hotels",
        tierSolo: "standard",
        tierFamily: "standard",
        regionalAdjustments: "",
      },
      food: { style: "Ramen, sushi, izakayas", dietary: "", avoid: "" },
      pace: "balanced",
      soloMode: "Photography, temples, local neighborhoods",
      familyMode: "",
      freeform: "",
    },
    request: {
      destination: "Tokyo, Japan",
      startDate: "2026-11-10",
      endDate: "2026-11-14",
      travelers: 1,
      mode: "solo",
    },
  },

  {
    id: "conflicting-prefs",
    label: "Conflicting prefs: budget tier but wants luxury hotels",
    profile: {
      homeAirport: "LHR",
      stays: {
        style: "I know I said budget but I really love beautiful hotels",
        avoid: "Hostels",
        tierSolo: "budget",
        tierFamily: "budget",
        regionalAdjustments: "",
      },
      food: { style: "Fine dining when possible, I love Michelin spots", dietary: "", avoid: "Casual or cheap food" },
      pace: "slow",
      soloMode: "Luxury experiences, spas, beautiful lobbies",
      familyMode: "",
      freeform: "I set budget as my tier but honestly if there's an Aman or a Rosewood I'll splurge. The tier is more of a guideline.",
    },
    request: {
      destination: "Marrakech, Morocco",
      startDate: "2026-12-01",
      endDate: "2026-12-04",
      travelers: 1,
      mode: "solo",
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
  {
    id: "refine-impossible",
    label: "Refine: impossible request (add an extra day)",
    profile: GENERATION_FIXTURES[0].profile,
    request: GENERATION_FIXTURES[0].request,
    tweak: "Can you add an extra day to the trip? I want 4 days instead of 3.",
  },
  {
    id: "refine-vague",
    label: "Refine: vague instruction",
    profile: GENERATION_FIXTURES[3].profile,
    request: GENERATION_FIXTURES[3].request,
    tweak: "Make day 2 more fun.",
  },
];
