# ClawHedge
> The first hedged trading agent on Four.meme. One message. Two protocols. One atomic transaction.

<!-- placeholder GIF — drop in after video recording -->

---

## The gap we fill

Every hackathon entry in this category is a long-only buyer. Meme trading without a short is a casino. ClawHedge is the first agent that ships both legs atomically — Four.meme buy + Level Finance perp short in a single BSC transaction.

---

## How it works

1. User messages the agent (WhatsApp, Telegram, Line — any Pieverse runtime)
2. DGrid routes 3 different models: cheap triage → strong decision → cheap explain
3. Pieverse TEE wallet signs
4. One BSC tx calls Four.meme and Level Finance through our HedgedBuyer contract
5. User sees BscScan link, tokens received, short open, max-loss cap enforced

---

## Bounty coverage

| Bounty | How ClawHedge hits it | Evidence |
|---|---|---|
| Main ($50K pool) | First hedged + atomic + multi-model agent in the field | See demo tx below |
| Pieverse ($2K) | 7 skills live on Skill Store | [Links below](#skills-pieverse-skill-store) |
| DGrid ($3K credits) | Multi-model routing: `qwen/qwen-flash` triage + `claude-sonnet-4.6` decision + `qwen/qwen-flash` explain — measurable call logs | `agent/src/dgrid.ts` |
| Level Finance | First ClawHedge skill using Level Finance perp shorts via TEE | `contracts/src/interfaces/ILevelOrderManager.sol` |

---

## Live artifacts

- **Testnet HedgedBuyer**: [`0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae`](https://testnet.bscscan.com/address/0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae)
- **Mainnet HedgedBuyer**: [`0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e`](https://bscscan.com/address/0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e)
- **Real atomic hedged trade**: `[bscscan tx — placeholder]`
- **Demo video**: `[YouTube link — placeholder]`

---

## Architecture

![Architecture](docs/architecture.svg)

```
User message (any Pieverse runtime)
        │
        ▼
┌─────────────────────────────────┐
│         DGrid AI Brain          │
│  qwen-flash  →  claude-sonnet   │
│  (triage)       (decision)      │
│         ↓                       │
│  qwen-flash (explain to user)   │
└──────────────┬──────────────────┘
               │
        Pieverse TEE Wallet
               │
               ▼
┌─────────────────────────────────┐
│       HedgedBuyer.sol (BSC)     │
│                                 │
│  buyTokenAMAP() ──→ Four.meme   │
│  placeOrder()   ──→ Level Fin.  │
└─────────────────────────────────┘
```

---

## Skills (Pieverse Skill Store)

| Skill | Description | Link |
|---|---|---|
| `clawhedge-scan` | Scan Four.meme, GoPlus filter, rank by liquidity | [View](https://www.pieverse.io/skill-store?skill=56078) |
| `clawhedge-safe-buy` | Buy with GoPlus honeypot check | [View](https://www.pieverse.io/skill-store?skill=56074) |
| `clawhedge-set-cap` | Set daily USDT spending cap | [View](https://www.pieverse.io/skill-store?skill=56076) |
| `clawhedge-close-hedge` | Close Level Finance short, receive USDT | [View](https://www.pieverse.io/skill-store?skill=56075) |
| `clawhedge-status` | View cap, positions, agent BNB balance | [View](https://www.pieverse.io/skill-store?skill=56077) |
| `clawhedge-level-short` | Open Level Finance perp short via TEE | [View](https://www.pieverse.io/skill-store?skill=56079) |
| `clawhedge` | Atomic hedged buy — Four.meme + Level Finance in one tx | [View](https://www.pieverse.io/skill-store?skill=57064) |

---

## Repo layout

```
clawhedge/
├── contracts/
│   ├── src/
│   │   ├── HedgedBuyer.sol               # core contract — buy + hedge atomically
│   │   └── interfaces/
│   │       ├── IFourMemeTokenManager.sol  # real Four.meme ABI
│   │       ├── IFourMemeHelper3.sol       # quote helper
│   │       ├── ILevelOrderManager.sol     # Level Finance perp interface
│   │       └── IERC20.sol
│   ├── test/HedgedBuyer.t.sol             # 8 tests, BSC mainnet fork
│   └── script/Deploy.s.sol
├── agent/
│   └── src/
│       ├── index.ts                       # CLI: dry-run, build-myx-short, etc.
│       ├── dgrid.ts                       # 3-model DGrid routing
│       ├── signals.ts                     # Bitquery Four.meme scanner
│       ├── safety.ts                      # GoPlus check
│       ├── decisions.ts                   # orchestration pipeline
│       ├── calldata.ts                    # ABI-encoded tx builder
│       └── types.ts
├── frontend/                              # Next.js live dashboard (Vercel)
├── skills/                                # Pieverse Skill Store packages
│   ├── clawhedge-scan/
│   ├── clawhedge-safe-buy/
│   ├── clawhedge-set-cap/
│   ├── clawhedge-close-hedge/
│   ├── clawhedge-status/
│   └── clawhedge-level-short/
├── docs/
│   ├── bounty-map.md
│   ├── architecture.svg
│   └── demo-script.md
└── logo.svg
```

---

## Reproduce from scratch

```bash
git clone https://github.com/zaxcoraider/clawhedge && cd clawhedge
cp .env.example .env  # fill keys

# Contracts
cd contracts && forge install && forge test --fork-url $BSC_RPC_URL

# Agent dry-run
cd ../agent && npm install
npx tsx src/index.ts dry-run --user 0x889bf5f700f532950Ba67Be0B16eaB3378b992E1 --max-usdt 10

# Frontend
cd ../frontend && npm install && npm run dev
```

**Expected:** all 8 forge tests pass. Agent prints `Action JSON` with 3 DGrid model calls logged (triage / decision / explain).

---

## Honest limitations

- Mainnet deploy pending final environment setup — testnet contract is fully functional
- TEE attestation verification is trust-on-first-use via Pieverse runtime; enclave measurements not independently verified
- Single chain (BSC). opBNB extension is a future increment
- DGrid API requires funded account; dry-run falls back to mock action if balance is zero

---

## Credits

Built on **Pieverse Purr-fect Claw** · **DGrid AI Gateway** · **Level Finance** · **Four.meme** · **BNB Chain**
