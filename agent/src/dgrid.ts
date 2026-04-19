import OpenAI from "openai";
import type { TokenSignal, Action, PortfolioCtx } from "./types.js";

// ---------------------------------------------------------------------------
// Model IDs — check https://dgrid.ai/models and replace with real IDs
// ---------------------------------------------------------------------------
const TRIAGE  = "meta-llama/Llama-3.1-8B-Instruct";   // cheapest small model
const DECIDE  = "meta-llama/Llama-3.3-70B-Instruct";  // strongest model
const EXPLAIN = "meta-llama/Llama-3.1-8B-Instruct";   // cheap small model
// ---------------------------------------------------------------------------

export const client = new OpenAI({
  baseURL: "https://api.dgrid.ai/v1",
  apiKey: process.env.DGRID_API_KEY ?? "",
});

export const MODEL_IDS = { TRIAGE, DECIDE, EXPLAIN };

export async function triageTokens(signals: TokenSignal[]): Promise<TokenSignal[]> {
  const res = await client.chat.completions.create({
    model: TRIAGE,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a BSC meme token triage filter. Given a list of token signals, " +
          "return only those worth deeper analysis. Reject tokens where: " +
          "bondingCurvePct > 90 (near graduation, too late), " +
          "ageMinutes < 2 (too fresh, no data), " +
          "devWalletPct > 20 (dev holds too much), " +
          "volumeUSD24h < 500 (no real activity). " +
          "Return JSON: { \"shortlist\": [<same objects that pass>] }",
      },
      {
        role: "user",
        content: JSON.stringify(signals),
      },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { shortlist?: TokenSignal[] };
  return parsed.shortlist ?? [];
}

export async function decideAction(
  shortlist: TokenSignal[],
  ctx: PortfolioCtx
): Promise<Action> {
  const res = await client.chat.completions.create({
    model: DECIDE,
    temperature: 0.2,
    tools: [
      {
        type: "function",
        function: {
          name: "submit_action",
          description: "Submit the trading decision",
          parameters: {
            type: "object",
            oneOf: [
              {
                properties: {
                  type: { type: "string", enum: ["BUY_AND_HEDGE"] },
                  token: { type: "string" },
                  bnbAmount: { type: "number" },
                  usdtHedge: { type: "number" },
                  leverage: { type: "number" },
                  market: { type: "string" },
                  reasoning: { type: "string" },
                },
                required: ["type", "token", "bnbAmount", "usdtHedge", "leverage", "market", "reasoning"],
              },
              {
                properties: {
                  type: { type: "string", enum: ["HOLD"] },
                  reasoning: { type: "string" },
                },
                required: ["type", "reasoning"],
              },
            ],
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "submit_action" } },
    messages: [
      {
        role: "system",
        content:
          "You are a BSC meme token trading agent. Analyze the token shortlist and portfolio context. " +
          "If no setup meets the edge threshold (clear momentum, safe dev wallet, healthy bonding curve 20-80%), " +
          "return HOLD. Never risk more than 30% of USDT balance on a single hedge. " +
          "Hedge size should be 1x-2x the BNB spend value in USDT.",
      },
      {
        role: "user",
        content: JSON.stringify({ shortlist, portfolio: ctx }),
      },
    ],
  });

  const toolCall = res.choices[0]?.message?.tool_calls?.[0] as
    | { function: { arguments: string } }
    | undefined;
  if (!toolCall) return { type: "HOLD", reasoning: "No tool call returned by model" };

  return JSON.parse(toolCall.function.arguments) as Action;
}

export async function explainToUser(action: Action, txHash?: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: EXPLAIN,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: "Summarize the agent's trading action in exactly one plain-English sentence for the user.",
      },
      {
        role: "user",
        content: JSON.stringify({ action, txHash: txHash ?? null }),
      },
    ],
  });

  return res.choices[0]?.message?.content?.trim() ?? "Action taken.";
}
