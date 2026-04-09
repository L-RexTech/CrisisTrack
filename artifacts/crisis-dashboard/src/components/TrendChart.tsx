import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { CryptoPrice } from "../hooks/useMarketData";

interface TrendChartProps {
  crypto: CryptoPrice[];
}

const COLORS: Record<string, string> = {
  bitcoin: "#dca028",
  ethereum: "#00c8ff",
};

export default function TrendChart({ crypto }: TrendChartProps) {
  if (!crypto.length || !crypto[0].sparkline_in_7d) {
    return (
      <div className="flex items-center justify-center h-[180px] text-white/20 font-mono text-xs">
        Awaiting data…
      </div>
    );
  }

  const btc = crypto.find((c) => c.id === "bitcoin");
  const eth = crypto.find((c) => c.id === "ethereum");

  const len = Math.max(btc?.sparkline_in_7d?.price.length ?? 0, eth?.sparkline_in_7d?.price.length ?? 0);
  const step = Math.max(1, Math.floor(len / 48));

  const chartData = Array.from({ length: Math.ceil(len / step) }, (_, i) => {
    const idx = i * step;
    const btcBase = btc?.sparkline_in_7d?.price[0] ?? 1;
    const ethBase = eth?.sparkline_in_7d?.price[0] ?? 1;
    return {
      t: `${Math.round((idx / len) * 7)}d`,
      btc: btc?.sparkline_in_7d?.price[idx]
        ? +((btc.sparkline_in_7d.price[idx] / btcBase - 1) * 100).toFixed(2)
        : null,
      eth: eth?.sparkline_in_7d?.price[idx]
        ? +((eth.sparkline_in_7d.price[idx] / ethBase - 1) * 100).toFixed(2)
        : null,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="t" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, fontSize: 11, fontFamily: "IBM Plex Mono" }}
          formatter={(v: number) => [`${v > 0 ? "+" : ""}${v}%`, ""]}
        />
        {btc && <Line type="monotone" dataKey="btc" stroke={COLORS.bitcoin} strokeWidth={1.5} dot={false} name="BTC" />}
        {eth && <Line type="monotone" dataKey="eth" stroke={COLORS.ethereum} strokeWidth={1.5} dot={false} name="ETH" />}
      </LineChart>
    </ResponsiveContainer>
  );
}
