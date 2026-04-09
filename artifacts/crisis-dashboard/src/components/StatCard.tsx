interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  source: string;
  accent: "cyan" | "gold" | "red" | "green" | "purple" | "orange";
  loading?: boolean;
  delay?: number;
}

const accentMap = {
  cyan:   { top: "bg-[#00c8ff]", text: "text-[#00c8ff]", glow: "glow-cyan" },
  gold:   { top: "bg-[#dca028]", text: "text-[#dca028]", glow: "glow-gold" },
  red:    { top: "bg-[#e05050]", text: "text-[#e05050]", glow: "glow-red" },
  green:  { top: "bg-[#32c864]", text: "text-[#32c864]", glow: "glow-green" },
  purple: { top: "bg-[#a07ae0]", text: "text-[#a07ae0]", glow: "" },
  orange: { top: "bg-[#e87040]", text: "text-[#e87040]", glow: "" },
};

const delayClass = ["fade-in", "fade-in-d1", "fade-in-d2", "fade-in-d3", "fade-in-d4"];

export default function StatCard({ label, value, delta, deltaUp, source, accent, loading, delay = 0 }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-white/[0.07] bg-[#0d1117] p-4 transition-all duration-300 hover:border-white/[0.14] ${a.glow} ${delayClass[delay]}`}
      data-testid={`stat-card-${label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${a.top}`} />
      <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-white/30 mb-2">{label}</div>
      {loading ? (
        <>
          <div className="skeleton h-7 w-28 mb-2 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </>
      ) : (
        <>
          <div className="font-mono text-2xl font-light tracking-tight text-white/90">{value}</div>
          {delta && (
            <div className={`font-mono text-[11px] mt-1 ${deltaUp ? "text-[#32c864]" : "text-[#e05050]"}`}>
              {deltaUp ? "↑" : "↓"} {delta}
            </div>
          )}
        </>
      )}
      <div className="font-mono text-[10px] text-white/20 mt-3 pt-3 border-t border-white/[0.06]">{source}</div>
    </div>
  );
}
