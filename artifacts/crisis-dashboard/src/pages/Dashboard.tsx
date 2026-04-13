import { useState, useEffect } from "react";
import { useMarketData, ACTIVE_CONFLICTS } from "../hooks/useMarketData";
import StatCard from "../components/StatCard";
import SparkLine from "../components/SparkLine";
import TrendChart from "../components/TrendChart";

function fmt(n: number, digits = 0) {
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function fmtDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function magColor(mag: number) {
  if (mag >= 7) return "text-[#e05050]";
  if (mag >= 6) return "text-[#dca028]";
  if (mag >= 5) return "text-[#00c8ff]";
  return "text-white/50";
}

const DISASTER_ICONS: Record<string, string> = {
  "Earthquake": "⌀",
  "Flood": "≋",
  "Cyclone": "⊕",
  "Drought": "◎",
  "Volcano": "▲",
  "Epidemic": "⊗",
  "Landslide": "◢",
  "Tsunami": "≈",
  "Cold Wave": "❄",
  "Heat Wave": "◉",
  "Technological Disaster": "⚠",
};

const FOREX_LABELS: Record<string, string> = {
  EUR: "EUR/USD",
  GBP: "GBP/USD",
  JPY: "USD/JPY",
  CHF: "CHF/USD",
};

export default function Dashboard() {
  const { crypto, rates, earthquakes, disasters, crudeOil, lastUpdated, loading, error, refresh } = useMarketData();
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const btc  = crypto.find((c) => c.id === "bitcoin");
  const eth  = crypto.find((c) => c.id === "ethereum");
  const gold = crypto.find((c) => c.id === "pax-gold");

  const majorQuakes = earthquakes.filter((e) => e.magnitude >= 4.5).slice(0, 7);

  const oilAvailable = crudeOil && crudeOil.price > 0;

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <div className="min-h-screen bg-[#080b10] text-white scanline" data-testid="dashboard">
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "linear-gradient(rgba(0,200,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.022) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative z-10 max-w-[1360px] mx-auto px-5 py-5">

        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.07] flex-wrap gap-3 fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md border border-[#00c8ff]/50 bg-[#00c8ff]/10 flex items-center justify-center font-mono text-sm font-semibold text-[#00c8ff] glow-cyan">
              CT
            </div>
            <div>
              <div className="text-[15px] font-medium tracking-tight text-white/90">
                CrisisTrack <span className="text-white/30 font-light">— Global Disruption Monitor</span>
              </div>
              <div className="font-mono text-[11px] text-white/25 mt-0.5">
                {now.toUTCString()} &nbsp;·&nbsp;
                {lastUpdated ? `Updated ${timeAgo(lastUpdated.getTime())}` : "Loading…"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {error && (
              <span className="font-mono text-[11px] px-2.5 py-1 rounded border border-[#dca028]/60 bg-[#dca028]/10 text-[#dca028]">
                ⚠ {error}
              </span>
            )}
            <span className="font-mono text-[11px] px-2.5 py-1 rounded border border-[#e05050] bg-[#e05050]/10 text-[#e05050]">
              <span className="blip inline-block w-1.5 h-1.5 rounded-full bg-[#e05050] mr-1.5 mb-px" />
              Live monitoring
            </span>
            <span className="font-mono text-[11px] px-2.5 py-1 rounded border border-white/[0.12] bg-white/[0.04] text-white/40">
              5 APIs connected
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="font-mono text-[11px] px-2.5 py-1 rounded border border-white/[0.15] bg-white/[0.04] text-white/50 hover:border-[#00c8ff]/50 hover:text-[#00c8ff] transition-all disabled:opacity-40"
              data-testid="button-refresh"
            >
              {refreshing ? "↻ Refreshing…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-3">
          <StatCard
            label="Bitcoin (BTC/USD)"
            value={btc ? `$${fmt(btc.current_price)}` : "—"}
            delta={btc ? `${btc.price_change_percentage_24h.toFixed(2)}% 24h` : undefined}
            deltaUp={btc ? btc.price_change_percentage_24h >= 0 : undefined}
            source="CoinGecko · free, no key"
            accent="gold" loading={loading && !btc} delay={0}
          />
          <StatCard
            label="Ethereum (ETH/USD)"
            value={eth ? `$${fmt(eth.current_price)}` : "—"}
            delta={eth ? `${eth.price_change_percentage_24h.toFixed(2)}% 24h` : undefined}
            deltaUp={eth ? eth.price_change_percentage_24h >= 0 : undefined}
            source="CoinGecko · free, no key"
            accent="cyan" loading={loading && !eth} delay={1}
          />
          <StatCard
            label="Gold (XAU/USD · PAXG)"
            value={gold ? `$${fmt(gold.current_price)}` : "—"}
            delta={gold ? `${gold.price_change_percentage_24h.toFixed(2)}% 24h` : undefined}
            deltaUp={gold ? gold.price_change_percentage_24h >= 0 : undefined}
            source="CoinGecko PAXG · free, no key"
            accent="gold" loading={loading && !gold} delay={2}
          />
          <StatCard
            label="WTI Crude Oil (USD/bbl)"
            value={oilAvailable ? `$${fmt(crudeOil!.price, 2)}` : "—"}
            delta={oilAvailable ? `${crudeOil!.change24h.toFixed(2)}% 24h` : undefined}
            deltaUp={oilAvailable ? crudeOil!.change24h >= 0 : undefined}
            source={crudeOil?.source ?? "Yahoo Finance · free, no key"}
            accent="orange" loading={loading && !crudeOil} delay={3}
          />
          <StatCard
            label="EUR / USD"
            value={rates ? `${(1 / rates.rates.EUR).toFixed(4)}` : "—"}
            source="open.er-api.com · free, no key"
            accent="green" loading={loading && !rates} delay={4}
          />
        </div>

        {/* ── MAIN GRID — CHART + RANKINGS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-2.5 mb-2.5">
          <div className="rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 fade-in-d1">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                7-Day Price Trend (% change from open)
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/25">CoinGecko · Yahoo Finance</span>
            </div>
            <TrendChart crypto={crypto} crudeOilSparkline={oilAvailable ? crudeOil!.sparkline : undefined} />
          </div>

          {/* Asset ranking */}
          <div className="rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 fade-in-d2">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">Asset Performance</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/25">live</span>
            </div>
            {loading && !crypto.length ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                  <div className="skeleton h-3 w-full rounded" />
                </div>
              ))
            ) : (
              <>
                {crypto.slice(0, 5).map((c, i) => {
                  const pct = c.price_change_percentage_24h;
                  const up = pct >= 0;
                  const barPct = Math.min(100, Math.abs(pct) * 8);
                  return (
                    <div key={c.id} className="flex items-center gap-2.5 py-2 border-b border-white/[0.05] last:border-0"
                      data-testid={`asset-row-${c.id}`}>
                      <span className="font-mono text-[11px] text-white/25 w-4">{i + 1}</span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${up ? "bg-[#32c864]" : "bg-[#e05050]"}`} />
                      <span className="text-[12px] text-white/80 flex-1 truncate">{c.name}</span>
                      <div className="w-14 h-1 bg-white/[0.05] rounded overflow-hidden">
                        <div className={`h-full rounded transition-all duration-700 ${up ? "bg-[#32c864]" : "bg-[#e05050]"}`} style={{ width: `${barPct}%` }} />
                      </div>
                      <span className={`font-mono text-[11px] font-medium min-w-[50px] text-right ${up ? "text-[#32c864]" : "text-[#e05050]"}`}>
                        {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
                {oilAvailable && (() => {
                  const pct = crudeOil!.change24h;
                  const up = pct >= 0;
                  const barPct = Math.min(100, Math.abs(pct) * 8);
                  return (
                    <div className="flex items-center gap-2.5 py-2 border-t border-white/[0.05]" data-testid="asset-row-crude">
                      <span className="font-mono text-[11px] text-white/25 w-4">{crypto.slice(0, 5).length + 1}</span>
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#e87040]" />
                      <span className="text-[12px] text-white/80 flex-1 truncate">WTI Crude Oil</span>
                      <div className="w-14 h-1 bg-white/[0.05] rounded overflow-hidden">
                        <div className={`h-full rounded transition-all duration-700 ${up ? "bg-[#32c864]" : "bg-[#e05050]"}`} style={{ width: `${barPct}%` }} />
                      </div>
                      <span className={`font-mono text-[11px] font-medium min-w-[50px] text-right ${up ? "text-[#32c864]" : "text-[#e05050]"}`}>
                        {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                      </span>
                    </div>
                  );
                })()}
              </>
            )}
            {gold && gold.sparkline_in_7d && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <div className="font-mono text-[10px] text-white/25 mb-1.5">Gold (PAXG) 7d</div>
                <SparkLine data={gold.sparkline_in_7d.price} color="#fde047" height={34} />
              </div>
            )}
          </div>
        </div>

        {/* ── CONFLICT + CRISIS ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-2.5 mb-2.5">

          {/* ACTIVE CONFLICTS */}
          <div className="rounded-lg border border-[#e05050]/25 bg-[#0d1117] p-4 fade-in-d3" style={{ boxShadow: "0 0 16px rgba(220,80,80,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="blip inline-block w-1.5 h-1.5 rounded-full bg-[#e05050]" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">Active Conflicts &amp; Wars</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-[#e05050]/30 bg-[#e05050]/08 text-[#e05050]/70">
                {ACTIVE_CONFLICTS.length} tracked
              </span>
            </div>
            <div className="space-y-2">
              {ACTIVE_CONFLICTS.map((c, i) => (
                <div key={i} className="group" data-testid={`conflict-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}40` }}>
                        {c.region}
                      </span>
                      <span className="text-[12px] text-white/80">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-white/30 hidden sm:block">since {c.since}</span>
                      <span className="font-mono text-[11px] font-semibold" style={{ color: c.color }}>{c.intensity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/[0.05] rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-700"
                        style={{ width: `${c.intensity}%`, background: c.color, opacity: 0.7 }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-white/25 min-w-[64px] text-right">{c.casualties}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] font-mono text-[10px] text-white/20">
              Intensity 0–100 · Casualties from public sources · est. as of 2025
            </div>
          </div>

          {/* RELIEFWEB DISASTERS */}
          <div className="rounded-lg border border-[#dca028]/20 bg-[#0d1117] p-4 fade-in-d4" style={{ boxShadow: "0 0 16px rgba(220,160,40,0.05)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="blip inline-block w-1.5 h-1.5 rounded-full bg-[#dca028]" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">Live Disaster Feed</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/25">ReliefWeb</span>
            </div>
            {loading && !disasters.length ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="py-2 border-b border-white/[0.05]">
                  <div className="skeleton h-3 w-full rounded mb-1" />
                  <div className="skeleton h-2.5 w-28 rounded" />
                </div>
              ))
            ) : disasters.length ? (
              <div className="overflow-y-auto max-h-[280px] pr-1 space-y-0">
                {disasters.map((d) => (
                  <div key={d.id} className="py-2 border-b border-white/[0.05] last:border-0"
                    data-testid={`disaster-${d.id}`}>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-[13px] text-[#dca028]/70 mt-0.5 flex-shrink-0">
                        {DISASTER_ICONS[d.type] ?? "◈"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-white/75 leading-tight mb-0.5 line-clamp-2">{d.name}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-[#00c8ff]/60">{d.country}</span>
                          <span className="font-mono text-[10px] text-white/25">{d.type}</span>
                          {d.date && <span className="font-mono text-[10px] text-white/20">{fmtDate(d.date)}</span>}
                          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded uppercase ${
                            d.status === "ongoing"
                              ? "bg-[#e05050]/10 text-[#e05050]/70 border border-[#e05050]/20"
                              : "bg-white/[0.04] text-white/25 border border-white/[0.08]"
                          }`}>
                            {d.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="font-mono text-xs text-white/25">No recent disasters in feed</div>
            )}
          </div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">

          {/* FX RATES */}
          <div className="rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 fade-in-d4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">FX Rates (vs USD)</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/25">open.er-api</span>
            </div>
            {loading && !rates ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-3">
                  <div className="skeleton h-3 w-full rounded mb-1" />
                  <div className="skeleton h-1.5 w-full rounded" />
                </div>
              ))
            ) : rates ? (
              Object.entries(FOREX_LABELS).map(([code, label]) => {
                const val = code === "JPY" ? rates.rates[code] : 1 / rates.rates[code];
                const barPct = code === "JPY" ? Math.min(100, (val / 170) * 100) : Math.min(100, val * 100);
                return (
                  <div key={code} className="mb-3 last:mb-0" data-testid={`fx-row-${code}`}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] text-white/60">{label}</span>
                      <span className="font-mono text-[12px] font-medium text-white/90">
                        {fmt(val, code === "JPY" ? 2 : 4)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded overflow-hidden">
                      <div className="h-full bg-[#32c864] rounded transition-all duration-700" style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="font-mono text-xs text-white/25">Data unavailable</div>
            )}
          </div>

          {/* SEISMIC EVENTS */}
          <div className="rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 fade-in-d5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">Seismic Events ≥4.5</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/25">USGS</span>
            </div>
            {loading && !earthquakes.length ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-2 border-b border-white/[0.05]">
                  <div className="skeleton h-3 w-full rounded mb-1" />
                  <div className="skeleton h-2.5 w-24 rounded" />
                </div>
              ))
            ) : majorQuakes.length ? (
              <div className="overflow-y-auto max-h-[220px] pr-1">
                {majorQuakes.map((eq) => (
                  <div key={eq.id} className="py-2 border-b border-white/[0.05] last:border-0" data-testid={`quake-${eq.id}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-mono text-[13px] font-semibold ${magColor(eq.magnitude)}`}>
                        M{eq.magnitude.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-white/60 truncate">{eq.place}</span>
                    </div>
                    <div className="font-mono text-[10px] text-white/25">{timeAgo(eq.time)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="font-mono text-xs text-white/25">No significant events this week</div>
            )}
          </div>

          {/* MARKET SNAPSHOT */}
          <div className="rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 fade-in-d5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">Market Snapshot</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/25">CoinGecko · Yahoo</span>
            </div>
            {loading && !crypto.length ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-3"><div className="skeleton h-3 w-full rounded" /></div>
              ))
            ) : (
              <div className="space-y-3">
                {[btc, eth, gold].filter(Boolean).map((c) => (
                  <div key={c!.id} className="flex items-center justify-between" data-testid={`snapshot-${c!.id}`}>
                    <div>
                      <div className="text-[12px] text-white/70 font-medium">{c!.symbol.toUpperCase()}</div>
                      <div className="font-mono text-[10px] text-white/25">
                        {c!.id === "pax-gold" ? "1 troy oz gold" : `$${fmt(c!.market_cap / 1e9, 1)}B cap`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[13px] text-white/90">${fmt(c!.current_price)}</div>
                      {c!.sparkline_in_7d && (
                        <div className="w-[80px]">
                          <SparkLine
                            data={c!.sparkline_in_7d.price.filter((_, i) => i % 8 === 0)}
                            color={c!.price_change_percentage_24h >= 0 ? "#32c864" : "#e05050"}
                            height={28}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {oilAvailable && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]" data-testid="snapshot-crude">
                    <div>
                      <div className="text-[12px] text-white/70 font-medium">WTI</div>
                      <div className="font-mono text-[10px] text-white/25">crude oil · per bbl</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[13px] text-white/90">${fmt(crudeOil!.price, 2)}</div>
                      {crudeOil!.sparkline.length > 1 && (
                        <div className="w-[80px]">
                          <SparkLine
                            data={crudeOil!.sparkline}
                            color={crudeOil!.change24h >= 0 ? "#32c864" : "#e05050"}
                            height={28}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <div className="font-mono text-[10px] text-white/20 leading-relaxed">
                All data · strictly free APIs · no subscription.<br />
                Deployable to Vercel / GitHub Pages as-is.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
