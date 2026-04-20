import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

import { runCycle } from "./decisions.js";
import { explainToUser } from "./dgrid.js";
import {
  buildHedgedBuyCalldata,
  buildMYXShortSteps,
  buildUsdtApproveCalldata,
  writeStepsFile,
  USDT_ADDR,
  WBNB_ADDR,
} from "./calldata.js";
import type { PortfolioCtx } from "./types.js";

const [, , command, ...args] = process.argv;

function parseArgs(arr: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].startsWith("--") && arr[i + 1] !== undefined) {
      out[arr[i].slice(2)] = arr[i + 1];
      i++;
    }
  }
  return out;
}

// ── dry-run ──────────────────────────────────────────────────────────────────

async function dryRun(flags: Record<string, string>) {
  const user    = flags["user"] as `0x${string}` | undefined;
  const maxUsdt = parseFloat(flags["max-usdt"] ?? "10");

  if (!user) { console.error("Error: --user <0x...> is required"); process.exit(1); }

  const ctx: PortfolioCtx = {
    walletAddress:  user,
    usdtBalance:    maxUsdt,
    bnbBalance:     0.1,
    openPositions:  [],
  };

  console.log(`\nClawHedge dry-run`);
  console.log(`Wallet : ${user}`);
  console.log(`MaxUSDT: ${maxUsdt}`);
  console.log(`─────────────────────────────────────\n`);

  const action  = await runCycle(ctx);

  console.log(`\n─────────────────────────────────────`);
  console.log("Action JSON:");
  console.log(JSON.stringify(action, null, 2));

  const summary = await explainToUser(action);
  console.log(`\nSummary: ${summary}\n`);
}

// ── build-myx-short ──────────────────────────────────────────────────────────

function buildMyxShort(flags: Record<string, string>) {
  const collateral = BigInt(Math.round(parseFloat(flags["collateral"] ?? "10") * 1e18));
  const leverage   = parseFloat(flags["leverage"] ?? "2");
  const minPrice   = BigInt(Math.round(parseFloat(flags["min-price"] ?? "0") * 1e18));
  const sizeDelta  = BigInt(Math.round(parseFloat(flags["collateral"] ?? "10") * leverage * 1e18));
  const market     = (flags["market"] ?? WBNB_ADDR) as `0x${string}`;

  const steps = buildMYXShortSteps({
    indexToken:       market,
    collateralToken:  USDT_ADDR,
    collateralAmount: collateral,
    sizeDelta,
    acceptablePrice:  minPrice,
    hedgeUsdt:        collateral,
  });

  const file = writeStepsFile(steps);
  console.log(`Steps file: ${file}`);
  console.log(JSON.stringify(
    steps.map((s) => ({ to: s.to, data: s.data, value: s.value.toString() })),
    null, 2
  ));
}

// ── build-hedged-buy ─────────────────────────────────────────────────────────

function buildHedgedBuy(flags: Record<string, string>) {
  const user      = (flags["user"]  ?? "") as `0x${string}`;
  const token     = (flags["token"] ?? "") as `0x${string}`;
  const bnbAmount = BigInt(Math.round(parseFloat(flags["bnb"] ?? "0.01") * 1e18));
  const hedgeUsdt = BigInt(Math.round(parseFloat(flags["hedge-usdt"] ?? "10") * 1e18));
  const leverage  = parseFloat(flags["leverage"] ?? "2");
  const sizeDelta = BigInt(Math.round(parseFloat(flags["hedge-usdt"] ?? "10") * leverage * 1e18));

  if (!user || !token) {
    console.error("Error: --user and --token are required");
    process.exit(1);
  }

  const approveStep = buildUsdtApproveCalldata(
    "0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae",
    hedgeUsdt
  );

  const buyStep = buildHedgedBuyCalldata({
    user,
    token,
    minAmount:     0n,
    hedgeUsdt,
    sizeDelta,
    maxIndexPrice: 0n,
    bnbAmount,
  });

  const steps = [approveStep, buyStep];
  const file  = writeStepsFile(steps);
  console.log(`Steps file: ${file}`);
  console.log(JSON.stringify(
    steps.map((s) => ({ to: s.to, data: s.data, value: s.value.toString() })),
    null, 2
  ));
}

// ── router ───────────────────────────────────────────────────────────────────

switch (command) {
  case "dry-run":
    await dryRun(parseArgs(args));
    break;

  case "build-myx-short":
    buildMyxShort(parseArgs(args));
    break;

  case "build-hedged-buy":
    buildHedgedBuy(parseArgs(args));
    break;

  case "run":
    console.log("run: autonomous loop — roadmap (auto-scan → AI decide → buy)");
    break;

  case "status":
    console.log("status: portfolio view — roadmap (TEE wallet balances + open positions)");
    break;

  default:
    console.log(`Usage: clawhedge-agent <command> [options]

Commands:
  dry-run --user 0x... --max-usdt N
  build-myx-short --market 0x... --collateral N --leverage N --min-price N
  build-hedged-buy --token 0x... --bnb N --hedge-usdt N --leverage N --user 0x...
  run                   (stub)
  status                (stub)
`);
}
