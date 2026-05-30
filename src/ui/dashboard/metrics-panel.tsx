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

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Métriques du jour
      </p>
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Total"       value={metrics.total} />
        <Stat label="Vus"         value={metrics.termines}  color="text-green-600" />
        <Stat label="En attente"  value={metrics.en_attente} color="text-blue-600" />
        <Stat
          label="Durée moy."
          value={metrics.duree_moy_min !== null ? `${metrics.duree_moy_min} min` : "–"}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-gray-800",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
