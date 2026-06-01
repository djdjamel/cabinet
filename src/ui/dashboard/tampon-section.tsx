"use client";

import type { TicketVue } from "./use-dashboard";

const BUFFER_SIZE = 2;

const TYPE_CONFIG: Record<string, { label: string; chip: string }> = {
  normal:     { label: "Normal",     chip: "text-on-surface-variant/70 bg-surface-container" },
  urgent:     { label: "Urgent",     chip: "text-status-absent bg-status-absent/8" },
  acte_court: { label: "Acte court", chip: "text-status-consultation bg-status-consultation/8" },
};

function formatDuree(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

interface TamponSectionProps {
  tampon: TicketVue[];
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onSelect: (ticket: TicketVue) => void;
  afficherNom?: boolean;
}

export function TamponSection({ tampon, onAction, onSelect, afficherNom }: TamponSectionProps) {
  const slots = Array.from({ length: BUFFER_SIZE }, (_, i) => tampon[i] ?? null);

  return (
    <div className="grid grid-cols-2 gap-3">
      {slots.map((ticket, i) =>
        ticket ? (
          <FilledSlot
            key={ticket.id}
            ticket={ticket}
            onAction={onAction}
            onSelect={onSelect}
            afficherNom={afficherNom}
          />
        ) : (
          <EmptySlot key={`empty-${i}`} />
        )
      )}
    </div>
  );
}

function FilledSlot({
  ticket,
  onAction,
  onSelect,
  afficherNom,
}: {
  ticket: TicketVue;
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onSelect: (ticket: TicketVue) => void;
  afficherNom?: boolean;
}) {
  const cfg = TYPE_CONFIG[ticket.type] ?? TYPE_CONFIG.normal;
  const sinceMin = ticket.appele_le
    ? Math.floor((Date.now() - new Date(ticket.appele_le).getTime()) / 60000)
    : null;

  return (
    <div className="relative overflow-hidden bg-status-waitlist/8 border border-status-waitlist/25 border-l-4 border-l-status-waitlist rounded-lg px-4 py-3 flex flex-col gap-3">
      {/* Icône d'état — personne avec flèche avant */}
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-status-waitlist opacity-[0.09] pointer-events-none select-none" aria-hidden="true">
        <PersonArrowIcon />
      </span>
      {/* Numéro + timer */}
      <div className="flex items-start justify-between">
        <button
          onClick={() => onSelect(ticket)}
          title="Voir le détail"
          className="text-4xl font-display font-bold tabular-nums text-status-waitlist leading-none hover:opacity-70 cursor-pointer transition-opacity"
        >
          {ticket.numero}
        </button>
        {sinceMin !== null && (
          <span className="text-xs text-on-surface-variant/60 mt-1 tabular-nums">
            {formatDuree(sinceMin)}
          </span>
        )}
      </div>

      {/* Type chip + nom optionnel */}
      <div className="space-y-1">
        <span className={`text-xs font-label font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${cfg.chip}`}>
          {cfg.label}
        </span>
        {afficherNom && ticket.nom_prive && (
          <p className="text-xs font-headline font-bold text-on-surface/70 italic truncate">
            {ticket.nom_prive}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={() => onAction(ticket.id, { action: "demarrer" })}
          className="cursor-pointer flex-1 border border-status-consultation/30 text-status-consultation text-xs font-label font-bold uppercase tracking-widest py-1.5 rounded-sm hover:bg-status-consultation hover:text-on-primary transition-colors text-center"
        >
          Entré ✓
        </button>
        <button
          onClick={() => onAction(ticket.id, { action: "absent" })}
          className="cursor-pointer text-on-surface-variant text-xs font-label font-bold uppercase tracking-widest hover:text-status-absent transition-colors px-2 py-1.5 whitespace-nowrap"
        >
          Absent
        </button>
      </div>
    </div>
  );
}

// ── Icônes ───────────────────────────────────────────────────────────────────

function PersonArrowIcon() {
  return (
    <svg viewBox="0 0 72 56" fill="currentColor" className="w-16 h-14" aria-hidden="true">
      {/* Head */}
      <circle cx="18" cy="10" r="8" />
      {/* Body */}
      <path d="M6 24 C6 17 30 17 30 24 L27 46 H9 Z" />
      {/* Arrow shaft */}
      <line x1="36" y1="28" x2="66" y2="28" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* Arrowhead */}
      <polyline points="56,20 66,28 56,36" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptySlot() {
  return (
    <div className="border border-outline-variant/30 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[120px] gap-1 bg-surface-container/20">
      <span className="text-2xl font-display text-on-surface-variant/20">—</span>
      <span className="text-[10px] font-label text-on-surface-variant/30 uppercase tracking-widest">Libre</span>
    </div>
  );
}
