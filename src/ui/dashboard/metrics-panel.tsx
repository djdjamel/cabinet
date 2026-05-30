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

  const dureeText = metrics.duree_moy_min !== null ? `${metrics.duree_moy_min} min` : "—";

  return (
    <div className="flex border border-outline-variant/60 rounded-sm overflow-hidden bg-white">
      <Stat label="Total" value={metrics.total} />
      <Stat label="Terminés" value={metrics.termines} color="text-status-consultation" divider />
      <Stat label="En attente" value={metrics.en_attente} color="text-primary" divider />
      <Stat label="Durée moy." value={dureeText} divider />
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-on-surface",
  divider,
}: {
  label: string;
  value: string | number;
  color?: string;
  divider?: boolean;
}) {
  return (
    <div className={`flex-1 px-6 py-4 ${divider ? "border-l border-outline-variant/40" : ""}`}>
      <p className={`text-3xl font-display font-bold tabular-nums leading-none ${color}`}>{value}</p>
      <p className="text-xs font-label font-bold text-on-surface-variant/60 uppercase tracking-[0.12em] mt-1.5">{label}</p>
    </div>
  );
}
