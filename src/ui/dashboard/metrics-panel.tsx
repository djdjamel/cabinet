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

  const dureeText = metrics.duree_moy_min !== null
    ? <>{metrics.duree_moy_min}<span className="text-xl ml-1 font-normal">m</span></>
    : "–";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Stat
        label="Total patients"
        value={metrics.total}
        color="text-on-surface"
        icon="👥"
      />
      <Stat
        label="Consultations terminées"
        value={metrics.termines}
        color="text-status-consultation"
        icon="✓"
      />
      <Stat
        label="En salle d'attente"
        value={metrics.en_attente}
        color="text-primary"
        icon="⏳"
        accentBg
      />
      <Stat
        label="Durée moyenne"
        value={dureeText}
        color="text-on-surface/80"
        icon="🕐"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  icon,
  accentBg,
}: {
  label: string;
  value: React.ReactNode;
  color: string;
  icon: string;
  accentBg?: boolean;
}) {
  return (
    <div className={`metric-card${accentBg ? " bg-primary/5" : ""}`}>
      <div className="absolute top-0 right-0 p-3 opacity-10 text-3xl pointer-events-none select-none" aria-hidden="true">
        {icon}
      </div>
      <span className={`text-3xl font-display font-bold z-10 ${color}`}>{value}</span>
      <span className="text-xs font-body text-on-surface-variant font-semibold mt-1 z-10">{label}</span>
    </div>
  );
}
