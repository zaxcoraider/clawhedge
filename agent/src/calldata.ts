import { encodeFunctionData, getAddress } from "viem";
import { createRequire } from "module";
import os from "os";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HedgedBuyerAbi: { abi: any[] } = require("../../contracts/out/HedgedBuyer.sol/HedgedBuyer.json");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IMYXRouterAbi: { abi: any[] } = require("../../contracts/out/IMYXRouter.sol/IMYXRouter.json");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IERC20Abi: { abi: any[] } = require("../../contracts/out/IERC20.sol/IERC20.json");

export const HEDGED_BUYER_ADDR = getAddress("0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae");
export const USDT_ADDR         = getAddress("0x55d398326f99059fF775485246999027B3197955");
export const WBNB_ADDR         = getAddress("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");

export function myxRouterAddr(): `0x${string}` {
  const addr = process.env.MYX_ROUTER;
  if (!addr) throw new Error("MYX_ROUTER env var not set");
  return getAddress(addr);
}

export interface Step {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
}

// ── 1. hedgedBuy calldata ────────────────────────────────────────────────────

export interface HedgedBuyArgs {
  user:          `0x${string}`;
  token:         `0x${string}`;
  minAmount:     bigint;
  hedgeUsdt:     bigint;
  sizeDelta:     bigint;
  maxIndexPrice: bigint;
  bnbAmount:     bigint;
}

export function buildHedgedBuyCalldata(args: HedgedBuyArgs): Step {
  const data = encodeFunctionData({
    abi:          HedgedBuyerAbi.abi,
    functionName: "hedgedBuy",
    args: [
      getAddress(args.user),
      getAddress(args.token),
      args.minAmount,
      args.hedgeUsdt,
      args.sizeDelta,
      args.maxIndexPrice,
    ],
  });
  return { to: HEDGED_BUYER_ADDR, data, value: args.bnbAmount };
}

// ── 2. MYX short steps (approve + openShort) ────────────────────────────────

export interface MYXShortArgs {
  indexToken:      `0x${string}`;
  collateralToken: `0x${string}`;
  collateralAmount: bigint;
  sizeDelta:       bigint;
  acceptablePrice: bigint;
  hedgeUsdt:       bigint;
}

export function buildMYXShortSteps(args: MYXShortArgs): Step[] {
  const router = myxRouterAddr();

  const approveData = encodeFunctionData({
    abi:          IERC20Abi.abi,
    functionName: "approve",
    args:         [router, args.hedgeUsdt],
  });

  const shortData = encodeFunctionData({
    abi:          IMYXRouterAbi.abi,
    functionName: "openShort",
    args: [
      getAddress(args.indexToken),
      getAddress(args.collateralToken),
      args.collateralAmount,
      args.sizeDelta,
      args.acceptablePrice,
    ],
  });

  return [
    { to: USDT_ADDR, data: approveData, value: 0n },
    { to: router,    data: shortData,   value: 0n },
  ];
}

// ── 3. USDT approve (single step) ───────────────────────────────────────────

export function buildUsdtApproveCalldata(spender: `0x${string}`, amount: bigint): Step {
  const data = encodeFunctionData({
    abi:          IERC20Abi.abi,
    functionName: "approve",
    args:         [getAddress(spender), amount],
  });
  return { to: USDT_ADDR, data, value: 0n };
}

// ── 4. Write steps file ──────────────────────────────────────────────────────

export function writeStepsFile(steps: Step[]): string {
  const file = path.join(os.tmpdir(), `clawhedge-steps-${Date.now()}.json`);
  const serializable = steps.map((s) => ({
    to:    s.to,
    data:  s.data,
    value: s.value.toString(),
  }));
  fs.writeFileSync(file, JSON.stringify(serializable, null, 2));
  return file;
}
