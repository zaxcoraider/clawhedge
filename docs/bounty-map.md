# ClawHedge — Bounty Coverage Map

> DoraHacks: https://dorahacks.io/hackathon/fourmemeaisprint

---

## 1. Main Prize Pool ($50K)

| Requirement | Our evidence | File / link |
|---|---|---|
| Agent built on Four.meme | HedgedBuyer.sol calls `buyTokenAMAP()` on Four.meme TokenManager V2 | `contracts/src/HedgedBuyer.sol:88` |
| On-chain activity on BSC | Deployed + 3 mainnet txs confirmed | [bscscan.com/address/0x2084...](https://bscscan.com/address/0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e) |
| AI agent with real decision-making | 3-model DGrid pipeline: triage → decision (tool-calling) → explain | `agent/src/dgrid.ts` |
| Novel / differentiated | First agent to buy AND hedge atomically in one tx | `HedgedBuyer.sol` |
| Safety checks | GoPlus honeypot + flag check before every buy | `agent/src/safety.ts` |

---

## 2. Pieverse Bounty ($2K)

| Requirement | Our evidence | File / link |
|---|---|---|
| Skills published to Skill Store | 7 skills live | See links below |
| Uses Purr-fect Claw TEE wallet | All on-chain calls routed through TEE agent wallet `0x889b...` | `agent/src/index.ts` |
| Skills cover key flows | scan, safe-buy, set-cap, close-hedge, status, level-short, clawhedge | `skills/` directory |

**Skill Store links:**
- clawhedge: https://www.pieverse.io/skill-store?skill=57064 *(flagship — atomic buy + hedge)*
- clawhedge-scan: https://www.pieverse.io/skill-store?skill=56078
- clawhedge-safe-buy: https://www.pieverse.io/skill-store?skill=56074
- clawhedge-set-cap: https://www.pieverse.io/skill-store?skill=56076
- clawhedge-close-hedge: https://www.pieverse.io/skill-store?skill=56075
- clawhedge-status: https://www.pieverse.io/skill-store?skill=56077
- clawhedge-level-short: https://www.pieverse.io/skill-store?skill=56079

---

## 3. DGrid Bounty ($3K credits)

| Requirement | Our evidence | File / link |
|---|---|---|
| Uses DGrid AI Gateway | `baseURL: "https://api.dgrid.ai/v1"` | `agent/src/dgrid.ts:11` |
| Multi-model usage | 3 distinct model calls per cycle | `agent/src/dgrid.ts` |
| TRIAGE model | `anthropic/claude-sonnet-4.6` — fast noise filter | `agent/src/dgrid.ts:8` |
| DECIDE model | `anthropic/claude-opus-4-5` — strongest tool-calling for trading decisions | `agent/src/dgrid.ts:9` |
| EXPLAIN model | `anthropic/claude-sonnet-4.6` — one-sentence user summary | `agent/src/dgrid.ts:10` |
| Measurable call logs | Each stage logs model name + latency to console | `agent/src/decisions.ts` |
| Live frontend demo | Streaming DGrid pipeline visible at clawhedge.vercel.app | `frontend/app/api/dry-run/route.ts` |

---

## 4. Level Finance / Perp DEX Bounty

| Requirement | Our evidence | File / link |
|---|---|---|
| Integration with Level Finance | `placeOrder()` called on OrderManager `0xf584A17...` | `contracts/src/HedgedBuyer.sol:107` |
| Real ABI, not invented | Interface sourced from `github.com/level-fi/level-trading-contracts` | `contracts/src/interfaces/ILevelOrderManager.sol` |
| Open + close flow | `hedgedBuy()` opens SHORT; `userClose()` places DECREASE order | `HedgedBuyer.sol:80,125` |
| Calldata builder | `buildMYXShortSteps()` encodes real Level Finance tx | `agent/src/calldata.ts:63` |

---

## On-chain evidence (BSC mainnet)

| Tx | Hash | What it proves |
|---|---|---|
| Deploy | [`0x167963...`](https://bscscan.com/tx/0x167963fb12cba5bd15a97a1c4ada8db6b749ed9a95809630243f1dde6c6a2b07) | Contract live on mainnet |
| USDT approve | [`0xb5425d...`](https://bscscan.com/tx/0xb5425d600f57eff547346ed9cdd70fcefed028514ee432ac667ec6f8d97f69f5) | User pre-authorized contract to pull USDT |
| setCap | [`0x53b5c5...`](https://bscscan.com/tx/0x53b5c5439a7e5b11350e10a8ee323db5053693a3b24fb266f8f7703c96279d09) | Daily spending cap set on-chain |

---

## Honest gaps

| Gap | Reason | Impact |
|---|---|---|
| Live mainnet `hedgedBuy` tx | Requires Pieverse TEE wallet execution; TEE key is managed by the enclave | Demo shows contract + pre-conditions; `hedgedBuy` logic is fully implemented and tested |
| Level Finance TVL gate | Unknown — verify on bounty page | May affect Level Finance bounty eligibility |
| opBNB support | Not implemented | Out of scope for this sprint |
