import Anthropic from "@anthropic-ai/sdk";
import type { Profile, TripPlan, TripRequest } from "./types";
import type { WeatherSummary } from "./openweather";

const MODEL = "claude-haiku-4-5";

const SYSTEM_PROMPT = `You are tripsmith, a meticulous personal travel planner.

You receive:
1. A traveler's profile describing how they like to travel
2. A specific trip request (destination, dates, who's coming)
3. A weather forecast summary for the destination (or null — use seasonal knowledge then)

Your job: synthesize a complete, actionable trip plan as STRICT JSON matching the TripPlan schema. No prose outside JSON.

Rules (keep concise — every field one or two short sentences max):
- Accommodation picks match the profile's stay style; lean into family mode if mode === "family".
- 3 flight options. Price as estimated range ("~$650–850"). Departure/arrival as time-of-day labels ("Morning"/"Late evening"), not timestamps.
- Flight bookingLink: https://www.google.com/travel/flights?q=Flights%20from%20{ORIGIN}%20to%20{DEST_CITY}%20on%20{YYYY-MM-DD}%20through%20{YYYY-MM-DD}
- Accommodation bookingLink: https://www.booking.com/searchresults.html?ss={DEST_CITY_URLENCODED}&checkin={YYYY-MM-DD}&checkout={YYYY-MM-DD}&group_adults={N}
  Airbnb-style: https://www.airbnb.com/s/{DEST_CITY_URLENCODED}/homes?checkin={YYYY-MM-DD}&checkout={YYYY-MM-DD}&adults={N}
- Itinerary: one entry per day. Max 3 activities per day, max 2 meals per day. Keep descriptions short.
- Packing list: 4-5 categories max, ~6 items each.
- Meals: name 1-2 standout restaurants if you know the city well.
- Local transport: 1-2 short sentences with concrete guidance.

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
  weather: WeatherSummary | null;
}): Promise<TripPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const client = new Anthropic({ apiKey });

  const userMessage = `# Traveler profile
${JSON.stringify(input.profile, null, 2)}

# Trip request
${JSON.stringify(input.request, null, 2)}

# Weather forecast
${input.weather ? JSON.stringify(input.weather, null, 2) : "Weather data unavailable — use seasonal knowledge for this destination."}

Generate the TripPlan JSON now.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4500,
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
