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
    <div className="mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 w-full text-left"
      >
        <span>{open ? "▾" : "▸"}</span>
        <span>ABSENTS (en délai)</span>
        <span className="ml-auto bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
          {absents.length}
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {absents.map((t) => (
            <AbsentCard key={t.id} ticket={t} onAction={onAction} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
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

  // Décompte local
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
    <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
      <button
        onClick={() => onSelect(ticket)}
        className="text-xl font-bold text-orange-600 hover:text-orange-800 w-10 text-left tabular-nums shrink-0"
      >
        {ticket.numero}
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">
          {ticket.nom_prive ?? <span className="text-gray-400 italic">Sans nom</span>}
        </p>
        <p className="text-sm text-orange-600 font-mono tabular-nums">
          ⏳ {m}:{s} restantes
        </p>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onAction(ticket.id, { action: "reintegrer" })}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
        >
          Réintégrer ↩
        </button>
        <button
          onClick={() => onAction(ticket.id, { action: "annuler" })}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
