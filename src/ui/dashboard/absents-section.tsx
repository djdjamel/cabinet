"use client";

import { useState, useEffect } from "react";
import type { TicketVue } from "./use-dashboard";

interface AbsentsSectionProps {
  absents: TicketVue[];
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onSelect: (ticket: TicketVue) => void;
  compact?: boolean;
}

export function AbsentsSection({ absents, onAction, onSelect, compact }: AbsentsSectionProps) {
  const [open, setOpen] = useState(true);

  if (absents.length === 0) return null;

  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left pb-2 mb-4 border-b border-surface-container-highest"
      >
        <span className="text-xs font-label font-bold text-status-absent uppercase tracking-[0.15em] flex items-center gap-2">
          <span aria-hidden="true">✗</span>
          Absents
          {!compact && (
            <span className="text-[10px] font-normal text-on-surface-variant normal-case ml-1">(Délai de grâce)</span>
          )}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-body font-semibold text-status-absent/80 bg-status-absent/10 px-2.5 py-0.5 rounded-full">
            {absents.length} patient{absents.length !== 1 ? "s" : ""}
          </span>
          <span className="text-on-surface-variant text-xs">{open ? "▾" : "▸"}</span>
        </div>
      </button>

      {open && (
        <div className="flex flex-col gap-2">
          {absents.map((t) => (
            <AbsentCard key={t.id} ticket={t} onAction={onAction} onSelect={onSelect} compact={compact} />
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
  compact,
}: {
  ticket: TicketVue;
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onSelect: (ticket: TicketVue) => void;
  compact?: boolean;
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

  if (compact) {
    return (
      <div className="absent-card border-l-4 border-l-status-absent/50 flex items-center gap-3 px-3 py-2 opacity-70 hover:opacity-100 transition-opacity">
        <button
          onClick={() => onSelect(ticket)}
          title="Voir le détail du ticket"
          className="text-xl font-display font-bold tabular-nums w-6 text-center shrink-0 text-status-absent/40 hover:text-status-absent cursor-pointer transition-colors"
        >
          {ticket.numero}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-headline font-bold text-on-surface/70 italic truncate">
            {ticket.nom_prive ?? (
              <span className="not-italic font-normal text-on-surface-variant/70">Sans nom</span>
            )}
          </p>
          <p className="text-xs font-mono text-status-absent tabular-nums">{m}:{s}</p>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onAction(ticket.id, { action: "reintegrer" })}
            className="cursor-pointer text-on-surface text-xs font-label font-bold uppercase hover:text-primary transition-colors px-2 py-1"
            title="Réintégrer"
          >
            ↩
          </button>
          <button
            onClick={() => onAction(ticket.id, { action: "annuler" })}
            className="cursor-pointer text-status-absent/60 text-xs font-label font-bold uppercase hover:text-status-absent transition-colors px-2 py-1"
            title="Annuler"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absent-card px-5 py-3 flex flex-row items-center justify-between gap-4 opacity-70 hover:opacity-100 transition-opacity border-l-4 border-l-status-absent/50">
      {/* Numéro */}
      <button
        onClick={() => onSelect(ticket)}
        title="Voir le détail du ticket"
        className="text-2xl font-display font-bold tabular-nums w-8 text-center shrink-0 text-status-absent/40 hover:text-status-absent cursor-pointer transition-colors"
      >
        {ticket.numero}
      </button>

      {/* Infos */}
      <div className="flex items-center gap-4 flex-grow min-w-0">
        <span className="text-lg font-headline font-bold text-on-surface/70 italic line-through whitespace-nowrap min-w-[100px] truncate">
          {ticket.nom_prive ?? (
            <span className="not-italic no-underline font-normal text-on-surface-variant/70">Sans nom</span>
          )}
        </span>
        <span className="text-xs font-body font-semibold text-status-absent flex items-center gap-1 bg-status-absent/5 px-2 py-0.5 rounded whitespace-nowrap">
          ⏳ {m}:{s} restantes
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={() => onAction(ticket.id, { action: "reintegrer" })}
          className="cursor-pointer text-on-surface text-xs font-label font-bold uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1 px-2 py-1.5"
        >
          ↩ Réintégrer
        </button>
        <button
          onClick={() => onAction(ticket.id, { action: "annuler" })}
          className="cursor-pointer text-status-absent/80 text-xs font-label font-bold uppercase tracking-widest hover:text-status-absent transition-colors px-2 py-1.5"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
