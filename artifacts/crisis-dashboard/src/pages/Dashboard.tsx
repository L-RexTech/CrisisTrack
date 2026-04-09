import { useState, useEffect } from "react";
import { useMarketData } from "../hooks/useMarketData";
import StatCard from "../components/StatCard";
import SparkLine from "../components/SparkLine";
import TrendChart from "../components/TrendChart";

function fmt(n: number, digits = 0) {
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtPct(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function magColor(mag: number) {
  if (mag >= 7) return "text-[#e05050]";
  if (mag >= 6) return "text-[#dca028]";
  if (mag >= 5) return "text-[#00c8ff]";
  return "text-white/50";
}

const FOREX_LABELS: Record<string, string> = {
  EUR: "EUR/USD",
  GBP: "GBP/USD",
  JPY: "USD/JPY",
  CHF: "CHF/USD",
};

export default function Dashboard() {
  const { crypto, rates, earthquakes, lastUpdated, loading, error, refresh } = useMarketData();
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const btc = crypto.find((c) => c.id === "bitcoin");
  const eth = crypto.find((c) => c.id === "ethereum");

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const majorQuakes = earthquakes.filter((e) => e.magnitude >= 4.5).slice(0, 8);

  return (
    <div className="min-h-screen bg-[#080b10] text-white scanline" data-testid="dashboard">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "linear-gradient(rgba(0,200,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.025) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div className="relative z-10 max-w-[1280px] mx-auto px-5 py-5">

        {/* TOP BAR */}
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
                {lastUpdated ? `Refreshed ${timeAgo(lastUpdated.getTime())}` : "Loading…"}
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
              3 APIs connected
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

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
          <StatCard
            label="Bitcoin (BTC/USD)"
            value={btc ? `$${fmt(btc.current_price)}` : "—"}
            delta={btc ? `${btc.price_change_percentage_24h.toFixed(2)}% 24h` : undefined}
            deltaUp={btc ? btc.price_change_percentage_24h >= 0 : undefined}
            source="CoinGecko · free, no key"
            accent="gold"
            loading={loading && !btc}
            delay={0}
          />
          <StatCard
            label="Ethereum (ETH/USD)"
            value={eth ? `$${fmt(eth.current_price)}` : "—"}
            delta={eth ? `${eth.price_change_percentage_24h.toFixed(2)}% 24h` : undefined}
            deltaUp={eth ? eth.price_change_percentage_24h >= 0 : undefined}
            source="CoinGecko · free, no key"
            accent="cyan"
            loading={loading && !eth}
            delay={1}
          />
          <StatCard
            label="EUR / USD"
            value={rates ? `${(1 / rates.rates.EUR).toFixed(4)}` : "—"}
            source="Frankfurter API · free, no key"
            accent="green"
            loading={loading && !rates}
            delay={2}
          />
          <StatCard
            label="USD / JPY"
            value={rates ? fmt(rates.rates.JPY, 2) : "—"}
            source="Frankfurter API · free, no key"
            accent="purple"
            loading={loading && !rates}
            delay={3}
          />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2.5 mb-2.5">

          {/* TREND CHART */}
          <div className="rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 fade-in-d1">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                7-Day Price Trend (% change from open)
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/25">
                CoinGecko Sparkline
              </span>
            </div>
            <TrendChart crypto={crypto} />
            <div className="flex gap-5 mt-3">
              <div className="flex items-center gap-2 font-mono text-[11px] text-white/30">
                <span className="inline-block w-5 h-0.5 bg-[#dca028] rounded" /> Bitcoin
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-white/30">
                <span className="inline-block w-5 h-0.5 bg-[#00c8ff] rounded" /> Ethereum
              </div>
            </div>
          </div>

          {/* ASSET RANKINGS */}
          <div className="rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 fade-in-d2">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">Top Crypto by Cap</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/25">live</span>
            </div>
            {loading && !crypto.length ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                  <div className="skeleton h-3 w-full rounded" />
                </div>
              ))
            ) : (
              crypto.filter((c) => ["bitcoin", "ethereum"].includes(c.id)).concat(
                crypto.filter((c) => !["bitcoin", "ethereum"].includes(c.id))
              ).slice(0, 6).map((c, i) => {
                const pct = c.price_change_percentage_24h;
                const up = pct >= 0;
                const barPct = Math.min(100, Math.abs(pct) * 10);
                return (
                  <div key={c.id} className="flex items-center gap-2.5 py-2 border-b border-white/[0.05] last:border-0"
                    data-testid={`asset-row-${c.id}`}>
                    <span className="font-mono text-[11px] text-white/25 w-4">{i + 1}</span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${up ? "bg-[#32c864]" : "bg-[#e05050]"}`} />
                    <span className="text-[12px] text-white/80 flex-1">{c.name}</span>
                    <div className="flex-[1.5] h-1 bg-white/[0.05] rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all duration-700 ${up ? "bg-[#32c864]" : "bg-[#e05050]"}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className={`font-mono text-[12px] font-medium min-w-[56px] text-right ${up ? "text-[#32c864]" : "text-[#e05050]"}`}>
                      {fmtPct(pct)}
                    </span>
                  </div>
                );
              })
            )}
            {btc && btc.sparkline_in_7d && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <div className="font-mono text-[10px] text-white/25 mb-1.5">BTC 7d</div>
                <SparkLine data={btc.sparkline_in_7d.price} color="#dca028" height={36} />
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">

          {/* FOREX RATES */}
          <div className="rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 fade-in-d3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">FX Rates (vs USD)</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/25">Frankfurter</span>
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
                const barPct = code === "JPY"
                  ? Math.min(100, (val / 160) * 100)
                  : Math.min(100, val * 100);
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

          {/* EARTHQUAKE FEED */}
          <div className="rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 fade-in-d4">
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
                  <div key={eq.id} className="py-2 border-b border-white/[0.05] last:border-0"
                    data-testid={`quake-${eq.id}`}>
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
              <div className="font-mono text-xs text-white/25">No significant events in past 7 days</div>
            )}
          </div>

          {/* MARKET SNAPSHOT */}
          <div className="rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 fade-in-d5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">Market Snapshot</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/25">CoinGecko</span>
            </div>
            {loading && !crypto.length ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-3">
                  <div className="skeleton h-3 w-full rounded mb-1" />
                </div>
              ))
            ) : (
              <div className="space-y-3">
                {crypto.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between" data-testid={`snapshot-${c.id}`}>
                    <div>
                      <div className="text-[12px] text-white/70 font-medium">{c.symbol.toUpperCase()}</div>
                      <div className="font-mono text-[10px] text-white/25">${fmt(c.market_cap / 1e9, 1)}B cap</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[13px] text-white/90">${fmt(c.current_price)}</div>
                      {c.sparkline_in_7d && (
                        <div className="w-[80px]">
                          <SparkLine
                            data={c.sparkline_in_7d.price.filter((_, i) => i % 8 === 0)}
                            color={c.price_change_percentage_24h >= 0 ? "#32c864" : "#e05050"}
                            height={28}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer note */}
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <div className="font-mono text-[10px] text-white/20 leading-relaxed">
                All data from strictly free, no-subscription APIs.<br />
                Deployable to Vercel / GitHub Pages as-is.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
