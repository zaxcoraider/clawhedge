---
name: clawhedge-status
description: Show your ClawHedge portfolio — open hedge positions, daily cap remaining, epoch reset time, and agent wallet BNB balance.
---

# ClawHedge Status

## Tool: get_clawhedge_status

Read-only overview of the user's ClawHedge state: daily cap, USDT spent so far, epoch reset time, open position IDs, and the agent wallet's BNB balance.

### Parameters

- `userAddress` (string, BSC address 0x...): the wallet to inspect
- `network` (string, optional): `mainnet` (default) or `testnet`

### Execution

**Step 1 — Read cap state from contract**

```
cast call <CONTRACT_ADDRESS> \
  "userCaps(address)(uint256,uint256,uint256)" <userAddress> \
  --rpc-url <RPC_URL>
```

Returns `(cap, spent, resetAt)` in wei. Convert:
- `capUsdt  = cap / 10^18`
- `spentUsdt = spent / 10^18`
- `remainingUsdt = capUsdt - spentUsdt`
- `resetAt` is a Unix timestamp → format as human-readable time

**Step 2 — Read open positions**

Iterate `userPositions(address, uint256)` starting at index 0 until it reverts:

```
cast call <CONTRACT_ADDRESS> \
  "userPositions(address,uint256)(uint256)" <userAddress> <index> \
  --rpc-url <RPC_URL>
```

Collect all returned position IDs.

**Step 3 — Read agent BNB balance**

```
purr wallet balance
```

**Step 4 — Return formatted summary**

```
═══ ClawHedge Status ══════════════════
Wallet : <userAddress>
Cap    : <capUsdt> USDT/day
Spent  : <spentUsdt> USDT  (remaining: <remainingUsdt> USDT)
Resets : <human-readable resetAt>

Open positions : <count>
  #<positionId>  (close with: clawhedge-close-hedge)
  ...

Agent BNB      : <balance> BNB
═══════════════════════════════════════
```

If `cap == 0`: show "No cap set — call clawhedge-set-cap to authorise the agent."
If no positions: show "No open hedge positions."

### Notes

- This skill is read-only — no transactions are sent.
- Contract addresses:
  - BSC testnet: `0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae`
  - BSC mainnet: *(pending)*
