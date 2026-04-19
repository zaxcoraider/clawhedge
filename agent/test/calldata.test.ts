import assert from "assert";
import { decodeFunctionData, getAddress, isAddress } from "viem";
import { createRequire } from "module";
import {
  buildHedgedBuyCalldata,
  buildMYXShortSteps,
  buildUsdtApproveCalldata,
  writeStepsFile,
  HEDGED_BUYER_ADDR,
  USDT_ADDR,
  WBNB_ADDR,
  type HedgedBuyArgs,
  type MYXShortArgs,
} from "../src/calldata.js";

// Stub MYX_ROUTER for tests
process.env.MYX_ROUTER = "0x0000000000000000000000000000000000000001";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HedgedBuyerAbi: { abi: any[] } = require("../../contracts/out/HedgedBuyer.sol/HedgedBuyer.json");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IERC20Abi: { abi: any[] } = require("../../contracts/out/IERC20.sol/IERC20.json");

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${(e as Error).message}`);
    failed++;
  }
}

// ── Test fixtures ────────────────────────────────────────────────────────────

const TOKEN = getAddress("0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
const USER  = getAddress("0x889bf5f700f532950Ba67Be0B16eaB3378b992E1");

const hedgedBuyArgs: HedgedBuyArgs = {
  user:          USER,
  token:         TOKEN,
  minAmount:     1000n * 10n ** 18n,
  hedgeUsdt:     10n * 10n ** 18n,
  sizeDelta:     20n * 10n ** 18n,
  maxIndexPrice: 700n * 10n ** 18n,
  bnbAmount:     10n ** 16n,           // 0.01 BNB
};

const myxArgs: MYXShortArgs = {
  indexToken:      WBNB_ADDR,
  collateralToken: USDT_ADDR,
  collateralAmount: 10n * 10n ** 18n,
  sizeDelta:        20n * 10n ** 18n,
  acceptablePrice:  700n * 10n ** 18n,
  hedgeUsdt:        10n * 10n ** 18n,
};

// ── Suite: buildHedgedBuyCalldata ────────────────────────────────────────────

console.log("\nbuildHedgedBuyCalldata");

test("round-trip: decoded args match input", () => {
  const step = buildHedgedBuyCalldata(hedgedBuyArgs);
  const { args } = decodeFunctionData({ abi: HedgedBuyerAbi.abi, data: step.data });
  const [user, token, minAmount, hedgeUsdt, sizeDelta, maxIndexPrice] = args as [
    `0x${string}`, `0x${string}`, bigint, bigint, bigint, bigint
  ];
  assert.strictEqual(user,          USER);
  assert.strictEqual(token,         TOKEN);
  assert.strictEqual(minAmount,     hedgedBuyArgs.minAmount);
  assert.strictEqual(hedgeUsdt,     hedgedBuyArgs.hedgeUsdt);
  assert.strictEqual(sizeDelta,     hedgedBuyArgs.sizeDelta);
  assert.strictEqual(maxIndexPrice, hedgedBuyArgs.maxIndexPrice);
});

test("value is bigint", () => {
  const step = buildHedgedBuyCalldata(hedgedBuyArgs);
  assert.strictEqual(typeof step.value, "bigint");
  assert.strictEqual(step.value, hedgedBuyArgs.bnbAmount);
});

test("to address is checksummed", () => {
  const step = buildHedgedBuyCalldata(hedgedBuyArgs);
  assert.strictEqual(step.to, getAddress(step.to));
  assert.strictEqual(step.to, HEDGED_BUYER_ADDR);
});

test("data starts with 0x", () => {
  const step = buildHedgedBuyCalldata(hedgedBuyArgs);
  assert.ok(step.data.startsWith("0x"));
});

// ── Suite: buildMYXShortSteps ────────────────────────────────────────────────

console.log("\nbuildMYXShortSteps");

test("returns exactly 2 steps", () => {
  const steps = buildMYXShortSteps(myxArgs);
  assert.strictEqual(steps.length, 2);
});

test("step 1 is USDT approve — round-trip", () => {
  const steps = buildMYXShortSteps(myxArgs);
  assert.strictEqual(steps[0].to, USDT_ADDR);
  const { functionName, args } = decodeFunctionData({ abi: IERC20Abi.abi, data: steps[0].data });
  assert.strictEqual(functionName, "approve");
  const [, amount] = args as [`0x${string}`, bigint];
  assert.strictEqual(amount, myxArgs.hedgeUsdt);
});

test("step 1 value is 0n", () => {
  const steps = buildMYXShortSteps(myxArgs);
  assert.strictEqual(steps[0].value, 0n);
  assert.strictEqual(typeof steps[0].value, "bigint");
});

test("all step addresses are checksummed", () => {
  const steps = buildMYXShortSteps(myxArgs);
  for (const step of steps) {
    assert.ok(isAddress(step.to), `${step.to} is not a valid address`);
    assert.strictEqual(step.to, getAddress(step.to), `${step.to} is not checksummed`);
  }
});

// ── Suite: buildUsdtApproveCalldata ─────────────────────────────────────────

console.log("\nbuildUsdtApproveCalldata");

test("round-trip: decoded spender and amount match", () => {
  const spender = getAddress("0x1111111111111111111111111111111111111111");
  const amount  = 50n * 10n ** 18n;
  const step    = buildUsdtApproveCalldata(spender, amount);
  const { functionName, args } = decodeFunctionData({ abi: IERC20Abi.abi, data: step.data });
  const [decodedSpender, decodedAmount] = args as [`0x${string}`, bigint];
  assert.strictEqual(functionName,   "approve");
  assert.strictEqual(decodedSpender, spender);
  assert.strictEqual(decodedAmount,  amount);
});

test("to is USDT address", () => {
  const step = buildUsdtApproveCalldata(USER, 1n);
  assert.strictEqual(step.to, USDT_ADDR);
});

// ── Suite: writeStepsFile ────────────────────────────────────────────────────

console.log("\nwriteStepsFile");

test("writes valid JSON with stringified value", () => {
  import("fs").then(({ readFileSync }) => {
    const steps = [buildHedgedBuyCalldata(hedgedBuyArgs)];
    const file  = writeStepsFile(steps);
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Array<{
      to: string; data: string; value: string;
    }>;
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(typeof parsed[0].value, "string");  // bigint serialized as string
    assert.strictEqual(parsed[0].to, HEDGED_BUYER_ADDR);
    assert.ok(parsed[0].data.startsWith("0x"));
  });
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(40)}`);
console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
