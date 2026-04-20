import { NextResponse } from "next/server";

export const maxDuration = 60; // Vercel max for hobby plan

const DGRID_BASE    = "https://api.dgrid.ai/v1";
const TRIAGE_MODEL  = "anthropic/claude-sonnet-4.6";
const DECIDE_MODEL  = "anthropic/claude-sonnet-4.6"; // sonnet for speed, opus was timing out
const EXPLAIN_MODEL = "anthropic/claude-sonnet-4.6";

async function dgridChat(
  model: string,
  messages: { role: string; content: string }[],
  opts: Record<string, unknown> = {}
) {
  const t0  = Date.now();
  const res = await fetch(`${DGRID_BASE}/chat/completions`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.DGRID_API_KEY ?? ""}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0, ...opts }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`DGrid ${model}: ${res.status} ${await res.text()}`);
  const json = await res.json() as {
    choices: { message: { content: string } }[];
  };
  return { content: json.choices[0]?.message?.content ?? "", latencyMs: Date.now() - t0 };
}

/* ── Streaming GET — sends each stage as it completes ── */
export async function GET() {
  const apiKey = process.env.DGRID_API_KEY;
  const encoder = new TextEncoder();

  function evt(payload: unknown) {
    return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
  }

  /* no key → fast mock */
  if (!apiKey) {
    return NextResponse.json({
      type: "HOLD",
      reasoning: "DGRID_API_KEY not set in Vercel env — showing simulated result.",
      simulated: true,
      stages: [
        { name: "TRIAGE",  model: TRIAGE_MODEL,  tokens: 0,      latencyMs: 0 },
        { name: "DECIDE",  model: DECIDE_MODEL,  action: "HOLD", latencyMs: 0 },
        { name: "EXPLAIN", model: EXPLAIN_MODEL, action: "—",    latencyMs: 0 },
      ],
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        /* ── TRIAGE ── */
        controller.enqueue(evt({ stage: "TRIAGE", status: "running" }));
        const t1 = await dgridChat(TRIAGE_MODEL, [
          {
            role: "system",
            content:
              "You are a BSC meme token triage filter for ClawHedge. " +
              "This is a dry-run — no live signals. " +
              "Describe in 1-2 sentences what criteria you would use to shortlist tokens. " +
              'Return JSON: { "shortlistCount": <0-5>, "criteria": "<reasoning>" }',
          },
          { role: "user", content: "Dry-run triage. Return criteria as JSON." },
        ], { response_format: { type: "json_object" } });

        const triage = JSON.parse(t1.content || "{}") as {
          shortlistCount?: number; criteria?: string;
        };
        controller.enqueue(evt({
          stage: "TRIAGE", status: "done",
          model: TRIAGE_MODEL, tokens: triage.shortlistCount ?? 0, latencyMs: t1.latencyMs,
        }));

        /* ── DECIDE ── */
        controller.enqueue(evt({ stage: "DECIDE", status: "running" }));
        const t2 = await dgridChat(DECIDE_MODEL, [
          {
            role: "system",
            content:
              "You are the ClawHedge trading decision agent on BSC. Dry-run — no live data. " +
              "Based on typical Four.meme market conditions decide: BUY_AND_HEDGE or HOLD. " +
              "Explain your edge threshold in 2 sentences. " +
              'Return JSON: { "type": "HOLD" | "BUY_AND_HEDGE", "reasoning": "<2 sentences>" }',
          },
          {
            role: "user",
            content: `Triage found ${triage.shortlistCount ?? 0} candidates. Criteria: ${triage.criteria ?? "none"}. Decide.`,
          },
        ], { response_format: { type: "json_object" } });

        const decision = JSON.parse(t2.content || "{}") as {
          type?: string; reasoning?: string;
        };
        controller.enqueue(evt({
          stage: "DECIDE", status: "done",
          model: DECIDE_MODEL, action: decision.type ?? "HOLD", latencyMs: t2.latencyMs,
        }));

        /* ── EXPLAIN ── */
        controller.enqueue(evt({ stage: "EXPLAIN", status: "running" }));
        const t3 = await dgridChat(EXPLAIN_MODEL, [
          {
            role: "system",
            content: "Summarise the agent dry-run decision in exactly one plain-English sentence for the user.",
          },
          { role: "user", content: JSON.stringify(decision) },
        ]);

        controller.enqueue(evt({
          stage: "EXPLAIN", status: "done",
          model: EXPLAIN_MODEL, action: t3.content.trim().slice(0, 80) + "…", latencyMs: t3.latencyMs,
        }));

        /* ── FINAL ── */
        controller.enqueue(evt({
          stage: "done",
          type:      decision.type ?? "HOLD",
          reasoning: decision.reasoning ?? t3.content,
          summary:   t3.content,
          simulated: false,
        }));

      } catch (e) {
        controller.enqueue(evt({ stage: "error", msg: String(e) }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}
