"use client";

import { useState, useEffect } from "react";
import type { TicketVue } from "./use-dashboard";

interface AbsentsSectionProps {
  absents: TicketVue[];
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onSelect: (ticket: TicketVue) => void;
}

export function AbsentsSection({ absents, onAction, onSelect }: AbsentsSectionProps) {
  const [open, setOpen] = useState(true);

  if (absents.length === 0) return null;

  return (
    <section>
      {/* Label cliquable pour replier */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span className="w-2 h-2 rounded-full bg-orange-400" />
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-500 group-hover:text-slate-700 transition-colors">
          Absents (délai de grâce)
        </span>
        <span className="ml-1 text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
          {absents.length}
        </span>
        <span className="ml-auto text-slate-400 text-xs">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {absents.map((t) => (
            <AbsentCard key={t.id} ticket={t} onAction={onAction} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}

function AbsentCard({
  ticket,
  onAction,
  onSelect,
}: {
  ticket: TicketVue;
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onSelect: (ticket: TicketVue) => void;
}) {
  const [secsLeft, setSecsLeft] = useState(ticket.grace_restante_sec ?? 0);

  useEffect(() => {
    setSecsLeft(ticket.grace_restante_sec ?? 0);
  }, [ticket.grace_restante_sec]);

  useEffect(() => {
    if (secsLeft <= 0) return;
    const id = setInterval(() => setSecsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secsLeft]);

  const m = Math.floor(secsLeft / 60).toString().padStart(2, "0");
  const s = (secsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-4 bg-orange-50 rounded-2xl border border-orange-200 px-4 py-3 transition-all hover:border-orange-300">
      {/* Numéro héro — même traitement que les autres tickets */}
      <button
        onClick={() => onSelect(ticket)}
        title="Voir le détail du ticket"
        className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold tabular-nums bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer select-none transition-all duration-150 active:scale-95"
      >
        {ticket.numero}
      </button>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate leading-snug">
          {ticket.nom_prive ?? (
            <span className="text-slate-400 italic font-normal">Sans nom</span>
          )}
        </p>
        <p className="text-sm text-orange-600 font-mono tabular-nums mt-0.5">
          ⏳ {m}:{s} restantes
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onAction(ticket.id, { action: "reintegrer" })}
          className="cursor-pointer bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
        >
          Réintégrer ↩
        </button>
        <button
          onClick={() => onAction(ticket.id, { action: "annuler" })}
          className="cursor-pointer bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded-full transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
