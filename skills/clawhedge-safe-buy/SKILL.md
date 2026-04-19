---
name: clawhedge-safe-buy
description: Buy a Four.meme token only after passing GoPlus Security honeypot and rug checks on BSC.
---

# ClawHedge Safe Buy

## Tool: safe_buy_four_meme

Buys a Four.meme token after a mandatory GoPlus Security check. Refuses trade if the token is a honeypot, unsellable, or has suspicious transfer controls.

### Parameters

- `token` (string, BSC address 0x...): Four.meme token contract to buy
- `bnbAmount` (number): how much BNB to spend (e.g. `0.01`)
- `slippage` (number, 0–1): maximum acceptable slippage, e.g. `0.05` = 5%
- `minTokensOut` (string, optional): slippage floor in token wei — refuse if output would be below this

### Execution

**Step 1 — GoPlus Security check**

```
curl -sf "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=<token>" \
  | jq '.result["<token_lowercase>"]'
```

Parse the following flags from the response. If **any** is `"1"`, **refuse the trade** and tell the user exactly which flag triggered:

| Flag | Meaning |
|---|---|
| `is_honeypot` | Cannot sell — complete rug |
| `cannot_sell_all` | Sell blocked for some or all holders |
| `transfer_pausable` | Owner can freeze transfers at will |
| `is_mintable` | Owner can inflate supply |
| `hidden_owner` | True owner is obscured |

**Step 2 — Liquidity floor**

From the same GoPlus response, read the `liquidity` field (USD value). If `liquidity < 1000`, refuse with:
> "Liquidity too low ($<value>) — trade refused."

**Step 3 — Execute the buy**

All checks passed. Run:

```
purr fourmeme buy \
  --token <token> \
  --wallet <WALLET_ADDRESS> \
  --amount <bnbAmount> \
  --slippage <slippage> \
  --min-out <minTokensOut>
```

Where `<WALLET_ADDRESS>` is the TEE agent wallet configured in the environment.

Omit `--min-out` if the parameter was not provided.

**Step 4 — Return result**

Parse the JSON output, extract the transaction hash, and return to the user:

```
Bought <token> for <bnbAmount> BNB. Tx: https://bscscan.com/tx/<hash>
```

If the command returns an error, surface the error message verbatim and do not retry.

### Safety Notes

- This skill **never hedges**. For hedged buys with downside protection, use the `clawhedge` skill instead.
- Refuses trades when GoPlus flags any risk or liquidity is below $1,000.
- The GoPlus check runs on every invocation — it cannot be skipped.
