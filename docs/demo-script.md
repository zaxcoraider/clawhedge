# ClawHedge — 2-Minute Demo Script

> Shot list for the hackathon submission video. Total runtime: ~2:00.

---

## Shot 1 — Hook (0:00–0:15)

**Screen:** ClawHedge dashboard at live Vercel URL  
**Narration:**  
> "Every meme token buyer in this hackathon is long-only. One dump and it's gone. ClawHedge is different — it buys AND hedges in the same transaction."

---

## Shot 2 — Live Scan (0:15–0:35)

**Screen:** Hit "Scan Four.meme Now" button on dashboard  
**Show:** Token table populates — green ✓ Safe / red ✗ flagged rows  
**Narration:**  
> "The agent fetches freshly launched tokens from Four.meme, runs GoPlus honeypot checks on each one, and ranks survivors by liquidity. This happens every 30 seconds automatically."

---

## Shot 3 — Agent Decision (0:35–0:55)

**Screen:** Hit "Dry-Run Agent" button  
**Show:** Stage log appearing — triage → safety → decide → explain  
**Narration:**  
> "DGrid routes three different models: a cheap flash model filters noise, Claude Sonnet makes the trading decision via tool-calling, and a cheap model writes the one-sentence summary the user sees."

---

## Shot 4 — The Contract (0:55–1:15)

**Screen:** BSCScan testnet contract page for HedgedBuyer  
**Show:** Scroll to `hedgedBuy` function — highlight the two calls inside  
**Narration:**  
> "One transaction. `buyTokenAMAP` sends BNB to Four.meme's bonding curve. `placeOrder` opens a BNB short on Level Finance. The user's daily USDT cap is enforced on-chain — the agent can never spend more than authorised."

---

## Shot 5 — Skills on Pieverse (1:15–1:35)

**Screen:** Pieverse Skill Store — show all 6 skill listings  
**Narration:**  
> "Six skills published on the Pieverse Skill Store. Any agent on any Pieverse runtime — WhatsApp, Telegram, Line — can install clawhedge-scan, safe-buy, set-cap, and close-hedge to get full hedged trading in one conversation."

---

## Shot 6 — Forge Tests (1:35–1:50)

**Screen:** Terminal running `forge test --fork-url $BSC_RPC_URL -vv`  
**Show:** 8 green PASS lines  
**Narration:**  
> "Eight tests against a BSC mainnet fork. OnlyAgent guard, epoch cap rollover, GoPlus safety, close position payout — all verified."

---

## Shot 7 — Closing (1:50–2:00)

**Screen:** Logo + tagline  
**Narration:**  
> "ClawHedge. The first hedged trading agent on Four.meme. Buy memes. Hedge the dump."

---

## Recording checklist

- [ ] Record in 1080p minimum
- [ ] Dashboard scan shows real tokens (run during active Four.meme trading hours)
- [ ] DGrid account funded before recording dry-run
- [ ] Forge test terminal uses dark theme
- [ ] Mute system notifications before recording
- [ ] Upload to YouTube (unlisted or public) and drop link into README
