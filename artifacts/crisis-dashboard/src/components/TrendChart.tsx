import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { CryptoPrice } from "../hooks/useMarketData";

interface TrendChartProps {
  crypto: CryptoPrice[];
  crudeOilSparkline?: number[];
}

const CRYPTO_LINES = [
  { id: "bitcoin",  color: "#f97316", label: "BTC" },   // Bitcoin orange
  { id: "ethereum", color: "#00c8ff", label: "ETH" },   // cyan (unchanged)
  { id: "pax-gold", color: "#fde047", label: "XAU (PAXG)" }, // bright yellow-gold
];

const OIL_COLOR = "#e87040";

// Linear interpolation: resample `data` to `targetLen` evenly-spaced points
function interpolate(data: number[], targetLen: number): number[] {
  if (data.length === 0) return [];
  if (data.length >= targetLen) return data.slice(0, targetLen);
  const result: number[] = [];
  for (let i = 0; i < targetLen; i++) {
    const t   = (i / (targetLen - 1)) * (data.length - 1);
    const lo  = Math.floor(t);
    const hi  = Math.min(lo + 1, data.length - 1);
    const frac = t - lo;
    result.push(data[lo] * (1 - frac) + data[hi] * frac);
  }
  return result;
}

export default function TrendChart({ crypto, crudeOilSparkline }: TrendChartProps) {
  const present = CRYPTO_LINES.filter((l) => crypto.find((c) => c.id === l.id));
  const hasOil  = crudeOilSparkline && crudeOilSparkline.length >= 2;

  if (!present.length || !crypto[0]?.sparkline_in_7d) {
    return (
      <div className="flex items-center justify-center h-[180px] text-white/20 font-mono text-xs">
        Awaiting data…
      </div>
    );
  }

  const len  = Math.max(...present.map((l) => crypto.find((c) => c.id === l.id)?.sparkline_in_7d?.price.length ?? 0));
  const step = Math.max(1, Math.floor(len / 48));
  const numPoints = Math.ceil(len / step);

  // Interpolate crude oil to match chart resolution
  const oilInterp = hasOil ? interpolate(crudeOilSparkline!, numPoints) : [];

  const chartData = Array.from({ length: numPoints }, (_, i) => {
    const idx   = i * step;
    const entry: Record<string, number | null | string> = {
      t: `${Math.round((idx / len) * 7)}d`,
    };
    present.forEach((l) => {
      const coin = crypto.find((c) => c.id === l.id);
      const base = coin?.sparkline_in_7d?.price[0] ?? 1;
      const val  = coin?.sparkline_in_7d?.price[idx];
      entry[l.id] = val != null ? +((val / base - 1) * 100).toFixed(2) : null;
    });
    if (hasOil && oilInterp.length > 0) {
      const oilBase = oilInterp[0];
      const oilVal  = oilInterp[i];
      entry["crude_oil"] = oilBase > 0 ? +((oilVal / oilBase - 1) * 100).toFixed(2) : null;
    }
    return entry;
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="t" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, fontSize: 11, fontFamily: "IBM Plex Mono" }}
            formatter={(v: number, name: string) => {
              if (name === "crude_oil") return [`${v > 0 ? "+" : ""}${v}%`, "WTI Crude"];
              const l = CRYPTO_LINES.find((x) => x.id === name);
              return [`${v > 0 ? "+" : ""}${v}%`, l?.label ?? name];
            }}
          />
          {present.map((l) => (
            <Line key={l.id} type="monotone" dataKey={l.id} stroke={l.color} strokeWidth={1.5} dot={false} name={l.id} />
          ))}
          {hasOil && (
            <Line type="monotone" dataKey="crude_oil" stroke={OIL_COLOR} strokeWidth={1.5} dot={false} name="crude_oil" strokeDasharray="4 2" />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-5 mt-3 flex-wrap">
        {present.map((l) => (
          <div key={l.id} className="flex items-center gap-2 font-mono text-[11px] text-white/30">
            <span className="inline-block w-5 h-0.5 rounded" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
        {hasOil && (
          <div className="flex items-center gap-2 font-mono text-[11px] text-white/30">
            <span className="inline-block w-5 h-0.5 rounded" style={{ background: OIL_COLOR, borderTop: `2px dashed ${OIL_COLOR}` }} />
            WTI Crude
          </div>
        )}
      </div>
    </div>
  );
}
