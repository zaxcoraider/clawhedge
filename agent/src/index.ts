import "dotenv/config";
import { runCycle } from "./decisions.js";
import { explainToUser } from "./dgrid.js";
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

async function dryRun(flags: Record<string, string>) {
  const user = flags["user"] as `0x${string}` | undefined;
  const maxUsdt = parseFloat(flags["max-usdt"] ?? "10");

  if (!user) {
    console.error("Error: --user <0x...> is required");
    process.exit(1);
  }

  const ctx: PortfolioCtx = {
    walletAddress: user,
    usdtBalance: maxUsdt,
    bnbBalance: 0.1,        // placeholder — wire up viem balance call when ready
    openPositions: [],
  };

  console.log(`\nClawHedge dry-run`);
  console.log(`Wallet : ${user}`);
  console.log(`MaxUSDT: ${maxUsdt}`);
  console.log(`─────────────────────────────────────\n`);

  const action = await runCycle(ctx);

  console.log(`\n─────────────────────────────────────`);
  console.log("Action JSON:");
  console.log(JSON.stringify(action, null, 2));

  const summary = await explainToUser(action);
  console.log(`\nSummary: ${summary}\n`);
}

switch (command) {
  case "dry-run":
    await dryRun(parseArgs(args));
    break;

  case "run":
    // stub — will call runCycle in a loop and execute on-chain
    console.log("run: not yet implemented");
    break;

  case "status":
    // stub — will call clawhedge-status skill
    console.log("status: not yet implemented");
    break;

  default:
    console.log(`Usage: clawhedge-agent <command> [options]

Commands:
  dry-run --user 0x... --max-usdt N   Run one cycle, print Action JSON, no chain calls
  run                                  Live trading loop (stub)
  status                               Portfolio status (stub)
`);
}
