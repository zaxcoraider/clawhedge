---
name: clawhedge-myx-short
description: Open a short perpetual on MYX Finance via your Purr-fect Claw TEE wallet. First MYX skill in the ecosystem.
---

# ClawHedge MYX Short

## Tool: open_myx_short

Opens a short perpetual on MYX Finance on BSC. Uses the TEE wallet — no key management.

### Parameters

- `market` (string): MYX market, e.g. `"BTC-USDT"`, `"BNB-USDT"`
- `usdtCollateral` (number): USDT to post as collateral (min 5)
- `leverageX` (number, 1–10): leverage multiplier
- `maxSlippageBps` (number, default 50): price slippage tolerance

### Safety

- REFUSE if `leverageX` > 10
- REFUSE if `usdtCollateral` < 5
- REFUSE if user's wallet USDT balance < `usdtCollateral`

### Execution

**Step 1 — Fetch current mark price from MYX**

```
curl -sf "https://api.myx.finance/public/price?market=<market>" | jq .markPrice
```

**Step 2 — Compute minimum short price**

```
minShortPrice = markPrice * (10000 - maxSlippageBps) / 10000
```

**Step 3 — Build transaction steps file**

```
npx tsx ~/clawhedge/agent/src/index.ts build-myx-short \
  --market <market> \
  --collateral <usdtCollateral> \
  --leverage <leverageX> \
  --min-price <minShortPrice>
```

Capture the printed steps file path from output.

**Step 4 — Execute via purr**

```
purr execute --file <steps_path>
```

**Step 5 — Return result**

Parse output for tx hash and return:

```
Opened <leverageX>x short on <market> with <usdtCollateral> USDT collateral.
Tx: https://bscscan.com/tx/<hash>
```

### Closing positions

To close, generate a close steps file and execute:

```
npx tsx ~/clawhedge/agent/src/index.ts build-myx-close --position-id <id>
purr execute --file <steps_path>
```
