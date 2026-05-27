import Anthropic from "@anthropic-ai/sdk";
import type { Profile, TripRequest, TripPlan } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type DimensionScore = {
  score: number; // 1-5
  reason: string;
};

export type EvalScore = {
  preference_alignment: DimensionScore;
  budget_coherence: DimensionScore;
  completeness: DimensionScore;
  destination_fit: DimensionScore;
  format_compliance: DimensionScore;
  overall: number; // average
};

const JUDGE_PROMPT = `You are an evaluator for an AI travel planner called Tripsmith.
You will receive a user profile, their trip request, and the generated trip plan.
Score the plan on 5 dimensions, each from 1 (very poor) to 5 (excellent).

## Dimensions

**preference_alignment** — Does the output match what the user asked for?
- Accommodation tier: does pricePerNight match the profile's tier for the trip mode (solo→tierSolo, family/couple/friends→tierFamily)?
- Pace: "packed" profile should have 3 activities/day; "slow" should have 1-2; "balanced" is 2-3
- Food: dietary restrictions must be respected in every meal suggestion
- profile.stays.avoid and profile.food.avoid must not appear in output

**budget_coherence** — Are the numbers internally consistent?
- accommodation total (pricePerNight × nights) should roughly match budgetSummary.accommodation string
- flights total (per-person price × travelers) should match budgetSummary.flights string
- estimatedTotal should be plausibly >= sum of flights + accommodation + foodAndActivities

**completeness** — Is all required content present?
- All top-level fields exist and are non-empty
- flights array has exactly 3 options
- itinerary has one entry for every day in the date range
- Each itinerary day has at least 1 activity and 1 meal
- packingList has at least 2 categories with items

**destination_fit** — Are suggestions appropriate for the actual destination?
- Activities and restaurants sound plausible for the stated city/country
- No obvious geographic errors or hallucinated landmarks
- weatherSummary references the destination

**format_compliance** — Does output follow formatting rules?
- No markdown (**, ##, bullet points) inside string fields
- packingList has 4 or fewer categories
- No more than 3 activities per day, no more than 2 meals per day
- Strings are brief — no run-on sentences in activity descriptions or tips

Return ONLY valid JSON, no prose:
{
  "preference_alignment": { "score": <1-5>, "reason": "<one sentence>" },
  "budget_coherence": { "score": <1-5>, "reason": "<one sentence>" },
  "completeness": { "score": <1-5>, "reason": "<one sentence>" },
  "destination_fit": { "score": <1-5>, "reason": "<one sentence>" },
  "format_compliance": { "score": <1-5>, "reason": "<one sentence>" }
}`;

export async function scorePlan(
  profile: Profile,
  request: TripRequest,
  plan: TripPlan
): Promise<EvalScore> {
  const userMessage = `# Profile
${JSON.stringify(profile, null, 2)}

# Trip Request
${JSON.stringify(request, null, 2)}

# Generated Plan
${JSON.stringify(plan, null, 2)}

Score this plan now.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: JUDGE_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No response from judge");

  const raw = text.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error(`Judge returned non-JSON: ${raw.slice(0, 200)}`);

  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as Omit<EvalScore, "overall">;

  const scores = [
    parsed.preference_alignment.score,
    parsed.budget_coherence.score,
    parsed.completeness.score,
    parsed.destination_fit.score,
    parsed.format_compliance.score,
  ];
  const overall = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

  return { ...parsed, overall };
}

export type RefinementEvalScore = {
  change_applied: DimensionScore;
  unchanged_preserved: DimensionScore;
  overall: number;
};

const REFINE_JUDGE_PROMPT = `You are evaluating a refinement operation on an AI travel plan.
You receive the original plan, the user's tweak instruction, and the refined plan.
Score on 2 dimensions from 1 (very poor) to 5 (excellent).

**change_applied** — Was the requested change actually made?
- The specific thing the user asked to change should be different in the refined plan

**unchanged_preserved** — Was everything else left intact?
- Fields not mentioned in the tweak should be identical or very close to the original
- Itinerary days not mentioned should be unchanged
- Budget fields should only change if the tweak implied a price change

Return ONLY valid JSON:
{
  "change_applied": { "score": <1-5>, "reason": "<one sentence>" },
  "unchanged_preserved": { "score": <1-5>, "reason": "<one sentence>" }
}`;

export async function scoreRefinement(
  tweak: string,
  originalPlan: TripPlan,
  refinedPlan: TripPlan
): Promise<RefinementEvalScore> {
  const userMessage = `# Tweak instruction
${tweak}

# Original Plan
${JSON.stringify(originalPlan, null, 2)}

# Refined Plan
${JSON.stringify(refinedPlan, null, 2)}

Score the refinement now.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: REFINE_JUDGE_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No response from refine judge");

  const raw = text.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error(`Judge returned non-JSON: ${raw.slice(0, 200)}`);

  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as Omit<RefinementEvalScore, "overall">;
  const overall = Math.round(
    ((parsed.change_applied.score + parsed.unchanged_preserved.score) / 2) * 10
  ) / 10;

  return { ...parsed, overall };
}
