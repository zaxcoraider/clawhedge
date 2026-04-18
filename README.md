# ClawHedge

Autonomous BSC trading agent — buys meme tokens on Four.meme and hedges with a perp short.

---

## Status

| Step | What | Status |
|------|------|--------|
| 1 | PurrfectClaw agent onboarded | ✅ Done |
| 2 | Foundry project scaffolded (BSC mainnet + testnet) | ✅ Done |
| 3 | Four.meme real ABIs fetched & interfaces written | ✅ Done |
| 4 | Perp DEX interface (hedge leg) | ⏳ Blocked — MYX has no public BSC router address. Awaiting fallback decision. |
| 5 | HedgedBuyer.sol contract | ⏳ Not started |
| 6 | Deploy scripts | ⏳ Not started |
| 7 | Tests | ⏳ Not started |

---

## Agent Wallet (BSC mainnet, chain 56)

```
0x889bf5f700f532950Ba67Be0B16eaB3378b992E1
```

Managed by PurrfectClaw. Agent name: `clawhedge-zax-1776517111`.  
Credentials stored in `~/.purrfectclaw/.env` (never committed).

---

## Contracts / Interfaces

### Four.meme (BSC mainnet)

| Contract | Address |
|----------|---------|
| TokenManager V2 | `0x5c952063c7fc8610FFDB798152D69F0B9550762b` |
| TokenManager V1 | `0xEC4549caDcE5DA21Df6E6422d448034B5233bFbC` |
| Helper3 (quotes) | `0xF251F83e40a78868FcfA3FA4599Dad6494E46034` |

Interfaces written:
- `contracts/src/interfaces/IFourMemeTokenManager.sol` — `buyTokenAMAP`, `sellToken`, `createToken`, `TokenPurchase` event
- `contracts/src/interfaces/IFourMemeHelper3.sol` — `getTokenInfo`, `tryBuy`, `trySell`

Signatures are **real** — sourced from `@pieverseio/purr-cli` production code and verified:
- `TokenPurchase` topic `0x7db52723...` confirmed from live BSC block 93277991

### Perp DEX (hedge leg)

- MYX Finance confirmed live on BSC but **does not publish its router address**. Blocked.
- Fallback options discussed: Level Finance, Gains Network, Tigris — awaiting your call.

### Standard

- `contracts/src/interfaces/IERC20.sol`

---

## Foundry Setup

```toml
# contracts/foundry.toml
solc     = 0.8.24
chains   = bsc (56), bsc_testnet (97)
RPCs     = $BSC_RPC_URL, $BSC_TESTNET_RPC_URL
verifier = BscScan ($BSCSCAN_API_KEY)
```

```bash
cd contracts && forge build   # compiles clean, 0 errors
```

---

## Environment

Copy `.env.example` to `.env` and fill in:

```
BSC_RPC_URL=https://bsc-dataseed.binance.org
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=
BITQUERY_TOKEN=
DGRID_API_KEY=
DEPLOYER_PRIVATE_KEY=
TEE_AGENT_ADDRESS=
```

`.env` is gitignored — never commit it.

---

## Tools Installed

| Tool | Version | Location |
|------|---------|----------|
| Foundry (forge/cast/anvil) | 1.5.1-stable | `~/.foundry/bin/` |
| purr CLI | 0.2.2 | `~/.purrfectclaw/bin/purr` |
| PurrfectClaw skills | 14 bundles | `~/.purrfectclaw/skills/` |

---

## Next Steps

1. Confirm perp DEX fallback (replace MYX) → write `IMYXRouter.sol` (or equivalent)
2. Write `HedgedBuyer.sol` — buys on Four.meme + opens hedge short in one tx
3. Deploy to BSC testnet (97), verify on BscScan
4. Integration tests with Foundry fork
