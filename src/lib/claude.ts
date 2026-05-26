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

**CRITICAL: keep the output compact. Every string field must be brief — typically under 100 characters. Activity descriptions, "why it fits", meal descriptions, tips: one short sentence, never two. No filler words. No restating the question.**

## Stays tier vocabulary (in profile.stays.tierSolo / tierFamily)

Calibrate accommodation picks AND price to the local market. Pick the tier matching the trip mode (solo vs family/couple/friends → tierFamily). Also respect profile.stays.regionalAdjustments — if the user calls out a regional override, follow it.

- **budget**: hostels (private rooms), guesthouses, family-run B&Bs, budget chains. Clean basics. (~$25–80 SE Asia · $30–80 S. America · $80–150 W. Europe · $100–180 US.)
- **standard**: 3-star hotels, mid-range Airbnbs, well-reviewed B&Bs. Predictable, decent location. (~$50–150 SE Asia · $60–150 S. America · $150–250 W. Europe · $200–350 US.)
- **comfort**: 4-star, boutique, design-forward Airbnbs. Thoughtful interiors, walkable neighborhoods. (~$100–250 SE Asia · $120–280 S. America · $250–400 W. Europe · $350–550 US.)
- **luxury**: 5-star, luxury resorts, design hotels, top-end Airbnbs. (~$250–500 SE Asia · $300–600 S. America · $500–900 W. Europe · $700–1500 US.)

Use the tier to set pricePerNight in your output (in local market terms, not the home market).

## Rules
- 3 flight options. Price as estimated range ("~$650–850") PER PERSON. Departure/arrival as short time-of-day labels ("Morning"/"Late evening").
- Flight bookingLink: https://www.google.com/travel/flights?q=Flights%20from%20{ORIGIN}%20to%20{DEST_CITY}%20on%20{YYYY-MM-DD}%20through%20{YYYY-MM-DD}
- Accommodation bookingLink: https://www.booking.com/searchresults.html?ss={DEST_CITY_URLENCODED}&checkin={YYYY-MM-DD}&checkout={YYYY-MM-DD}&group_adults={N}
  Airbnb-style: https://www.airbnb.com/s/{DEST_CITY_URLENCODED}/homes?checkin={YYYY-MM-DD}&checkout={YYYY-MM-DD}&adults={N}
- Itinerary: one entry per day. **Max 3 activities, max 2 meals**, max 1-line each. Trim hard.
- Packing list: 4 categories max, ~5 items each. Items are 1-3 words.
- Local transport: 1-2 short sentences.
- summary: 1-2 sentences. weatherSummary: 1 sentence with key numbers.

## budgetSummary

Compute totals across the trip as compact strings. Use the flight price × travelers, and pricePerNight × nights. Add a rough food + activities estimate based on tier and destination cost level. Format examples:
- flights: "$1,300–1,700 for 2 travelers"
- accommodation: "$1,500–2,500 for 5 nights"
- foodAndActivities: "~$400–800"
- estimatedTotal: "~$3,200–5,000 for the trip"
- notes: short caveat if helpful (optional, omit if not)

Output STRICT JSON with this shape (no markdown, no commentary):
{
  "destination": string,
  "summary": string,
  "budgetSummary": { "flights": string, "accommodation": string, "foodAndActivities": string, "estimatedTotal": string, "notes": string },
  "flights": [{ "airline": string, "price": string, "duration": string, "stops": number, "departure": string, "arrival": string, "bookingLink": string }],
  "accommodations": [{ "name": string, "style": string, "pricePerNight": string, "whyItFits": string, "bookingLink": string }],
  "localTransport": string,
  "itinerary": [{ "date": string, "title": string, "activities": [{ "time": string, "description": string, "tip": string }], "meals": [{ "meal": string, "suggestion": string, "why": string }] }],
  "packingList": [{ "category": string, "items": [string] }],
  "weatherSummary": string
}`;

const REFINE_SYSTEM_PROMPT = `You are tripsmith refining an existing trip plan.

You receive:
1. An existing TripPlan JSON
2. A short instruction from the user describing what to change

Your job: return an UPDATED TripPlan as STRICT JSON, same schema as the input. Apply the requested change(s). Preserve everything else EXACTLY as-is — same destination, same dates, same flight/accommodation entries unless explicitly asked to change them, same budget shape.

Rules:
- Only change what was asked. Do not silently rewrite unrelated fields.
- If the user asks for a vibe change ("make day 3 chiller"), update that day's activities/meals but keep everything else intact.
- If the user adds something, add it — don't drop other things to make room unless they asked you to.
- If the user requests something impossible or contradictory, return the plan unchanged and put a one-line note in budgetSummary.notes explaining why.
- After changes, recompute budgetSummary if hotel/flight prices or trip length implicitly changed. Otherwise leave it alone.
- Keep all field formats and lengths consistent with the original (short strings, brand examples, etc.)

Output STRICT JSON — same TripPlan schema as input. No prose, no markdown.`;

export async function refineTripPlan(input: {
  currentPlan: TripPlan;
  tweak: string;
}): Promise<TripPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const client = new Anthropic({ apiKey });

  const userMessage = `# Existing TripPlan
${JSON.stringify(input.currentPlan, null, 2)}

# User's requested change
${input.tweak}

Return the updated TripPlan JSON now.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    system: [
      {
        type: "text",
        text: REFINE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Updated plan was too long to fit — try a more targeted change.",
    );
  }

  const raw = textBlock.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Could not find JSON in Claude refine response: ${raw.slice(0, 200)}`);
  }
  const jsonStr = raw.slice(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(jsonStr) as TripPlan;
  } catch (err) {
    throw new Error(
      `Got a malformed refined plan. Try again. (${err instanceof Error ? err.message : err})`,
    );
  }
}

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
    max_tokens: 6000,
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

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Plan was too long for the model — try a shorter trip (fewer days), or upgrade the API tier to allow longer responses.",
    );
  }

  const raw = textBlock.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Could not find JSON in Claude response: ${raw.slice(0, 200)}`);
  }
  const jsonStr = raw.slice(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(jsonStr) as TripPlan;
  } catch (err) {
    throw new Error(
      `Got a malformed plan from the model. Try again, or try a shorter trip. (${err instanceof Error ? err.message : err})`,
    );
  }
}
