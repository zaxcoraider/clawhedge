---
name: clawhedge-scan
description: Scan Four.meme for recently launched BSC tokens, run GoPlus Security checks on each, and surface the safest candidates for the agent to buy.
---

# ClawHedge Scan

## Tool: scan_fourmeme_tokens

Fetches recently traded tokens from Four.meme (last 30 minutes), runs GoPlus Security honeypot checks on each, and returns the safest candidates by volume. This is the discovery step — it does not execute any trades.

### Parameters

- `maxResults` (number, optional): how many results to show (default: `5`, max: `5`)

### Execution

**Step 1 — Call the ClawHedge scan API**

```
curl -sf "https://clawhedge.vercel.app/api/scan-simple"
```

This single call does everything: queries Bitquery for the top 20 Four.meme tokens by volume in the last 30 minutes, runs GoPlus checks on the top 5, and returns clean JSON.

**Step 2 — Parse and display the response**

The response has this shape:
```json
{
  "ok": true,
  "scannedAt": "2025-01-01T00:00:00.000Z",
  "count": 5,
  "tokens": [
    {
      "symbol": "KICAU",
      "address": "0xabc...4444",
      "volumeUSD": "12500",
      "trades": 87,
      "safe": true,
      "flags": [],
      "liquidity": "BONDING",
      "bscscan": "https://bscscan.com/token/0xabc...4444"
    }
  ]
}
```

**Step 3 — Format and return results**

```
═══ ClawHedge Scan Results ═══════════════════════════
Scanned at: <scannedAt>  |  Top tokens by 30-min volume

1. <SYMBOL>
   Address   : <address>
   Volume    : $<volumeUSD> (last 30 min)
   Trades    : <trades>
   Liquidity : <liquidity>
   Safety    : ✅ SAFE — no flags
   BscScan   : <bscscan>
   → Buy with: clawhedge-safe-buy token=<address>

2. <SYMBOL>  ⚠️ FLAGGED: <flags joined by comma>
   Address   : <address>
   Volume    : $<volumeUSD>
   Safety    : ❌ SKIP — <flags>
   BscScan   : <bscscan>

...
══════════════════════════════════════════════════════
✅ Safe to buy: list SAFE tokens
Use clawhedge-safe-buy to execute a trade on any safe token.
```

If `ok` is false: "Scan failed — the backend returned an error. Try again in a moment."

If all tokens have flags: "No fully safe tokens found right now. Check back in a few minutes — new tokens launch every 2-3 minutes on Four.meme."

### Notes

- This skill never executes trades — it only surfaces candidates.
- To buy a safe result, use `clawhedge-safe-buy` (no hedge) or `clawhedge` (with Level Finance hedge).
- `liquidity: "BONDING"` means the token is still on the bonding curve — this is normal and expected for new Four.meme tokens.
- `flags` may include: `is_honeypot`, `cannot_sell_all`, `transfer_pausable`, `hidden_owner`. Any flag = skip.
- Run every 5–10 minutes during active sessions for fresh results.
