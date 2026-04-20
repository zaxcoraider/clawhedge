# ClawHedge — 2-Minute Demo Script

> Shot list for the hackathon submission video. Total runtime: ~2:00.

---

## Shot 1 — Hook (0:00–0:15)

**Screen:** ClawHedge dashboard at https://clawhedge.vercel.app  
**Narration:**  
> "Every meme token buyer in this hackathon is long-only. One dump and it's gone. ClawHedge is different — it buys AND hedges in the same transaction."

---

## Shot 2 — Live Scan (0:15–0:35)

**Screen:** Hit "Scan Four.meme Now" button  
**Show:** Terminal status lines appear one by one — "AUTHENTICATING…" → "QUERYING…" → "GOPLUS CHECK 1/10…" — then token rows populate with green ✓ Safe / red flags  
**Narration:**  
> "The agent fetches freshly launched tokens from Four.meme, runs GoPlus honeypot checks on each one, and ranks survivors by liquidity. Real data, live on BSC."

---

## Shot 3 — AI Decision Pipeline (0:35–0:55)

**Screen:** Hit "Dry-Run Agent" button  
**Show:** Stage log appearing line by line — TRIAGE running → done → DECIDE running → done → EXPLAIN done — then final HOLD/BUY_AND_HEDGE verdict  
**Narration:**  
> "DGrid routes three Claude models: Sonnet filters the noise, Opus-4 makes the trading decision with tool-calling, Sonnet writes the one sentence the user sees. Three models, one pipeline, under 30 seconds."

---

## Shot 4 — The Contract (0:55–1:20)

**Screen:** BscScan mainnet — https://bscscan.com/address/0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e  
**Show:** Contract tab → scroll to `hedgedBuy` function  
**Narration:**  
> "One transaction. `buyTokenAMAP` sends BNB to Four.meme's bonding curve. `placeOrder` opens a BNB short on Level Finance. The user's daily USDT cap is enforced on-chain — the agent can never overspend."

**Then:** Switch to the three mainnet txs:  
- Deploy: `0x167963...`  
- USDT approve: `0xb5425d...`  
- setCap: `0x53b5c5...`  
**Narration:**  
> "Contract is live on BSC mainnet. User pre-approved USDT and set their daily cap — the contract is primed and ready."

---

## Shot 5 — Skills on Pieverse (1:20–1:40)

**Screen:** Pieverse Skill Store — show clawhedge skill listing (skill=57064)  
**Narration:**  
> "Seven skills published on the Pieverse Skill Store. Any user on Telegram, WhatsApp or Line can install ClawHedge and get hedged meme trading in one message — no wallet app, no Metamask popup."

---

## Shot 6 — Forge Tests (1:40–1:55)

**Screen:** Terminal running `forge test --fork-url $BSC_RPC_URL -vv` in contracts/  
**Show:** 8 green PASS lines  
**Narration:**  
> "Eight tests against a live BSC mainnet fork. OnlyAgent guard, daily cap rollover, Level Finance calldata encoding, close-position flow — all green."

---

## Shot 7 — Closing (1:55–2:00)

**Screen:** Dashboard with logo  
**Narration:**  
> "ClawHedge. The first hedged agent on Four.meme. Buy memes. Hedge the dump."

---

## Recording checklist

- [ ] Open https://clawhedge.vercel.app in Chrome, dark mode
- [ ] Run Scan first — do this during active Four.meme hours (Asia morning / US evening)
- [ ] Run Dry-Run — DGRID_API_KEY must be set in Vercel env
- [ ] BscScan contract tab — verify the 3 mainnet tx hashes load correctly
- [ ] Pieverse skill store page loaded before recording
- [ ] Terminal ready with `cd contracts && forge test --fork-url $BSC_RPC_URL -vv`
- [ ] 1080p minimum, system notifications OFF
- [ ] Upload to YouTube (unlisted is fine) and paste link into README
