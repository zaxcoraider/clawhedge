---
name: clawhedge-scan
description: Scan Four.meme for recently launched BSC tokens, run GoPlus Security checks on each, and surface the safest candidates for the agent to buy.
---

# ClawHedge Scan

## Tool: scan_fourmeme_tokens

Fetches recently created tokens from the Four.meme public API, filters them through GoPlus Security honeypot and rug checks, and returns a ranked shortlist of tokens that pass all safety gates. This is the discovery step — it does not execute any trades.

### Parameters

- `maxResults` (number, optional): how many passing tokens to return (default: `5`)
- `minLiquidityUsd` (number, optional): minimum liquidity in USD (default: `1000`)
- `maxAgeMinutes` (number, optional): only consider tokens launched within this window (default: `60`)

### Execution

**Step 1 — Fetch recent tokens from Four.meme**

```
curl -sf "https://four.meme/meme-api/v1/public/token/list?status=TRADING&orderBy=CREATED_AT&direction=DESC&pageSize=50" \
  | jq '[.data.list[] | {address: .tokenAddress, name: .name, symbol: .shortName, createdAt: .createTime, liquidity: .liquidity}]'
```

Filter to tokens created within `maxAgeMinutes`.

**Step 2 — GoPlus check each token**

For each candidate address, run:

```
curl -sf "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=<token>" \
  | jq '.result["<token_lowercase>"] | {is_honeypot, cannot_sell_all, transfer_pausable, is_mintable, hidden_owner, liquidity}'
```

Discard any token where:
- any of `is_honeypot`, `cannot_sell_all`, `transfer_pausable`, `is_mintable`, `hidden_owner` equals `"1"`
- `liquidity` (USD) < `minLiquidityUsd`

**Step 3 — Rank survivors**

Sort passing tokens by `liquidity` descending. Take top `maxResults`.

**Step 4 — Return shortlist**

```
═══ ClawHedge Scan Results ════════════════════
Found <N> tokens passing all safety checks:

1. <NAME> (<SYMBOL>)
   Address   : <token>
   Liquidity : $<liquidity>
   Age       : <X> minutes old
   GoPlus    : ✅ all clear
   Buy with  : clawhedge-safe-buy token=<address> bnbAmount=0.01 slippage=0.05

2. ...
═══════════════════════════════════════════════
```

If no tokens pass: "No tokens passed safety checks in the last `<maxAgeMinutes>` minutes. Try again shortly or widen the window."

### Notes

- This skill never executes trades — it only surfaces candidates.
- To buy a result, use `clawhedge-safe-buy` (no hedge) or `clawhedge-hedged-buy` (with BNB short).
- Tokens on Four.meme graduate to PancakeSwap once the bonding curve fills 24 BNB — only buy pre-graduation tokens.
- Run every 5–10 minutes during active sniping sessions for best results.
