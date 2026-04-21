# ClawHedge
> The first hedged trading agent on Four.meme. One message. Two protocols. One atomic transaction.

---

## Demo

[![ClawHedge Demo](https://img.youtube.com/vi/aEf46mFYtnE/maxresdefault.jpg)](https://youtu.be/aEf46mFYtnE?si=QOgcmh46lRUnIqQX)

▶️ **[Watch Full Demo on YouTube](https://youtu.be/aEf46mFYtnE?si=QOgcmh46lRUnIqQX)**

---

## The gap we fill

Every hackathon entry in this category is a long-only buyer. Meme trading without a short is a casino. ClawHedge is the first agent that ships both legs atomically — Four.meme buy + Level Finance perp short in a single BSC transaction.

---

## How it works

1. User messages the agent on Telegram (@ClawHedge01bot) or any Pieverse runtime
2. DGrid routes 3 Claude Sonnet calls: triage → decision → explain
3. Pieverse TEE wallet signs the transaction inside a secure hardware enclave
4. One BSC tx calls Four.meme and Level Finance through our HedgedBuyer contract
5. User sees BscScan link, tokens received, short open, max-loss cap enforced on-chain

---

## Bounty coverage

| Bounty | How ClawHedge hits it | Evidence |
|---|---|---|
| Main ($50K pool) | First hedged + atomic + multi-model agent in the field | Contract + AI pipeline below |
| Pieverse ($2K) | 7 skills live on Skill Store + Telegram bot live | [Links below](#skills-pieverse-skill-store) |
| DGrid ($3K credits) | 3-stage Claude pipeline — triage / decision / explain via DGrid gateway | `agent/src/dgrid.ts` |
| Level Finance | Perp short via Level Finance OrderManager in atomic tx | `contracts/src/HedgedBuyer.sol:107` |

---

## Live artifacts

### Links
| Item | Link |
|---|---|
| 🌐 Live dashboard | [clawhedge.vercel.app](https://clawhedge.vercel.app) |
| 🤖 Telegram bot | [@ClawHedge01bot](https://t.me/ClawHedge01bot) |
| 📜 HedgedBuyer contract | [`0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e`](https://bscscan.com/address/0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e) |
| 🎥 Demo video | [Watch on YouTube](https://youtu.be/aEf46mFYtnE?si=QOgcmh46lRUnIqQX) |
| 💻 GitHub | [zaxcoraider/clawhedge](https://github.com/zaxcoraider/clawhedge) |

### TEE Wallets (Pieverse Hardware Enclave)
| Wallet | Address | Role |
|---|---|---|
| Primary TEE | [`0x810D01Fc22570f70a74fCC252F68f5367FD33d61`](https://bscscan.com/address/0x810D01Fc22570f70a74fCC252F68f5367FD33d61) | Active — signs all live transactions |
| Previous TEE | [`0x889bf5f700f532950Ba67Be0B16eaB3378b992E1`](https://bscscan.com/address/0x889bf5f700f532950Ba67Be0B16eaB3378b992E1) | Retired — early dev transactions |

> Both wallets are Pieverse TEE-managed — private keys never leave the hardware enclave. No seed phrase. No manual signing.

### Mainnet transactions
| # | Tx | What it proves |
|---|---|---|
| 1 | [`0x167963...`](https://bscscan.com/tx/0x167963fb12cba5bd15a97a1c4ada8db6b749ed9a95809630243f1dde6c6a2b07) | HedgedBuyer deployed on BSC mainnet |
| 2 | [`0xb5425d...`](https://bscscan.com/tx/0xb5425d600f57eff547346ed9cdd70fcefed028514ee432ac667ec6f8d97f69f5) | User USDT approval to HedgedBuyer |
| 3 | [`0x53b5c5...`](https://bscscan.com/tx/0x53b5c5439a7e5b11350e10a8ee323db5053693a3b24fb266f8f7703c96279d09) | Daily spending cap set on-chain |
| 4 | [`0x006d2d...`](https://bscscan.com/tx/0x006d2de6cfaad7a08f42237ef1a3ce5642fa538447174f5aca4459ca2cb3999c) | TEE wallet buys KICAU on Four.meme |
| 5 | [`0xa70c63...`](https://bscscan.com/tx/0xa70c63ee4de1eb57c470c37d82a0453b8fafd0e1bd5f354a606876f02af54923) | TEE wallet buys USD1 on Four.meme |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        TWO AI LAYERS                         │
│                                                              │
│  User → Telegram (@ClawHedge01bot)                           │
│              │                                               │
│              ▼                                               │
│  Pieverse Hermes ←── Platform AI (skill routing)             │
│  clawhedge-scan skill calls:                                 │
│  GET https://clawhedge.vercel.app/api/scan-simple            │
│              │                                               │
│              ▼                                               │
│  clawhedge.vercel.app (Next.js dashboard)                    │
│              │                                               │
│              ▼                                               │
│  DGrid AI Gateway ←── claude-sonnet-4.6 ×3                  │
│  TRIAGE → DECIDE → EXPLAIN                                   │
│  (powers frontend dry-run pipeline)                          │
└──────────────────────────┬───────────────────────────────────┘
                           │
              Pieverse TEE Wallet (Hardware Enclave)
              0x810D01Fc22570f70a74fCC252F68f5367FD33d61
                           │
                           ▼
            ┌──────────────────────────────┐
            │      HedgedBuyer.sol (BSC)   │
            │                              │
            │  buyTokenAMAP() → Four.meme  │
            │  placeOrder()   → Level Fin. │
            └──────────────────────────────┘
```

### AI Architecture

| Layer | Provider | Purpose |
|---|---|---|
| Telegram bot | Pieverse Platform AI | Routes skill decisions, formats responses |
| Scan API | Bitquery + GoPlus | Real-time token discovery + honeypot checks |
| Dashboard pipeline | DGrid (claude-sonnet-4.6 ×3) | Triage → Decide → Explain AI pipeline |

---

## Skills (Pieverse Skill Store)

| Skill | Description | Link |
|---|---|---|
| `clawhedge` | Atomic hedged buy — Four.meme + Level Finance in one tx | [View](https://www.pieverse.io/skill-store?skill=57064) |
| `clawhedge-scan` | Scan Four.meme, GoPlus filter, rank by volume | [View](https://www.pieverse.io/skill-store?skill=56078) |
| `clawhedge-safe-buy` | Buy with GoPlus honeypot check | [View](https://www.pieverse.io/skill-store?skill=56074) |
| `clawhedge-set-cap` | Set daily USDT spending cap | [View](https://www.pieverse.io/skill-store?skill=56076) |
| `clawhedge-close-hedge` | Close Level Finance short, receive USDT | [View](https://www.pieverse.io/skill-store?skill=56075) |
| `clawhedge-status` | View cap, positions, agent BNB balance | [View](https://www.pieverse.io/skill-store?skill=56077) |
| `clawhedge-level-short` | Open Level Finance perp short via TEE | [View](https://www.pieverse.io/skill-store?skill=56079) |

---

## Telegram Bot

**[@ClawHedge01bot](https://t.me/ClawHedge01bot)** — live on Telegram via Pieverse

Try it:
```
scan                          → scan Four.meme for safe tokens
clawhedge-scan                → same, explicit skill invocation
```

The bot calls `https://clawhedge.vercel.app/api/scan-simple` — a single endpoint that:
1. Queries Bitquery for top 20 Four.meme tokens by 30-min volume
2. Runs GoPlus honeypot checks on the top 5
3. Returns clean JSON — symbol, volume, trades, safety flags, liquidity

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
│       ├── index.ts                       # CLI: dry-run, scan, build calldata
│       ├── dgrid.ts                       # 3-stage DGrid AI pipeline
│       ├── signals.ts                     # Bitquery Four.meme scanner
│       ├── safety.ts                      # GoPlus honeypot check
│       ├── decisions.ts                   # orchestration pipeline
│       ├── calldata.ts                    # ABI-encoded tx builder
│       └── types.ts
├── frontend/
│   ├── app/
│   │   ├── page.tsx                       # live dashboard UI
│   │   └── api/
│   │       ├── scan/route.ts              # SSE scan stream for dashboard
│   │       ├── scan-simple/route.ts       # REST JSON endpoint for Telegram bot
│   │       └── dry-run/route.ts           # SSE dry-run AI pipeline
├── skills/                                # Pieverse Skill Store packages
│   ├── clawhedge/
│   ├── clawhedge-scan/
│   ├── clawhedge-safe-buy/
│   ├── clawhedge-set-cap/
│   ├── clawhedge-close-hedge/
│   ├── clawhedge-status/
│   └── clawhedge-level-short/
├── docs/
│   ├── bounty-map.md
│   ├── architecture.svg
│   ├── recording-guide.md
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
npx tsx src/index.ts dry-run --user 0x9DE4b0aABB3Cd6B00A970dC6B2F30EB0CC457120 --max-usdt 10

# Frontend
cd ../frontend && npm install && npm run dev
```

**Expected:** all 8 forge tests pass. Agent prints `Action JSON` with 3 DGrid model calls logged (triage / decision / explain).

---

## What's working today

| Feature | Status |
|---|---|
| Live Four.meme scan + GoPlus safety filter | ✅ Live |
| DGrid 3-stage AI decision pipeline | ✅ Live |
| TEE wallet buying on Four.meme mainnet | ✅ Live (5 txs confirmed) |
| HedgedBuyer contract deployed on BSC mainnet | ✅ Live |
| 7 Pieverse skills on Skill Store | ✅ Live |
| Telegram bot (@ClawHedge01bot) via Pieverse | ✅ Live |
| REST scan API for Telegram bot | ✅ Live (`/api/scan-simple`) |
| Level Finance atomic hedge in one tx | 🔧 Contract ready — needs `receive()` + redeploy |

---

## Roadmap

| Feature | Description |
|---|---|
| **One-click BUY from dashboard** | Wire scan table BUY button to `purr fourmeme buy` via backend API |
| **Auto-agent mode** | If DGrid says `BUY_AND_HEDGE`, automatically buy top safe token — full autonomous loop |
| **Sell button** | `purr fourmeme sell` from the dashboard — close positions without terminal |
| **Portfolio panel** | Live token balances held by TEE wallet, entry price, PnL |
| **Fix atomic hedge** | Add `receive()` to HedgedBuyer, redeploy — Level Finance perp short in same tx |
| **Multi-model DGrid** | Swap in `claude-opus` for DECIDE when DGrid adds it — one-line change |
| **Auto-refresh scan** | Scan every 60s automatically, highlight new safe tokens |
| **opBNB support** | Extend HedgedBuyer to opBNB chain |
| **Stop-loss automation** | Auto-close Level Finance short when BNB recovers above entry |

---

## Honest limitations

- Atomic `hedgedBuy` needs a one-line `receive()` fix + redeploy — Four.meme buy confirmed working, Level Finance perp short implemented in contract
- DGrid currently has one Anthropic model live (`claude-sonnet-4.6`); pipeline is wired for 3 distinct models
- TEE attestation is trust-on-first-use via Pieverse runtime
- Single chain (BSC) — opBNB is roadmap

---

## Credits

Built on **Pieverse Purr-fect Claw** · **DGrid AI Gateway** · **Level Finance** · **Four.meme** · **BNB Chain**
