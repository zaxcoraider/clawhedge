# ClawHedge

Autonomous BSC trading agent — buys meme tokens on Four.meme and hedges with a perp short.

> **Submission deadline: 3 days** | Built with PurrfectClaw + Foundry

---

## How It Works

1. Agent scans Four.meme for newly launched tokens
2. Runs GoPlus Security check (honeypot, rug, mint, hidden owner)
3. Buys the token with BNB via the bonding curve
4. Simultaneously opens a BNB perp short on MYX Finance as a hedge
5. User can close the hedge anytime to collect USDT payout ± PnL

---

## Status

| Step | What | Status |
|------|------|--------|
| 1 | PurrfectClaw agent onboarded | ✅ Done |
| 2 | Foundry project scaffolded (BSC mainnet + testnet) | ✅ Done |
| 3 | Four.meme real ABIs fetched & interfaces written | ✅ Done |
| 4 | HedgedBuyer.sol contract written | ✅ Done |
| 5 | Test suite (8 tests, BSC mainnet fork) | ✅ Done — all passing |
| 6 | Deploy scripts | ✅ Done |
| 7 | Deployed to BSC testnet (chain 97) | ✅ Done |
| 8 | All 5 skills published to Pieverse Skill Store | ✅ Done |
| 9 | Mainnet deploy | ⏳ Blocked — MYX router address not public |

---

## Agent Wallet

```
0x889bf5f700f532950Ba67Be0B16eaB3378b992E1
```

Managed by PurrfectClaw. Agent name: `clawhedge-zax-1776517111`.

---

## Deployed Contracts

| Network | Contract | Address |
|---------|----------|---------|
| BSC Testnet (97) | HedgedBuyer | [`0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae`](https://testnet.bscscan.com/address/0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae) |
| BSC Mainnet (56) | HedgedBuyer | Pending MYX router address |

---

## Skills (Pieverse Skill Store)

| Skill | Description | Link |
|-------|-------------|------|
| `clawhedge-safe-buy` | Buy Four.meme token with GoPlus safety check | [View](https://www.pieverse.io/skill-store?skill=56074) |
| `clawhedge-set-cap` | Set daily USDT spending cap on the contract | [View](https://www.pieverse.io/skill-store?skill=56076) |
| `clawhedge-close-hedge` | Close open BNB short hedge, receive USDT payout | [View](https://www.pieverse.io/skill-store?skill=56075) |
| `clawhedge-status` | View cap, open positions, agent BNB balance | [View](https://www.pieverse.io/skill-store?skill=56077) |
| `clawhedge-scan` | Scan Four.meme for safe tokens to buy | [View](https://www.pieverse.io/skill-store?skill=56078) |

---

## Contracts & Interfaces

### Four.meme (BSC mainnet)

| Contract | Address |
|----------|---------|
| TokenManager V2 | `0x5c952063c7fc8610FFDB798152D69F0B9550762b` |
| TokenManager V1 | `0xEC4549caDcE5DA21Df6E6422d448034B5233bFbC` |
| Helper3 (quotes) | `0xF251F83e40a78868FcfA3FA4599Dad6494E46034` |

Interfaces: `contracts/src/interfaces/IFourMemeTokenManager.sol`, `IFourMemeHelper3.sol`

Signatures sourced from `@pieverseio/purr-cli` production code — verified against live BSC blocks.

### Perp DEX (hedge leg)

MYX Finance is live on BSC but does not publish its router address. `IMYXRouter.sol` is a simplified adapter interface — drop in the real address when confirmed.

---

## Architecture

```
User
 ├── setCap(100 USDT)          → HedgedBuyer.sol (daily cap authorization)
 └── clawhedge-scan            → finds safe token

Agent (TEE)
 └── hedgedBuy(token, ...)
      ├── buyTokenAMAP()       → Four.meme TokenManager V2
      └── openShort()          → MYX Finance (perp hedge)

User
 └── userClose(positionId)     → HedgedBuyer.sol → MYX closePosition → USDT back
```

---

## Foundry

```bash
cd contracts

# Build
forge build

# Test (BSC mainnet fork)
BSC_RPC_URL=https://bsc-dataseed.binance.org forge test -vvv

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast
```

---

## Environment

Copy `.env.example` to `.env`:

```
BSC_RPC_URL=https://bsc-dataseed.binance.org
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=
DEPLOYER_PRIVATE_KEY=
TEE_AGENT_ADDRESS=0x889bf5f700f532950Ba67Be0B16eaB3378b992E1
FOURMEME_ADDR=0x5c952063c7fc8610FFDB798152D69F0B9550762b
MYX_ROUTER=
USDT_ADDR=0x55d398326f99059fF775485246999027B3197955
```

`.env` is gitignored — never commit it.
