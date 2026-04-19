---
name: clawhedge-set-cap
description: Set or update your daily USDT spending cap on the ClawHedge contract, authorising the agent to hedge on your behalf up to that limit per 24-hour epoch.
---

# ClawHedge Set Cap

## Tool: set_daily_cap

Calls `setCap(uint256)` on the deployed HedgedBuyer contract. This starts a fresh 24-hour epoch and authorises the TEE agent to spend up to `capUsdt` USDT on hedge collateral during that window. After 24 hours the cap resets to zero — you must call this again each day.

### Parameters

- `capUsdt` (number): maximum USDT the agent may spend on hedge collateral today (e.g. `100` = 100 USDT, 18-decimal on BSC)
- `network` (string, optional): `mainnet` (default) or `testnet`

### Execution

**Step 1 — Resolve contract address**

| Network | HedgedBuyer address |
|---|---|
| BSC mainnet | `0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae` *(update when mainnet deployed)* |
| BSC testnet | `0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae` |

**Step 2 — Convert cap to wei**

```
capWei = capUsdt * 10^18
```

e.g. `100 USDT` → `100000000000000000000`

**Step 3 — Send the transaction**

```
cast send <CONTRACT_ADDRESS> \
  "setCap(uint256)" <capWei> \
  --rpc-url <RPC_URL> \
  --private-key <USER_PRIVATE_KEY>
```

Where `<RPC_URL>` is:
- mainnet: `https://bsc-dataseed.binance.org`
- testnet: `https://data-seed-prebsc-1-s1.binance.org:8545`

**Step 4 — Confirm and return**

Wait for transaction receipt. Return to user:

```
Cap set to <capUsdt> USDT/day. Resets in 24 hours.
Tx: https://bscscan.com/tx/<hash>
```

### Notes

- The user (not the agent) must sign this transaction — it is a self-authorisation.
- The epoch starts immediately from the block timestamp of this transaction.
- To revoke agent access, call `setCap(0)`.
