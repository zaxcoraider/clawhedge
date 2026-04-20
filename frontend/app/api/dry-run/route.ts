import { NextResponse } from "next/server";

const DGRID_BASE = "https://api.dgrid.ai/v1";
const TRIAGE_MODEL  = "anthropic/claude-sonnet-4.6";
const DECIDE_MODEL  = "anthropic/claude-opus-4-5";
const EXPLAIN_MODEL = "anthropic/claude-sonnet-4.6";

async function dgridChat(model: string, messages: { role: string; content: string }[], opts: Record<string, unknown> = {}) {
  const t0  = Date.now();
  const res = await fetch(`${DGRID_BASE}/chat/completions`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.DGRID_API_KEY ?? ""}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0, ...opts }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`DGrid ${model} failed: ${res.status} ${await res.text()}`);
  const json = await res.json() as { choices: { message: { content: string; tool_calls?: unknown[] } }[] };
  return { json, latencyMs: Date.now() - t0 };
}

export async function GET() {
  const apiKey = process.env.DGRID_API_KEY;
  if (!apiKey) {
    // fallback mock if key not set
    return NextResponse.json({
      type: "HOLD",
      reasoning: "DGRID_API_KEY not configured — showing simulated result.",
      simulated: true,
      stages: [
        { name: "TRIAGE",   model: TRIAGE_MODEL,  tokens: 0,  latencyMs: 0 },
        { name: "DECIDE",   model: DECIDE_MODEL,   action: "HOLD", latencyMs: 0 },
        { name: "EXPLAIN",  model: EXPLAIN_MODEL,  latencyMs: 0 },
      ],
    });
  }

  try {
    /* ── Stage 1: TRIAGE ── */
    const t1 = await dgridChat(TRIAGE_MODEL, [
      {
        role: "system",
        content:
          "You are a BSC meme token triage filter for the ClawHedge agent. " +
          "Analyse the current Four.meme market. Since no live signals are provided in this dry-run, " +
          "describe in 1-2 sentences what criteria you would use to shortlist tokens from a 30-minute scan window. " +
          "Return JSON: { \"shortlistCount\": <number 0-5>, \"criteria\": \"<your reasoning>\" }",
      },
      { role: "user", content: "Dry-run triage. No live signals. Return your shortlist criteria as JSON." },
    ], { response_format: { type: "json_object" } });

    const triageResult = JSON.parse(t1.json.choices[0]?.message?.content ?? "{}") as {
      shortlistCount?: number; criteria?: string;
    };

    /* ── Stage 2: DECIDE ── */
    const t2 = await dgridChat(DECIDE_MODEL, [
      {
        role: "system",
        content:
          "You are the ClawHedge trading decision agent on BSC. " +
          "This is a dry-run with no live token data. " +
          "Based on typical Four.meme market conditions, decide whether you would BUY_AND_HEDGE or HOLD. " +
          "Explain your edge threshold and risk management logic. " +
          "Return JSON: { \"type\": \"HOLD\" | \"BUY_AND_HEDGE\", \"reasoning\": \"<2-3 sentences>\" }",
      },
      {
        role: "user",
        content: `Triage found ${triageResult.shortlistCount ?? 0} candidates. Criteria: ${triageResult.criteria ?? "none"}. Make your decision.`,
      },
    ], { response_format: { type: "json_object" } });

    const decision = JSON.parse(t2.json.choices[0]?.message?.content ?? "{}") as {
      type?: string; reasoning?: string;
    };

    /* ── Stage 3: EXPLAIN ── */
    const t3 = await dgridChat(EXPLAIN_MODEL, [
      {
        role: "system",
        content: "Summarise the agent's dry-run decision in exactly one plain-English sentence for the user.",
      },
      {
        role: "user",
        content: JSON.stringify({ decision, triage: triageResult }),
      },
    ]);

    const summary = t3.json.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({
      type:      decision.type      ?? "HOLD",
      reasoning: decision.reasoning ?? summary,
      summary,
      simulated: false,
      stages: [
        { name: "TRIAGE",  model: TRIAGE_MODEL,  tokens: triageResult.shortlistCount ?? 0, latencyMs: t1.latencyMs },
        { name: "DECIDE",  model: DECIDE_MODEL,  action: decision.type ?? "HOLD",          latencyMs: t2.latencyMs },
        { name: "EXPLAIN", model: EXPLAIN_MODEL, action: summary.slice(0, 60) + "…",       latencyMs: t3.latencyMs },
      ],
    });

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
