"use client";

import { useEffect, useState } from "react";

interface Metrics {
  total: number;
  termines: number;
  en_cours: number;
  en_attente: number;
  absents: number;
  expires: number;
  annules: number;
  duree_moy_min: number | null;
}

export function MetricsPanel() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    function load() {
      fetch("/api/metrics")
        .then((r) => r.json())
        .then(setMetrics)
        .catch(() => {});
    }
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!metrics) return null;

  const dureeText = metrics.duree_moy_min != null ? `${metrics.duree_moy_min} min` : "—";

  return (
    <div className="grid grid-cols-2 gap-px bg-outline-variant/30 border border-outline-variant/40 rounded-sm overflow-hidden">
      <StatCell label="Total"      value={metrics.total} />
      <StatCell label="Terminés"   value={metrics.termines}   color="text-status-consultation" />
      <StatCell label="En attente" value={metrics.en_attente} color="text-primary" />
      <StatCell label="Durée moy." value={dureeText} />
    </div>
  );
}

function StatCell({
  label,
  value,
  color = "text-on-surface",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <p className={`text-2xl font-display font-bold tabular-nums leading-none ${color}`}>{value}</p>
      <p className="text-[10px] font-label font-bold text-on-surface-variant/60 uppercase tracking-[0.12em] mt-1">{label}</p>
    </div>
  );
}
