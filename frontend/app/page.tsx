"use client";

import { useEffect, useState, useCallback } from "react";

const HEDGED_BUYER = "0x0Ec3689BE28aB60cbDF400015440a2feB50205Ae";
const LEVEL_MANAGER = "0xf584A17dF21Afd9de84F47842ECEAF6042b1Bb5b";

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

interface ScanResult {
  tokens: Token[];
  scannedAt: string;
}

interface Stage {
  name: string;
  tokens?: number;
  action?: string;
  latencyMs: number;
}

interface DryRunResult {
  type: string;
  reasoning: string;
  stages: Stage[];
}

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Home() {
  const [scan, setScan]         = useState<ScanResult | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [dryRun, setDryRun]     = useState<DryRunResult | null>(null);
  const [dryRunning, setDryRunning] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setScanLoading(true);
    setLastError(null);
    try {
      const res = await fetch("/api/scan");
      const data = await res.json() as ScanResult & { error?: string };
      if (data.error) throw new Error(data.error);
      setScan(data);
    } catch (e) {
      setLastError(String(e));
    } finally {
      setScanLoading(false);
    }
  }, []);

  const runDryRun = useCallback(async () => {
    setDryRunning(true);
    try {
      const res = await fetch("/api/dry-run");
      setDryRun(await res.json() as DryRunResult);
    } finally {
      setDryRunning(false);
    }
  }, []);

  useEffect(() => { runScan(); }, [runScan]);

  const safeTokens = scan?.tokens.filter(t => t.safe) ?? [];
  const risky      = scan?.tokens.filter(t => !t.safe) ?? [];

  return (
    <div className="min-h-screen bg-[#0a0c12] text-[#e6edf3] font-sans">

      {/* ── Nav ── */}
      <nav className="border-b border-[#21262d] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-widest gold-gradient">CLAWHEDGE</span>
          <span className="text-xs text-[#8b949e] border border-[#21262d] rounded px-2 py-0.5">BSC</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-[#8b949e]">
          <a href={`https://testnet.bscscan.com/address/${HEDGED_BUYER}`} target="_blank" rel="noreferrer"
            className="hover:text-[#f0a500] transition-colors">Contract ↗</a>
          <a href="https://github.com/zaxcoraider/clawhedge" target="_blank" rel="noreferrer"
            className="hover:text-[#f0a500] transition-colors">GitHub ↗</a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">

        {/* ── Hero ── */}
        <section className="text-center space-y-6">
          <div className="inline-block border border-[#f0a500]/30 rounded-full px-4 py-1 text-xs text-[#f0a500] bg-[#f0a500]/5 mb-2">
            Live on BSC Testnet · PurrfectClaw Agent
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight gold-gradient">
            Buy memes.<br />Hedge the dump.
          </h1>
          <p className="text-lg text-[#8b949e] max-w-2xl mx-auto leading-relaxed">
            ClawHedge scans Four.meme for newly launched BSC tokens, runs GoPlus safety checks,
            buys the safest candidates, and simultaneously opens a BNB short hedge on Level Finance
            — all in one autonomous agent cycle.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <button onClick={runScan} disabled={scanLoading}
              className="px-6 py-3 bg-[#f0a500] text-black font-bold rounded-lg hover:bg-[#ffe066] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {scanLoading ? "Scanning…" : "↻ Scan Four.meme Now"}
            </button>
            <button onClick={runDryRun} disabled={dryRunning}
              className="px-6 py-3 border border-[#f0a500] text-[#f0a500] font-bold rounded-lg hover:bg-[#f0a500]/10 transition-colors disabled:opacity-50">
              {dryRunning ? "Running…" : "▶ Dry-Run Agent"}
            </button>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tokens Scanned",  value: scan?.tokens.length ?? "—" },
            { label: "Safe Candidates", value: safeTokens.length || (scan ? "0" : "—") },
            { label: "Flagged Risky",   value: risky.length       || (scan ? "0" : "—") },
            { label: "Last Scan",       value: scan ? new Date(scan.scannedAt).toLocaleTimeString() : "—" },
          ].map(s => (
            <div key={s.label} className="bg-[#0d1117] border border-[#21262d] rounded-xl p-5">
              <div className="text-3xl font-black gold-gradient mb-1">{String(s.value)}</div>
              <div className="text-sm text-[#8b949e]">{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── Error ── */}
        {lastError && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
            {lastError}
          </div>
        )}

        {/* ── Scan Results ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Live Scan — Four.meme Tokens (last 30 min)</h2>
            {scan && <span className="text-xs text-[#8b949e]">Auto-scans every 60s</span>}
          </div>

          {scanLoading && !scan && (
            <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-12 text-center text-[#8b949e]">
              <div className="animate-pulse-gold text-4xl mb-3">⚡</div>
              Fetching tokens from Four.meme + GoPlus…
            </div>
          )}

          {scan && (
            <div className="bg-[#0d1117] border border-[#21262d] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#21262d] text-[#8b949e] text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Token</th>
                    <th className="text-left px-5 py-3">Address</th>
                    <th className="text-right px-5 py-3">Volume</th>
                    <th className="text-right px-5 py-3">Trades</th>
                    <th className="text-right px-5 py-3">Liquidity</th>
                    <th className="text-center px-5 py-3">GoPlus</th>
                    <th className="text-center px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scan.tokens.map((t, i) => (
                    <tr key={t.address}
                      className={`border-b border-[#21262d] hover:bg-[#161b22] transition-colors ${
                        i === 0 && t.safe ? "bg-[#f0a500]/5" : ""}`}>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-[#e6edf3]">{t.symbol || "?"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <a href={t.bscscanUrl} target="_blank" rel="noreferrer"
                          className="font-mono text-xs text-[#8b949e] hover:text-[#f0a500] transition-colors">
                          {short(t.address)} ↗
                        </a>
                      </td>
                      <td className="px-5 py-4 text-right font-mono">
                        ${t.volumeUSD < 1 ? "<1" : t.volumeUSD.toFixed(0)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-[#8b949e]">{t.trades}</td>
                      <td className="px-5 py-4 text-right font-mono text-[#8b949e]">
                        ${t.liquidity < 1 ? "<1" : t.liquidity.toFixed(0)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {t.safe ? (
                          <span className="text-green-400 font-bold">✓ Safe</span>
                        ) : (
                          <span className="text-red-400 text-xs" title={t.flags.join(", ")}>
                            ✗ {t.flags[0]}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {t.safe ? (
                          <span className="bg-[#f0a500]/20 text-[#f0a500] text-xs font-bold px-2 py-1 rounded">
                            BUY CANDIDATE
                          </span>
                        ) : (
                          <span className="text-[#8b949e] text-xs">Skip</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Dry-run result ── */}
        {dryRun && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Agent Decision</h2>
            <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black ${dryRun.type === "BUY_AND_HEDGE" ? "text-green-400" : "text-[#f0a500]"}`}>
                  {dryRun.type}
                </span>
              </div>
              <p className="text-[#8b949e] text-sm leading-relaxed">{dryRun.reasoning}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dryRun.stages.map(s => (
                  <div key={s.name} className="bg-[#161b22] rounded-lg p-3">
                    <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-1">{s.name}</div>
                    <div className="font-mono text-sm font-bold text-[#e6edf3]">
                      {s.tokens !== undefined ? `${s.tokens} tokens` : s.action}
                    </div>
                    {s.latencyMs > 0 && (
                      <div className="text-xs text-[#8b949e] mt-0.5">{s.latencyMs}ms</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Architecture ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: "🔍", title: "Scan & Filter", desc: "Fetches tokens from Four.meme, runs GoPlus honeypot and rug checks, filters by liquidity floor." },
              { icon: "⚡", title: "Buy on Four.meme", desc: "Agent buys the token via the bonding curve TokenManager. Tokens delivered directly to your wallet." },
              { icon: "🛡️", title: "Hedge with Level Finance", desc: "Simultaneously opens a BNB short on Level Finance. If BNB dumps, the hedge profits offset your loss." },
            ].map(c => (
              <div key={c.title} className="bg-[#0d1117] border border-[#21262d] rounded-xl p-6 space-y-3">
                <div className="text-3xl">{c.icon}</div>
                <div className="font-bold text-lg">{c.title}</div>
                <div className="text-sm text-[#8b949e] leading-relaxed">{c.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contracts ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Contracts & Skills</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-6 space-y-4">
              <div className="text-sm font-bold text-[#8b949e] uppercase tracking-wider">Deployed Contracts</div>
              {[
                { label: "HedgedBuyer (Testnet)", addr: HEDGED_BUYER, url: `https://testnet.bscscan.com/address/${HEDGED_BUYER}` },
                { label: "Level Finance OrderManager", addr: LEVEL_MANAGER, url: `https://bscscan.com/address/${LEVEL_MANAGER}` },
              ].map(c => (
                <div key={c.label}>
                  <div className="text-xs text-[#8b949e] mb-1">{c.label}</div>
                  <a href={c.url} target="_blank" rel="noreferrer"
                    className="font-mono text-sm text-[#f0a500] hover:text-[#ffe066] transition-colors">
                    {c.addr} ↗
                  </a>
                </div>
              ))}
            </div>
            <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-6 space-y-3">
              <div className="text-sm font-bold text-[#8b949e] uppercase tracking-wider">PurrfectClaw Skills</div>
              {[
                { name: "clawhedge-scan",       id: 56078 },
                { name: "clawhedge-safe-buy",   id: 56074 },
                { name: "clawhedge-set-cap",    id: 56076 },
                { name: "clawhedge-status",     id: 56077 },
                { name: "clawhedge-close-hedge",id: 56075 },
              ].map(s => (
                <a key={s.name} href={`https://www.pieverse.io/skill-store?skill=${s.id}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-between group hover:bg-[#161b22] -mx-2 px-2 py-1 rounded transition-colors">
                  <span className="font-mono text-sm">{s.name}</span>
                  <span className="text-[#8b949e] text-xs group-hover:text-[#f0a500] transition-colors">View ↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#21262d] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#8b949e]">
          <span className="gold-gradient font-black tracking-widest">CLAWHEDGE</span>
          <span>Built for PurrfectClaw Hackathon · BSC · 2025</span>
          <a href="https://github.com/zaxcoraider/clawhedge" target="_blank" rel="noreferrer"
            className="hover:text-[#f0a500] transition-colors">github.com/zaxcoraider/clawhedge ↗</a>
        </div>
      </footer>
    </div>
  );
}
