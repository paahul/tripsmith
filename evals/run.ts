import { writeFileSync, mkdirSync } from "fs";
import { generateTripPlan, refineTripPlan } from "@/lib/claude";
import { scorePlan, scoreRefinement } from "./score";
import { GENERATION_FIXTURES, REFINEMENT_FIXTURES } from "./fixtures";
import type { EvalScore, RefinementEvalScore } from "./score";
import type { TripPlan } from "@/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────

function bar(score: number): string {
  const filled = Math.round(score);
  return "█".repeat(filled) + "░".repeat(5 - filled) + ` ${score}`;
}

function pad(s: string, n: number) {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── generation evals ───────────────────────────────────────────────────────

type GenerationResult = {
  id: string;
  label: string;
  plan: TripPlan | null;
  score: EvalScore | null;
  error: string | null;
  durationMs: number;
};

async function runGenerationEvals(): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];

  console.log("\n━━━  GENERATION EVALS  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  for (const fixture of GENERATION_FIXTURES) {
    process.stdout.write(`  ${pad(fixture.label, 40)} → generating...`);
    const t0 = Date.now();

    let plan: TripPlan | null = null;
    let score: EvalScore | null = null;
    let error: string | null = null;

    try {
      plan = await generateTripPlan({ profile: fixture.profile, request: fixture.request, weather: null });
      process.stdout.write(" scoring...");
      score = await scorePlan(fixture.profile, fixture.request, plan);
      process.stdout.write(`\r  ${pad(fixture.label, 40)} → overall: ${score.overall}/5\n`);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      process.stdout.write(`\r  ${pad(fixture.label, 40)} → ERROR: ${error.slice(0, 60)}\n`);
    }

    results.push({ id: fixture.id, label: fixture.label, plan, score, error, durationMs: Date.now() - t0 });
    await sleep(500); // avoid burst rate-limiting
  }

  return results;
}

// ─── refinement evals ───────────────────────────────────────────────────────

type RefinementResult = {
  id: string;
  label: string;
  score: RefinementEvalScore | null;
  error: string | null;
  durationMs: number;
};

async function runRefinementEvals(
  generationResults: GenerationResult[]
): Promise<RefinementResult[]> {
  const results: RefinementResult[] = [];

  console.log("\n━━━  REFINEMENT EVALS  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  for (const fixture of REFINEMENT_FIXTURES) {
    process.stdout.write(`  ${pad(fixture.label, 40)} → generating base...`);
    const t0 = Date.now();

    let score: RefinementEvalScore | null = null;
    let error: string | null = null;

    try {
      // Generate the base plan fresh for this fixture
      const originalPlan = await generateTripPlan({
        profile: fixture.profile,
        request: fixture.request,
        weather: null,
      });

      process.stdout.write(" refining...");
      const refinedPlan = await refineTripPlan({ currentPlan: originalPlan, tweak: fixture.tweak });

      process.stdout.write(" scoring...");
      score = await scoreRefinement(fixture.tweak, originalPlan, refinedPlan);
      process.stdout.write(`\r  ${pad(fixture.label, 40)} → overall: ${score.overall}/5\n`);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      process.stdout.write(`\r  ${pad(fixture.label, 40)} → ERROR: ${error.slice(0, 60)}\n`);
    }

    results.push({ id: fixture.id, label: fixture.label, score, error, durationMs: Date.now() - t0 });
    await sleep(500);
  }

  return results;
}

// ─── summary table ──────────────────────────────────────────────────────────

function printGenerationTable(results: GenerationResult[]) {
  const cols = ["preference_alignment", "budget_coherence", "completeness", "destination_fit", "format_compliance"] as const;
  const colLabels = ["Pref.", "Budget", "Complete", "Dest.", "Format", "Overall"];

  console.log("\n━━━  SCORES  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`  ${"Test case".padEnd(42)} ${colLabels.map((c) => c.padEnd(10)).join("")}`);
  console.log("  " + "─".repeat(42 + colLabels.length * 10));

  for (const r of results) {
    if (!r.score) {
      console.log(`  ${pad(r.label, 42)} ERROR`);
      continue;
    }
    const cells = cols.map((c) => String(r.score![c].score).padEnd(10));
    cells.push(String(r.score.overall).padEnd(10));
    console.log(`  ${pad(r.label, 42)} ${cells.join("")}`);
  }

  // Averages row
  const valid = results.filter((r) => r.score !== null);
  if (valid.length > 0) {
    const avg = (dim: (typeof cols)[number]) =>
      Math.round((valid.reduce((s, r) => s + r.score![dim].score, 0) / valid.length) * 10) / 10;
    const avgOverall =
      Math.round((valid.reduce((s, r) => s + r.score!.overall, 0) / valid.length) * 10) / 10;

    console.log("  " + "─".repeat(42 + colLabels.length * 10));
    const avgCells = cols.map((c) => String(avg(c)).padEnd(10));
    avgCells.push(String(avgOverall).padEnd(10));
    console.log(`  ${"AVERAGE".padEnd(42)} ${avgCells.join("")}`);
  }
}

function printReasoningDetail(results: GenerationResult[]) {
  const dims = [
    "preference_alignment",
    "budget_coherence",
    "completeness",
    "destination_fit",
    "format_compliance",
  ] as const;

  console.log("\n━━━  DETAILS  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  for (const r of results) {
    if (!r.score) continue;
    console.log(`  ${r.label}`);
    for (const dim of dims) {
      const d = r.score[dim];
      const label = dim.replace(/_/g, " ").padEnd(22);
      console.log(`    ${label} ${bar(d.score)}  ${d.reason}`);
    }
    console.log();
  }
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY not set. Run with: tsx --env-file .env.local evals/run.ts");
    process.exit(1);
  }

  const startTime = Date.now();
  console.log(`\nTripsmith eval harness — ${new Date().toISOString()}`);
  console.log(`Running ${GENERATION_FIXTURES.length} generation + ${REFINEMENT_FIXTURES.length} refinement fixtures\n`);

  const generationResults = await runGenerationEvals();
  const refinementResults = await runRefinementEvals(generationResults);

  printGenerationTable(generationResults);
  printReasoningDetail(generationResults);

  // Refinement summary
  if (refinementResults.some((r) => r.score)) {
    console.log("━━━  REFINEMENT SCORES  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    for (const r of refinementResults) {
      if (!r.score) { console.log(`  ${pad(r.label, 42)} ERROR`); continue; }
      console.log(`  ${pad(r.label, 42)} change_applied: ${r.score.change_applied.score}  unchanged_preserved: ${r.score.unchanged_preserved.score}  overall: ${r.score.overall}`);
      console.log(`    change:    ${r.score.change_applied.reason}`);
      console.log(`    preserved: ${r.score.unchanged_preserved.reason}`);
      console.log();
    }
  }

  const totalMs = Date.now() - startTime;
  console.log(`\nCompleted in ${(totalMs / 1000).toFixed(1)}s\n`);

  // Save results JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputPath = `evals/results/${timestamp}.json`;
  mkdirSync("evals/results", { recursive: true });
  writeFileSync(
    outputPath,
    JSON.stringify({ generationResults, refinementResults, ranAt: new Date().toISOString() }, null, 2)
  );
  console.log(`Results saved → ${outputPath}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
