---
name: clawhedge-level-short
description: Open a BNB short perpetual on Level Finance via your Purr-fect Claw TEE wallet. Hedge your meme token exposure in one message.
---

# ClawHedge Level Short

## Tool: open_level_short

Opens a short perpetual on Level Finance (BSC) using the Purr-fect Claw TEE wallet. No key management — the TEE handles signing.

### Parameters

- `market` (string): market to short, e.g. `"BNB-USDT"`, `"BTC-USDT"`, `"ETH-USDT"`
- `usdtCollateral` (number): USDT to post as collateral (min 5)
- `leverageX` (number, 1–10): leverage multiplier
- `maxSlippageBps` (number, default 50): price slippage tolerance in basis points

### Safety

- REFUSE if `leverageX` > 10
- REFUSE if `usdtCollateral` < 5
- REFUSE if user's wallet USDT balance < `usdtCollateral`

### Execution

**Step 1 — Fetch current BNB mark price**

Convert `market` to Binance symbol (e.g. `BNB-USDT` → `BNBUSDT`):

```
curl -sf "https://api.binance.com/api/v3/ticker/price?symbol=<SYMBOL>" | jq -r '.price | tonumber'
```

**Step 2 — Compute minimum short price (slippage floor)**

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
Opened <leverageX>x BNB short on Level Finance with <usdtCollateral> USDT collateral.
Your downside is now hedged.
Tx: https://bscscan.com/tx/<hash>
```

### Closing a position

To close, provide the position ID shown in your `clawhedge-status` output:

```
npx tsx ~/clawhedge/agent/src/index.ts build-myx-close --position-id <id>
purr execute --file <steps_path>
```

Returns USDT to your TEE wallet.

### Notes

- Level Finance OrderManager: `0xf584A17dF21Afd9de84F47842ECEAF6042b1Bb5b` (BSC mainnet)
- Orders are async — position appears in `clawhedge-status` after the next Level Finance keeper run (~30s)
- Use `clawhedge-close-hedge` skill to close positions opened via `clawhedge-hedged-buy`
