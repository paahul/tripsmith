import Anthropic from "@anthropic-ai/sdk";
import type { Profile, TripPlan, TripRequest } from "./types";
import type { AmadeusFlight, AmadeusHotel } from "./amadeus";
import type { WeatherSummary } from "./openweather";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are tripsmith, a meticulous personal travel planner.

You receive:
1. A traveler's profile describing how they like to travel
2. A specific trip request (destination, dates, who's coming)
3. Real flight options from Amadeus (may be empty if the test data didn't cover the route)
4. A list of real hotels in the destination city (no prices in test env)
5. A weather forecast summary for the destination

Your job: synthesize a complete, actionable trip plan as STRICT JSON matching the TripPlan schema. No prose outside JSON.

Rules:
- Tailor accommodation picks to the traveler's stated stay style. If their family mode differs from solo mode and the trip is "family", lean into family-mode preferences.
- For flights, if Amadeus returned real options, use them. Otherwise, suggest 3 plausible airline/route options for the route — clearly mark these as "estimated" in the price field.
- For accommodations, use the real hotel names from the input list when possible, but you may also suggest neighborhoods/areas if the list is thin. Always include a "whyItFits" tied to the profile.
- For bookingLink: use Google Flights URL format for flights (https://www.google.com/travel/flights?q=...) and Booking.com search URLs for hotels (https://www.booking.com/searchresults.html?ss=<name>&checkin=<date>&checkout=<date>).
- Itinerary: one entry per day between startDate and endDate inclusive. Pace matches the profile.
- Packing list reflects the actual weather (temps + rainy days). Include a "buy before you go" category if there are gaps for that destination/season.
- Meals match the profile's food style. Mention 1–2 standout restaurants by name if relevant for the city.
- Local transport: actionable guidance (e.g. "Buy a Lisboa Card for metro + trams", "Uber works well, rental car not needed").

Output STRICT JSON with this shape (no markdown, no commentary):
{
  "destination": string,
  "summary": string,
  "flights": [{ "airline": string, "price": string, "duration": string, "stops": number, "departure": string, "arrival": string, "bookingLink": string }],
  "accommodations": [{ "name": string, "style": string, "pricePerNight": string, "whyItFits": string, "bookingLink": string }],
  "localTransport": string,
  "itinerary": [{ "date": string, "title": string, "activities": [{ "time": string, "description": string, "tip": string }], "meals": [{ "meal": string, "suggestion": string, "why": string }] }],
  "packingList": [{ "category": string, "items": [string] }],
  "weatherSummary": string
}`;

export async function generateTripPlan(input: {
  profile: Profile;
  request: TripRequest;
  flights: AmadeusFlight[];
  hotels: AmadeusHotel[];
  weather: WeatherSummary | null;
}): Promise<TripPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const client = new Anthropic({ apiKey });

  const userMessage = `# Traveler profile
${JSON.stringify(input.profile, null, 2)}

# Trip request
${JSON.stringify(input.request, null, 2)}

# Real flight options from Amadeus (${input.flights.length} found)
${JSON.stringify(input.flights, null, 2)}

# Real hotels in destination from Amadeus (${input.hotels.length} found, no prices in test env)
${JSON.stringify(input.hotels.slice(0, 10), null, 2)}

# Weather forecast
${input.weather ? JSON.stringify(input.weather, null, 2) : "Weather data unavailable — use seasonal knowledge for this destination."}

Generate the TripPlan JSON now.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const raw = textBlock.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Could not find JSON in Claude response: ${raw.slice(0, 200)}`);
  }
  const jsonStr = raw.slice(jsonStart, jsonEnd + 1);

  return JSON.parse(jsonStr) as TripPlan;
}
