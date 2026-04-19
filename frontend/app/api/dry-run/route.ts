import { NextResponse } from "next/server";

export async function GET() {
  // Simulated dry-run — returns a mock action without touching chain or dgrid
  await new Promise(r => setTimeout(r, 600)); // simulate latency

  const mockAction = {
    type: "HOLD",
    reasoning:
      "No token passed all safety gates in the last 30-minute window. " +
      "Triage filtered 3 candidates; GoPlus flagged 2 as honeypots and 1 had insufficient liquidity.",
    stages: [
      { name: "signals",  tokens: 28, latencyMs: 312 },
      { name: "triage",   tokens: 3,  latencyMs: 891 },
      { name: "safety",   tokens: 0,  latencyMs: 543 },
      { name: "decision", action: "HOLD", latencyMs: 0 },
    ],
  };

  return NextResponse.json(mockAction);
}
