# ClawHedge — Bounty Coverage Map

> DoraHacks page: https://dorahacks.io/hackathon/fourmemeaisprint
> Requirements quoted from hackathon detail page where accessible; flagged where unverifiable.

---

## 1. Main Prize Pool ($50K)

| Requirement | Our evidence | File / link |
|---|---|---|
| Agent built on Four.meme | HedgedBuyer.sol calls `buyTokenAMAP()` on Four.meme TokenManager V2 | `contracts/src/HedgedBuyer.sol:85` |
| On-chain activity on BSC | Deployed + verified on BSC testnet; mainnet deploy in progress | [testnet.bscscan.com/address/0x0Ec3...](https://testnet.bscscan.com/address/0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae) |
| AI agent with real decision-making | 3-model DGrid pipeline: triage → decision (tool-calling) → explain | `agent/src/dgrid.ts` |
| Novel / differentiated | First agent to buy AND hedge atomically in one tx — no other entry does both legs | `HedgedBuyer.sol` |
| [verify against bounty page] | GoPlus safety check before every buy | `agent/src/safety.ts` |

---

## 2. Pieverse Bounty ($2K)

| Requirement | Our evidence | File / link |
|---|---|---|
| Skills published to Skill Store | 7 skills live | [skill-store links below] |
| Uses Purr-fect Claw TEE wallet | All on-chain calls routed through TEE agent wallet | `agent/src/index.ts` |
| [verify exact skill count req.] | Skills: scan, safe-buy, set-cap, close-hedge, status, level-short, clawhedge | `skills/` directory |

**Skill Store links:**
- clawhedge-scan: https://www.pieverse.io/skill-store?skill=56078
- clawhedge-safe-buy: https://www.pieverse.io/skill-store?skill=56074
- clawhedge-set-cap: https://www.pieverse.io/skill-store?skill=56076
- clawhedge-close-hedge: https://www.pieverse.io/skill-store?skill=56075
- clawhedge-status: https://www.pieverse.io/skill-store?skill=56077
- clawhedge-level-short: https://www.pieverse.io/skill-store?skill=56079
- clawhedge (flagship): https://www.pieverse.io/skill-store?skill=57064

---

## 3. DGrid Bounty ($3K credits)

| Requirement | Our evidence | File / link |
|---|---|---|
| Uses DGrid AI Gateway | `baseURL: "https://api.dgrid.ai/v1"` | `agent/src/dgrid.ts:11` |
| Multi-model usage | 3 distinct model calls per cycle | `agent/src/dgrid.ts` |
| TRIAGE model | `anthropic/claude-sonnet-4.6` — sharp noise filter | `agent/src/dgrid.ts:8` |
| DECIDE model | `anthropic/claude-opus-4-5` — strongest tool-calling for trading decisions | `agent/src/dgrid.ts:9` |
| EXPLAIN model | `anthropic/claude-sonnet-4.6` — crisp one-sentence user summary | `agent/src/dgrid.ts:10` |
| Measurable call logs | Each stage logs model name + latency to console | `agent/src/decisions.ts` |
| [verify exact req. from page] | DGrid API key funded and tested | `.env` → `DGRID_API_KEY` |

---

## 4. Level Finance / Perp DEX Bounty

| Requirement | Our evidence | File / link |
|---|---|---|
| Integration with Level Finance | `placeOrder()` called on OrderManager `0xf584A17...` | `contracts/src/HedgedBuyer.sol:100` |
| Real ABI, not invented | Interface sourced from `github.com/level-fi/level-trading-contracts` | `contracts/src/interfaces/ILevelOrderManager.sol` |
| Open + close flow | `hedgedBuy()` opens SHORT; `userClose()` places DECREASE order | `HedgedBuyer.sol:88,118` |
| Calldata builder | `buildMYXShortSteps()` encodes real Level Finance tx | `agent/src/calldata.ts:63` |
| [verify TVL gate if any] | **⚠ NOT MET** — if Level Finance requires minimum TVL, we do not meet it | Flag for judges |

---

## Honest gaps

| Gap | Reason | Impact |
|---|---|---|
| Mainnet HedgedBuyer deploy | Environment setup in progress | Demo uses testnet — all logic identical |
| DGrid balance | Requires funded account to run live | Dry-run shows mock Action JSON if balance zero |
| Level Finance TVL gate | Unknown — verify on bounty page | May disqualify Level Finance bounty claim |
| opBNB support | Not implemented | Out of scope for this sprint |
