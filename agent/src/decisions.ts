import { fetchFourMemeSignals } from "./signals.js";
import { triageTokens, decideAction } from "./dgrid.js";
import { goPlusCheck } from "./safety.js";
import type { Action, PortfolioCtx, TokenSignal } from "./types.js";

function elapsed(start: number): string {
  return `${Date.now() - start}ms`;
}

export async function runCycle(ctx: PortfolioCtx): Promise<Action> {
  // Stage 1 — fetch signals
  let t = Date.now();
  const signals = await fetchFourMemeSignals();
  console.log(`[signals] fetched ${signals.length} tokens  (${elapsed(t)})`);

  if (signals.length === 0) {
    return { type: "HOLD", reasoning: "No signals from Four.meme in the last 30 minutes." };
  }

  // Stage 2 — triage (cheap model)
  t = Date.now();
  const shortlist = await triageTokens(signals);
  console.log(`[triage]  ${shortlist.length} passed triage  (${elapsed(t)})`);

  if (shortlist.length === 0) {
    return { type: "HOLD", reasoning: "No tokens passed triage filter." };
  }

  // Stage 3 — GoPlus safety filter
  t = Date.now();
  const safe: TokenSignal[] = [];
  for (const token of shortlist) {
    const { safe: ok, flags } = await goPlusCheck(token.address);
    if (ok) {
      safe.push(token);
    } else {
      console.log(`[safety]  ${token.symbol} rejected — ${flags.join(", ")}`);
    }
  }
  console.log(`[safety]  ${safe.length} passed GoPlus check  (${elapsed(t)})`);

  if (safe.length === 0) {
    return { type: "HOLD", reasoning: "All shortlisted tokens failed GoPlus safety check." };
  }

  // Stage 4 — decide (strong model)
  t = Date.now();
  const action = await decideAction(safe, ctx);
  console.log(`[decide]  action=${action.type}  (${elapsed(t)})`);

  return action;
}
