---
name: clawhedge
description: Atomic hedged Four.meme buy with Level Finance short on BSC. One transaction, two protocols, zero key management.
---

# ClawHedge — Atomic Hedged Meme Trading

The first skill that combines a Four.meme bonding-curve buy with a Level Finance perpetual short in a **single atomic BSC transaction**. If either leg fails, both revert — you never end up with a naked long.

## Tool: hedged_buy

### Parameters

- `token` (string, 0x address): Four.meme token to buy
- `bnbAmount` (number): BNB to spend on the buy (e.g. `0.01`)
- `hedgeRatio` (number, 0–1): fraction of position value to hedge via short (e.g. `0.5` = 50%)
- `userAddress` (string, 0x address): user on whose behalf to act

### Safety

- REFUSE if GoPlus flags the token (honeypot, unsellable, mintable, hidden owner)
- REFUSE if `hedgeRatio` > 1 or `bnbAmount` <= 0
- REFUSE if user daily cap on HedgedBuyer is not set or would be exceeded

---

### Execution

**Step 1 — GoPlus safety check**

```
curl -sf "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=<token>" \
  | jq '.result[("<token>" | ascii_downcase)] | {is_honeypot, cannot_sell_all, transfer_pausable, is_mintable, hidden_owner}'
```

If any flag is `"1"`, REFUSE and tell the user which flag triggered.

**Step 2 — DGrid multi-model decision**

```
npx tsx ~/clawhedge/agent/src/index.ts dry-run \
  --user <userAddress> \
  --max-usdt 50
```

This runs triage → decision → explain through DGrid. Capture the Action JSON output.
If Action.type is `"HOLD"`, tell the user: "Agent decided to hold — no edge found right now."
If Action.type is `"BUY_AND_HEDGE"`, proceed with the values in the Action JSON.

**Step 3 — Check user's daily cap**

```
cast call 0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e \
  "userCaps(address)(uint256,uint256,uint256)" <userAddress> \
  --rpc-url https://bsc-dataseed.binance.org/
```

Returns `(cap, spent, resetAt)`. If `cap` is 0, tell the user:

```
Your daily cap is not set. Set it first:
cast send 0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e \
  "setDailyCap(uint256)" <cap_in_wei> \
  --from <userAddress>
```

If `spent + usdtHedge > cap`, tell the user their cap is insufficient.

**Step 4 — Verify USDT approval**

```
cast call 0x55d398326f99059fF775485246999027B3197955 \
  "allowance(address,address)(uint256)" <userAddress> 0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e \
  --rpc-url https://bsc-dataseed.binance.org/
```

If allowance < usdtHedge (in wei, 18 decimals), tell the user:

```
Approve USDT first from your wallet:
cast send 0x55d398326f99059fF775485246999027B3197955 \
  "approve(address,uint256)" 0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e <amount_in_wei> \
  --from <userAddress>
```

**Step 5 — Build atomic calldata**

```
npx tsx ~/clawhedge/agent/src/index.ts build-hedged-buy \
  --token <token> \
  --bnb <bnbAmount> \
  --hedge-usdt <usdtHedge> \
  --leverage <leverage> \
  --user <userAddress>
```

Capture the printed steps file path.

**Step 6 — Execute atomically via TEE**

```
purr execute --file <steps_path>
```

This is the single on-chain transaction. Four.meme buy + Level Finance short execute atomically. If either reverts, the whole tx reverts.

**Step 7 — Wait for confirmation (~15s on BSC)**

Parse the tx hash from purr output and confirm:

```
cast receipt <tx_hash> --rpc-url https://bsc-dataseed.binance.org/ --confirmations 3
```

**Step 8 — Return result to user**

```
npx tsx ~/clawhedge/agent/src/index.ts explain \
  --tx <tx_hash>
```

Returns a one-sentence summary via DGrid explain model, e.g.:

```
Bought <X> tokens for <bnbAmount> BNB and opened a <leverage>x BNB short
on Level Finance with <usdtHedge> USDT collateral — downside hedged.
Tx: https://bscscan.com/tx/<hash>
```

---

### Why atomic matters

If the buy succeeds but the short fails, you hold a naked long on a meme coin — the exact outcome hedging is supposed to prevent. `HedgedBuyer.sol` reverts both legs if either fails. No other agent in the Four.meme ecosystem ships this.

### User escape hatch

You can close your hedge any time, independently of the agent:

```
cast send 0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e \
  "userClose(uint256)" <positionId> \
  --from <your_wallet> \
  --rpc-url https://bsc-dataseed.binance.org/
```

The agent **cannot** block this. Use `clawhedge-status` to find your positionId.

---

### Contract addresses (BSC mainnet)

| Contract | Address |
|---|---|
| HedgedBuyer | `0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e` |
| Four.meme TokenManager V2 | `0x5c952063c7fc8610FFDB798152D69F0B9550762b` |
| Level Finance OrderManager | `0xf584A17dF21Afd9de84F47842ECEAF6042b1Bb5b` |
| USDT (BSC) | `0x55d398326f99059fF775485246999027B3197955` |
