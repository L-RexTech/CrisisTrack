import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { CryptoPrice } from "../hooks/useMarketData";

interface TrendChartProps {
  crypto: CryptoPrice[];
}

const LINES = [
  { id: "bitcoin",   color: "#dca028", label: "BTC" },
  { id: "ethereum",  color: "#00c8ff", label: "ETH" },
  { id: "pax-gold",  color: "#c8a032", label: "XAU (PAXG)" },
];

export default function TrendChart({ crypto }: TrendChartProps) {
  const present = LINES.filter((l) => crypto.find((c) => c.id === l.id));
  if (!present.length || !crypto[0]?.sparkline_in_7d) {
    return (
      <div className="flex items-center justify-center h-[180px] text-white/20 font-mono text-xs">
        Awaiting data…
      </div>
    );
  }

  const len = Math.max(...present.map((l) => crypto.find((c) => c.id === l.id)?.sparkline_in_7d?.price.length ?? 0));
  const step = Math.max(1, Math.floor(len / 48));

  const chartData = Array.from({ length: Math.ceil(len / step) }, (_, i) => {
    const idx = i * step;
    const entry: Record<string, number | null | string> = {
      t: `${Math.round((idx / len) * 7)}d`,
    };
    present.forEach((l) => {
      const coin = crypto.find((c) => c.id === l.id);
      const base = coin?.sparkline_in_7d?.price[0] ?? 1;
      const val  = coin?.sparkline_in_7d?.price[idx];
      entry[l.id] = val != null ? +((val / base - 1) * 100).toFixed(2) : null;
    });
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
              const l = LINES.find((x) => x.id === name);
              return [`${v > 0 ? "+" : ""}${v}%`, l?.label ?? name];
            }}
          />
          {present.map((l) => (
            <Line key={l.id} type="monotone" dataKey={l.id} stroke={l.color} strokeWidth={1.5} dot={false} name={l.id} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-5 mt-3 flex-wrap">
        {present.map((l) => (
          <div key={l.id} className="flex items-center gap-2 font-mono text-[11px] text-white/30">
            <span className="inline-block w-5 h-0.5 rounded" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
