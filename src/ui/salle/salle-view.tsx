"use client";

import { useEffect, useState } from "react";

interface SalleData {
  cabinetNom: string;
  enCours: { numero: number } | null;
  appele:  { numero: number } | null;
  enAttenteCount: number;
}

export function SalleView({ cabinetId }: { cabinetId: string }) {
  const [data, setData] = useState<SalleData | null>(null);

  useEffect(() => {
    function load() {
      fetch(`/api/salle/${cabinetId}`)
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    }
    load();
    const id = setInterval(load, 5_000);
    return () => clearInterval(id);
  }, [cabinetId]);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-600 text-xl">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col select-none">

      {/* En-tête cabinet */}
      <div className="text-center py-5 border-b border-gray-700">
        <h1 className="text-2xl font-display font-semibold text-gray-300 tracking-wide">
          {data.cabinetNom}
        </h1>
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12 p-8">

        {/* Numéro en consultation */}
        <div className="text-center">
          <p className="text-base uppercase tracking-widest text-gray-500 mb-4">
            En consultation / في الاستشارة
          </p>
          {data.enCours ? (
            <p className="text-[12rem] font-display font-bold leading-none tabular-nums text-status-consultation">
              {data.enCours.numero}
            </p>
          ) : (
            <p className="text-6xl text-gray-700">–</p>
          )}
        </div>

        {/* Numéro appelé (en attente de réponse) */}
        {data.appele && (
          <div className="text-center bg-primary/10 border border-primary/30 rounded-xl px-20 py-8">
            <p className="text-base uppercase tracking-widest text-primary/70 mb-3 font-label">
              Appelé / تم استدعاؤه
            </p>
            <p className="text-7xl font-display font-bold tabular-nums text-primary/90">
              {data.appele.numero}
            </p>
          </div>
        )}

        {/* File d'attente */}
        <p className="text-xl text-gray-500">
          <span className="font-bold text-white text-3xl tabular-nums">
            {data.enAttenteCount}
          </span>
          {" "}patient{data.enAttenteCount !== 1 ? "s" : ""} en attente
          {" / "}
          <span dir="rtl">{data.enAttenteCount} في الانتظار</span>
        </p>
      </div>

      {/* Horloge */}
      <ClockBar />
    </div>
  );
}

function ClockBar() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center py-5 border-t border-gray-700">
      <p className="text-5xl font-mono text-gray-500 tabular-nums">
        {time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
