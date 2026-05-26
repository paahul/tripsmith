export const MAX_TRIP_DAYS = 10;

export function tripLengthDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.floor((end - start) / 86_400_000) + 1;
}

export type Profile = {
  name?: string;
  homeAirport: string;
  stays: {
    style: string;
    avoid: string;
    budgetPerNightSolo: string;
    budgetPerNightFamily: string;
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

export type TripPlan = {
  destination: string;
  summary: string;
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
    budgetPerNightSolo: "",
    budgetPerNightFamily: "",
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
