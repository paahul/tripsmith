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
