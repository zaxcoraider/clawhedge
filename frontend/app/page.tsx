"use client";

import { useEffect, useState, useCallback } from "react";

const HEDGED_BUYER  = "0x2084a2A9C23d9ba70f66bBEF7A91C6d202Bf478e";
const LEVEL_MANAGER = "0xf584A17dF21Afd9de84F47842ECEAF6042b1Bb5b";
const FOUR_MEME     = "0x5c952063c7fc8610FFDB798152D69F0B9550762b";

interface Token {
  address: string;
  symbol: string;
  trades: number;
  volumeUSD: number;
  safe: boolean;
  flags: string[];
  liquidity: number;
  bscscanUrl: string;
}
interface ScanResult  { tokens: Token[]; scannedAt: string; }
interface Stage       { name: string; tokens?: number; action?: string; latencyMs: number; }
interface DryRunResult{ type: string; reasoning: string; stages: Stage[]; }

function short(addr: string) { return `${addr.slice(0,6)}…${addr.slice(-4)}`; }
function usd(n: number)      { return n < 1 ? "<$1" : `$${n.toFixed(0)}`; }

/* ── Panel wrapper ── */
function Panel({ variant="dim", label, children, className="" }:
  { variant?: "gold"|"green"|"dim"; label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`panel-${variant} rounded-lg overflow-hidden ${className}`}>
      {label && (
        <div className={`px-4 py-2 border-b flex items-center gap-2
          ${variant==="gold"  ? "border-[#f0a500]/30 bg-[#f0a500]/5" : ""}
          ${variant==="green" ? "border-[#00d68f]/30 bg-[#00d68f]/5" : ""}
          ${variant==="dim"   ? "border-[#1e2736] bg-[#0a0d14]" : ""}`}>
          <span className={`panel-label
            ${variant==="gold"  ? "text-[#f0a500]" : ""}
            ${variant==="green" ? "text-[#00d68f]" : ""}
            ${variant==="dim"   ? "text-[#4a5568]" : ""}`}>
            ⬡ {label}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, variant="dim" }:
  { label: string; value: string|number; variant?: "gold"|"green"|"dim" }) {
  return (
    <Panel variant={variant} className="p-5">
      <div className={`text-3xl font-black font-mono mb-1
        ${variant==="gold"  ? "text-[#f0a500] text-glow-gold" : ""}
        ${variant==="green" ? "text-[#00d68f] text-glow-green" : ""}
        ${variant==="dim"   ? "text-[#c8d6e5]" : ""}`}>
        {String(value)}
      </div>
      <div className="panel-label text-[#4a5568]">{label}</div>
    </Panel>
  );
}

export default function Home() {
  const [scan, setScan]             = useState<ScanResult | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [dryRun, setDryRun]         = useState<DryRunResult | null>(null);
  const [dryRunning, setDryRunning] = useState(false);
  const [lastError, setLastError]   = useState<string | null>(null);
  const [tick, setTick]             = useState(0);

  const runScan = useCallback(async () => {
    setScanLoading(true); setLastError(null);
    try {
      const res  = await fetch("/api/scan");
      const data = await res.json() as ScanResult & { error?: string };
      if (data.error) throw new Error(data.error);
      setScan(data);
    } catch (e) { setLastError(String(e)); }
    finally { setScanLoading(false); }
  }, []);

  const runDryRun = useCallback(async () => {
    setDryRunning(true);
    try {
      const res = await fetch("/api/dry-run");
      setDryRun(await res.json() as DryRunResult);
    } finally { setDryRunning(false); }
  }, []);

  /* auto-scan + clock tick */
  useEffect(() => { runScan(); }, [runScan]);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t+1), 1000);
    return () => clearInterval(id);
  }, []);

  const safeTokens = scan?.tokens.filter(t =>  t.safe) ?? [];
  const risky      = scan?.tokens.filter(t => !t.safe) ?? [];

  return (
    <div className="min-h-screen bg-[#050709] grid-bg relative overflow-x-hidden">

      {/* scan line effect */}
      <div className="scan-line" />

      {/* ── NAV ── */}
      <nav className="border-b border-[#1e2736] bg-[#050709]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

          <div className="flex items-center gap-4">
            <span className="text-2xl font-black tracking-[0.2em] gold-gradient flicker">
              CLAWHEDGE
            </span>
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-[#4a5568]">
              <div className="dot-live" />
              <span className="text-[#00d68f]">LIVE</span>
              <span>·</span>
              <span>BSC MAINNET</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono text-[#4a5568]">
            <span className="hidden md:inline">{new Date().toISOString().slice(11,19)} UTC</span>
            <span className="mx-3 hidden md:inline text-[#1e2736]">|</span>
            <a href={`https://bscscan.com/address/${HEDGED_BUYER}`}
               target="_blank" rel="noreferrer"
               className="px-3 py-1 border border-[#1e2736] rounded hover:border-[#f0a500] hover:text-[#f0a500] transition-colors">
              CONTRACT ↗
            </a>
            <a href="https://github.com/zaxcoraider/clawhedge"
               target="_blank" rel="noreferrer"
               className="ml-1 px-3 py-1 border border-[#1e2736] rounded hover:border-[#f0a500] hover:text-[#f0a500] transition-colors">
              GITHUB ↗
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* ── HERO PANEL ── */}
        <Panel variant="gold" label="SYSTEM ONLINE">
          <div className="p-8 md:p-12 scanlines relative">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="flex-1 space-y-4">
                <div className="font-mono text-xs text-[#f0a500]/60 tracking-widest">
                  // FOUR.MEME × LEVEL FINANCE × DGRID AI × PIEVERSE TEE
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                  <span className="gold-gradient text-glow-gold">Buy memes.</span>
                  <br />
                  <span className="text-[#00d68f] text-glow-green">Hedge the dump.</span>
                </h1>
                <p className="text-sm text-[#6b7f96] font-mono max-w-xl leading-relaxed">
                  Scans Four.meme every 30s · GoPlus safety filter · DGrid 3-model AI decision ·
                  Atomic BSC tx: bonding-curve buy + Level Finance short in one call
                </p>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <button onClick={runScan} disabled={scanLoading} className="btn-gold px-6 py-3 rounded-lg font-mono text-sm">
                  {scanLoading ? (
                    <span className="cursor">SCANNING</span>
                  ) : "↻  SCAN FOUR.MEME"}
                </button>
                <button onClick={runDryRun} disabled={dryRunning} className="btn-outline px-6 py-3 rounded-lg font-mono text-sm">
                  {dryRunning ? (
                    <span className="cursor">RUNNING AGENT</span>
                  ) : "▶  DRY-RUN AGENT"}
                </button>
              </div>
            </div>
          </div>
        </Panel>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="TOKENS SCANNED"  value={scan?.tokens.length ?? "—"} variant="dim" />
          <StatCard label="SAFE CANDIDATES" value={safeTokens.length || (scan ? "0" : "—")} variant="green" />
          <StatCard label="FLAGGED RISKY"   value={risky.length || (scan ? "0" : "—")} variant="dim" />
          <StatCard label="LAST SCAN"
            value={scan ? new Date(scan.scannedAt).toLocaleTimeString() : "—"}
            variant="gold" />
        </div>

        {/* ── ERROR ── */}
        {lastError && (
          <Panel variant="dim" label="ERROR">
            <div className="p-4 font-mono text-xs text-red-400 text-glow-red">
              ✗ {lastError}
            </div>
          </Panel>
        )}

        {/* ── SCAN RESULTS + DRY-RUN side by side on large screens ── */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Scan table — takes 2/3 */}
          <div className="md:col-span-2">
            <Panel variant="green" label="LIVE SCAN — FOUR.MEME TOKENS">
              {scanLoading && !scan && (
                <div className="p-16 text-center font-mono text-sm text-[#00d68f]">
                  <div className="text-4xl mb-4 animate-pulse-gold">⚡</div>
                  <span className="cursor">FETCHING TOKENS + GOPLUS CHECK</span>
                </div>
              )}

              {!scanLoading && !scan && (
                <div className="p-12 text-center font-mono text-xs text-[#4a5568]">
                  PRESS SCAN TO LOAD TOKENS
                </div>
              )}

              {scan && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#1e2736]">
                        {["#","SYMBOL","ADDRESS","VOLUME","TRADES","LIQUIDITY","GOPLUS","ACTION"].map(h => (
                          <th key={h} className="px-4 py-3 text-left panel-label text-[#4a5568]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scan.tokens.length === 0 && (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-[#4a5568]">
                          NO TOKENS FOUND IN LAST 30 MIN
                        </td></tr>
                      )}
                      {scan.tokens.map((t, i) => (
                        <tr key={t.address}
                          className={`border-b border-[#0f1520] transition-all
                            ${t.safe ? "terminal-row-safe" : "terminal-row"} fade-in`}
                          style={{ animationDelay: `${i * 40}ms` }}>
                          <td className="px-4 py-3 text-[#4a5568]">{String(i+1).padStart(2,"0")}</td>
                          <td className="px-4 py-3 font-black text-[#c8d6e5]">
                            {t.symbol || "???"}
                          </td>
                          <td className="px-4 py-3">
                            <a href={t.bscscanUrl} target="_blank" rel="noreferrer"
                              className="text-[#4a5568] hover:text-[#f0a500] transition-colors">
                              {short(t.address)} ↗
                            </a>
                          </td>
                          <td className="px-4 py-3 text-right text-[#c8d6e5]">{usd(t.volumeUSD)}</td>
                          <td className="px-4 py-3 text-right text-[#6b7f96]">{t.trades}</td>
                          <td className="px-4 py-3 text-right text-[#6b7f96]">{usd(t.liquidity)}</td>
                          <td className="px-4 py-3 text-center">
                            {t.safe ? (
                              <span className="text-[#00d68f] font-black text-glow-green">✓ SAFE</span>
                            ) : (
                              <span className="text-red-400 text-glow-red" title={t.flags.join(", ")}>
                                ✗ {t.flags[0]?.toUpperCase().slice(0,10) ?? "FLAG"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {t.safe ? (
                              <span className="border border-[#f0a500] text-[#f0a500] px-2 py-0.5 rounded text-[10px] font-black tracking-widest animate-pulse-gold">
                                BUY
                              </span>
                            ) : (
                              <span className="text-[#2a3040] text-[10px]">SKIP</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 border-t border-[#1e2736] flex items-center justify-between text-[10px] font-mono text-[#4a5568]">
                    <span>SCANNED AT {new Date(scan.scannedAt).toLocaleTimeString()}</span>
                    <span>{safeTokens.length} SAFE / {risky.length} FLAGGED</span>
                  </div>
                </div>
              )}
            </Panel>
          </div>

          {/* Agent panel — takes 1/3 */}
          <div className="space-y-4">
            <Panel variant="gold" label="AGENT DECISION">
              {!dryRun && !dryRunning && (
                <div className="p-8 text-center font-mono text-xs text-[#4a5568]">
                  PRESS DRY-RUN TO SIMULATE<br />DGRID 3-MODEL PIPELINE
                </div>
              )}
              {dryRunning && (
                <div className="p-8 text-center font-mono text-xs text-[#f0a500]">
                  <div className="text-3xl mb-3 animate-pulse-gold">◈</div>
                  <span className="cursor">ROUTING DGRID MODELS</span>
                </div>
              )}
              {dryRun && (
                <div className="p-5 space-y-4 fade-in">
                  {/* Decision badge */}
                  <div className={`text-center py-3 rounded border font-black tracking-widest text-sm
                    ${dryRun.type === "BUY_AND_HEDGE"
                      ? "border-[#00d68f] text-[#00d68f] bg-[#00d68f]/5 text-glow-green"
                      : "border-[#f0a500] text-[#f0a500] bg-[#f0a500]/5 text-glow-gold"}`}>
                    {dryRun.type}
                  </div>

                  {/* Reasoning */}
                  <p className="text-[11px] font-mono text-[#6b7f96] leading-relaxed border-l-2 border-[#1e2736] pl-3">
                    {dryRun.reasoning}
                  </p>

                  {/* Stage log */}
                  <div className="space-y-2">
                    <div className="panel-label text-[#4a5568]">PIPELINE STAGES</div>
                    {dryRun.stages.map((s, i) => (
                      <div key={s.name}
                        className="bg-[#0a0d14] border border-[#1e2736] rounded p-3 flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] text-[#f0a500] font-black tracking-widest">{s.name}</div>
                          <div className="text-xs text-[#c8d6e5] mt-0.5 font-mono">
                            {s.tokens !== undefined ? `${s.tokens} tokens` : s.action}
                          </div>
                        </div>
                        {s.latencyMs > 0 && (
                          <span className="text-[10px] font-mono text-[#4a5568] whitespace-nowrap">{s.latencyMs}ms</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>

            {/* Mini info panel */}
            <Panel variant="dim" label="DGRID MODELS">
              <div className="p-4 space-y-2 font-mono text-xs">
                {[
                  { role: "TRIAGE",  model: "claude-sonnet-4.6",  color: "#f0a500" },
                  { role: "DECIDE",  model: "claude-opus-4-5",    color: "#ffe066" },
                  { role: "EXPLAIN", model: "claude-sonnet-4.6",  color: "#f0a500" },
                ].map(m => (
                  <div key={m.role} className="flex items-center justify-between">
                    <span className="text-[#4a5568]">{m.role}</span>
                    <span style={{ color: m.color }}>{m.model}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* ── ARCHITECTURE ROW ── */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: "◈", color: "green" as const,
              title: "SCAN & FILTER",
              desc: "Fetches tokens from Four.meme every 30s. GoPlus honeypot + rug checks. Filters by liquidity floor."
            },
            {
              icon: "⬡", color: "gold" as const,
              title: "BUY ON FOUR.MEME",
              desc: "Agent buys via the bonding curve TokenManager V2. Tokens delivered directly to your wallet atomically."
            },
            {
              icon: "▲", color: "dim" as const,
              title: "HEDGE ON LEVEL FINANCE",
              desc: "Simultaneously opens BNB perp short. If BNB dumps, hedge profits offset your meme loss. One tx."
            },
          ].map(c => (
            <Panel key={c.title} variant={c.color} label={c.title}>
              <div className="p-5 space-y-3">
                <div className={`text-3xl font-black
                  ${c.color==="green" ? "text-[#00d68f] text-glow-green" : ""}
                  ${c.color==="gold"  ? "text-[#f0a500] text-glow-gold"  : ""}
                  ${c.color==="dim"   ? "text-[#c8d6e5]"                  : ""}`}>
                  {c.icon}
                </div>
                <p className="text-xs font-mono text-[#6b7f96] leading-relaxed">{c.desc}</p>
              </div>
            </Panel>
          ))}
        </div>

        {/* ── CONTRACTS + SKILLS ── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Contracts */}
          <Panel variant="gold" label="DEPLOYED CONTRACTS — BSC MAINNET">
            <div className="p-5 space-y-4 font-mono">
              {[
                { label: "HedgedBuyer (Mainnet)",        addr: HEDGED_BUYER,  url: `https://bscscan.com/address/${HEDGED_BUYER}` },
                { label: "Level Finance OrderManager",   addr: LEVEL_MANAGER, url: `https://bscscan.com/address/${LEVEL_MANAGER}` },
                { label: "Four.meme TokenManager V2",    addr: FOUR_MEME,     url: `https://bscscan.com/address/${FOUR_MEME}` },
              ].map(c => (
                <div key={c.label} className="border-b border-[#1e2736] pb-3 last:border-0 last:pb-0">
                  <div className="text-[10px] text-[#4a5568] mb-1 tracking-widest uppercase">{c.label}</div>
                  <a href={c.url} target="_blank" rel="noreferrer"
                    className="text-xs text-[#f0a500] hover:text-[#ffe066] transition-colors break-all">
                    {c.addr} ↗
                  </a>
                </div>
              ))}
            </div>
          </Panel>

          {/* Skills */}
          <Panel variant="green" label="PIEVERSE SKILL STORE — 7 SKILLS LIVE">
            <div className="p-4 font-mono space-y-1">
              {[
                { name: "clawhedge",              id: 57064, hot: true  },
                { name: "clawhedge-scan",         id: 56078, hot: false },
                { name: "clawhedge-safe-buy",     id: 56074, hot: false },
                { name: "clawhedge-level-short",  id: 56079, hot: false },
                { name: "clawhedge-close-hedge",  id: 56075, hot: false },
                { name: "clawhedge-set-cap",      id: 56076, hot: false },
                { name: "clawhedge-status",       id: 56077, hot: false },
              ].map(s => (
                <a key={s.name}
                   href={`https://www.pieverse.io/skill-store?skill=${s.id}`}
                   target="_blank" rel="noreferrer"
                   className="flex items-center justify-between px-3 py-2 rounded hover:bg-[#00d68f]/5
                     border border-transparent hover:border-[#00d68f]/20 transition-all group">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00d68f] text-xs">▸</span>
                    <span className="text-xs text-[#c8d6e5]">{s.name}</span>
                    {s.hot && (
                      <span className="text-[10px] border border-[#f0a500] text-[#f0a500] px-1.5 rounded tracking-widest">
                        FLAGSHIP
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#4a5568] group-hover:text-[#00d68f] transition-colors">
                    #{s.id} ↗
                  </span>
                </a>
              ))}
            </div>
          </Panel>
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1e2736] mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3
          text-[10px] font-mono text-[#4a5568] tracking-widest">
          <span className="gold-gradient font-black text-sm tracking-[0.3em]">CLAWHEDGE</span>
          <span>FOUR.MEME HACKATHON · BSC MAINNET · 2026</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/zaxcoraider/clawhedge" target="_blank" rel="noreferrer"
               className="hover:text-[#f0a500] transition-colors">GITHUB ↗</a>
            <span className="text-[#1e2736]">|</span>
            <span className="flex items-center gap-1.5">
              <div className="dot-live" style={{width:5,height:5}} />
              LIVE
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
