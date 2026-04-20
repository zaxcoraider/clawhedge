# ClawHedge — Demo Recording Guide

> Target: 2-minute video. Every shot has a real action, real output, real tx hash.

---

## Before You Start (5 min prep)

- [ ] Charge laptop, plug in power
- [ ] Close all tabs except the ones listed below
- [ ] Turn off notifications (Windows: Focus Assist → Priority Only)
- [ ] Set screen resolution to 1920×1080
- [ ] Open OBS / Loom / any screen recorder — test audio off, screen only
- [ ] Dark mode on browser and terminal
- [ ] Open Git Bash (not PowerShell)

**Pre-open these tabs:**
1. https://clawhedge.vercel.app
2. https://bscscan.com/address/0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e
3. https://www.pieverse.io/skill-store?skill=57064
4. https://bscscan.com/tx/0x006d2de6cfaad7a08f42237ef1a3ce5642fa538447174f5aca4459ca2cb3999c

---

## Shot 1 — Hook (0:00–0:12)

**Screen:** clawhedge.vercel.app — just the landing dashboard

**Say:**
> "Every meme token buyer in this hackathon is long-only. One dump and it's gone.
> ClawHedge buys AND hedges in the same transaction."

---

## Shot 2 — Live Scan (0:12–0:35)

**Action:** Click **"Scan Four.meme Now"** button

**Watch:** Status bar updates — AUTHENTICATING → QUERYING → GOPLUS CHECK 1/10...
Token rows appear one by one. Green ✓ SAFE tokens get BUY button.

**Say:**
> "The agent scans Four.meme in real time — GoPlus honeypot checks on every token.
> Green means safe to buy. Red means skip."

**Wait for scan to finish (about 15 seconds) then move on.**

---

## Shot 3 — AI Decision Pipeline (0:35–0:58)

**Action:** Click **"Dry-Run Agent"** button

**Watch:** Three stages appear one by one:
- TRIAGE running... → done (X tokens)
- DECIDE running... → done (HOLD or BUY_AND_HEDGE)
- EXPLAIN running... → done (one sentence)

**Say:**
> "DGrid routes three Claude Sonnet calls — triage filters noise, decide sets the edge threshold,
> explain writes the one sentence the user sees. Three stages, one pipeline, live AI."

---

## Shot 4 — Live Buy in Git Bash (0:58–1:20)

**Switch to:** Git Bash terminal (full screen or half screen)

**Copy a SAFE token address from the scan table** (any green ✓ row ending in 4444)

**Type this command live on camera:**

```bash
~/.purrfectclaw/bin/purr fourmeme buy \
  --token 0xPASTE_TOKEN_HERE \
  --wallet 0x889bf5f700f532950Ba67Be0B16eaB3378b992E1 \
  --funds 0.001 \
  --execute
```

**Watch:** JSON response with `"status": "success"` and a tx hash

**Say:**
> "The Pieverse TEE wallet just signed and broadcast a real BSC transaction.
> That's on mainnet — right now."

**Copy the tx hash from the output.**

---

## Shot 5 — BscScan Confirmation (1:20–1:35)

**Switch to browser → go to:**
```
https://bscscan.com/tx/PASTE_YOUR_HASH_HERE
```

**Show:** Green "Success" badge, From = TEE wallet address, token transfer in the logs

**Say:**
> "Confirmed on-chain. TEE wallet bought the token on Four.meme's bonding curve."

---

## Shot 6 — The Contract (1:35–1:48)

**Switch to tab 2:** BscScan contract page

**Show:** Contract tab → scroll to show `hedgedBuy` function, `buyTokenAMAP` + `placeOrder` calls inside

**Say:**
> "One function. Four.meme buy and Level Finance perp short in a single atomic transaction.
> Daily spending cap enforced on-chain — the agent can never overspend."

---

## Shot 7 — Pieverse Skills (1:48–1:56)

**Switch to tab 3:** Pieverse Skill Store (skill=57064)

**Say:**
> "Seven skills on the Pieverse Skill Store. Any user on Telegram or WhatsApp
> installs ClawHedge and gets hedged meme trading in one message."

---

## Shot 8 — Closing (1:56–2:00)

**Switch back to:** clawhedge.vercel.app

**Say:**
> "ClawHedge. Buy memes. Hedge the dump."

---

## Git Bash Commands Cheat Sheet

Copy these before recording so you can paste fast:

```bash
# Check TEE wallet balance
~/.purrfectclaw/bin/purr wallet balance --chain-type ethereum

# Check wallet address
~/.purrfectclaw/bin/purr wallet address --chain-type ethereum

# Buy a token (replace address)
~/.purrfectclaw/bin/purr fourmeme buy \
  --token 0xREPLACE_WITH_LIVE_TOKEN \
  --wallet 0x889bf5f700f532950Ba67Be0B16eaB3378b992E1 \
  --funds 0.001 \
  --execute

# Preview buy without executing (shows steps JSON)
~/.purrfectclaw/bin/purr fourmeme buy \
  --token 0xREPLACE_WITH_LIVE_TOKEN \
  --wallet 0x889bf5f700f532950Ba67Be0B16eaB3378b992E1 \
  --funds 0.001
```

---

## After Recording

1. Upload to YouTube (unlisted is fine)
2. Copy the YouTube URL
3. Open `README.md` — replace this line:
   ```
   | Demo video | `[YouTube link — add after recording]` |
   ```
   With:
   ```
   | Demo video | [Watch](YOUR_YOUTUBE_URL) |
   ```
4. Run:
   ```bash
   git add README.md
   git commit -m "docs: add demo video link"
   git push
   ```
5. Submit on DoraHacks: https://dorahacks.io/hackathon/fourmemeaisprint

---

## Tips for Clean Terminal Output

- Make Git Bash font size **16pt** minimum so it's readable on video
- Right-click Git Bash title bar → Options → Text → change font size
- Use a dark terminal theme (default Git Bash is fine)
- Paste commands one line at a time, not multi-line — easier to read on video
- If a command fails, just re-run — judges expect live demos to have retries

---

## Token Address Strategy

The scan shows live tokens. Pick one that is:
- ✓ SAFE (green GoPlus badge)
- Address ends in `4444` (Four.meme V2 bonding curve)
- Has at least 5+ trades

If no safe tokens appear, run the scan again — new tokens launch every few minutes.
