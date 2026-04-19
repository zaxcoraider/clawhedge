---
name: clawhedge-close-hedge
description: Close an open BNB short hedge on ClawHedge and receive the USDT payout (collateral ± PnL) back to your wallet.
---

# ClawHedge Close Hedge

## Tool: close_hedge_position

Calls `userClose(uint256 positionId, uint256 minIndexPrice)` on the HedgedBuyer contract. Closes the specified perp short position, returning USDT collateral ± PnL directly to the caller's wallet. Only the wallet that opened the position can close it.

### Parameters

- `positionId` (number): the position ID returned when the hedge was opened (visible in the `HedgedBuy` event or via `clawhedge-status`)
- `minBnbPrice` (number): minimum acceptable BNB price in USD for the close (18-dec). Set to `0` to accept any price (market close). e.g. `580` = $580 floor
- `network` (string, optional): `mainnet` (default) or `testnet`

### Execution

**Step 1 — Resolve contract address**

| Network | HedgedBuyer address |
|---|---|
| BSC testnet | `0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae` |
| BSC mainnet | *(deploy pending — update here)* |

**Step 2 — Convert minBnbPrice to 18-decimal**

```
minIndexPrice = minBnbPrice * 10^18
```

e.g. `580` USD → `580000000000000000000`

Set to `0` for a market close with no price floor.

**Step 3 — Send the transaction**

```
cast send <CONTRACT_ADDRESS> \
  "userClose(uint256,uint256)" <positionId> <minIndexPrice> \
  --rpc-url <RPC_URL> \
  --private-key <USER_PRIVATE_KEY>
```

**Step 4 — Parse receipt and return**

Look for the `PositionClosed` event in the receipt logs:

```
PositionClosed(address indexed user, uint256 positionId, uint256 payout)
```

Convert `payout` from wei to USDT (divide by 10^18). Return:

```
Hedge closed. Received <payout> USDT.
Tx: https://bscscan.com/tx/<hash>
```

### Notes

- If `payout` is less than the original `hedgeUsdt`, the short position had a loss (BNB went up).
- If `payout` is greater, the hedge was profitable (BNB fell, protecting your meme bag).
- Reverts with `NotYourPosition` if called from a wallet that did not open this position.
