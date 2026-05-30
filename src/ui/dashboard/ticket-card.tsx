"use client";

import type { TicketVue } from "./use-dashboard";

interface TicketCardProps {
  ticket: TicketVue;
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onSelect: (ticket: TicketVue) => void;
  compact?: boolean;
  onAnnonce?: (numero: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; chip: string }> = {
  normal:     { label: "Normal",     chip: "text-on-surface-variant bg-surface-container-high" },
  urgent:     { label: "Urgent",     chip: "text-error bg-error/10" },
  acte_court: { label: "Acte court", chip: "text-status-consultation bg-status-consultation/5" },
};

export function TicketCard({ ticket, onAction, onSelect, compact, onAnnonce, onMoveUp, onMoveDown }: TicketCardProps) {
  const cfg = TYPE_CONFIG[ticket.type] ?? TYPE_CONFIG.normal;
  const isEnConsultation = ticket.etat === "en_consultation";
  const showReorder = (onMoveUp || onMoveDown) && ticket.etat === "en_attente";

  const dureeDepuis = ticket.debut_consult_le
    ? Math.floor((Date.now() - new Date(ticket.debut_consult_le).getTime()) / 60000)
    : ticket.appele_le
    ? Math.floor((Date.now() - new Date(ticket.appele_le).getTime()) / 60000)
    : Math.floor((Date.now() - new Date(ticket.cree_le).getTime()) / 60000);

  return (
    <div
      className={`
        patient-card px-5 py-3 flex flex-row items-center justify-between gap-4
        ${isEnConsultation
          ? "border-l-4 border-l-status-consultation"
          : "group border-l-4 border-l-status-waitlist/50 hover:border-l-status-waitlist"}
      `}
    >
      {/* ── Boutons réordonnancement ─────────────────────────────── */}
      {showReorder && (
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={!onMoveUp}
            title="Monter dans la file"
            className="cursor-pointer w-5 h-5 flex items-center justify-center rounded text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container disabled:opacity-20 disabled:cursor-default transition-colors text-xs"
          >
            ▲
          </button>
          <button
            onClick={onMoveDown}
            disabled={!onMoveDown}
            title="Descendre dans la file"
            className="cursor-pointer w-5 h-5 flex items-center justify-center rounded text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container disabled:opacity-20 disabled:cursor-default transition-colors text-xs"
          >
            ▼
          </button>
        </div>
      )}

      {/* ── Numéro ──────────────────────────────────────────────── */}
      <button
        onClick={() => onSelect(ticket)}
        title="Voir le détail du ticket"
        className={`
          text-2xl font-display font-bold tabular-nums w-8 text-center shrink-0 cursor-pointer transition-colors
          ${isEnConsultation
            ? "text-status-consultation/40 hover:text-status-consultation"
            : "text-status-waitlist/40 hover:text-status-waitlist"}
        `}
      >
        {ticket.numero}
      </button>

      {/* ── Informations ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-grow min-w-0">
        <span className="text-lg font-headline font-bold text-on-surface italic whitespace-nowrap min-w-[100px] truncate">
          {ticket.nom_prive ?? (
            <span className="not-italic font-normal text-on-surface-variant">Sans nom</span>
          )}
        </span>
        {!compact && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-label uppercase font-bold tracking-widest px-2 py-0.5 rounded whitespace-nowrap ${cfg.chip}`}>
              {cfg.label}
            </span>
            <span className="text-on-surface-variant text-sm">·</span>
            <span className="text-xs text-on-surface-variant whitespace-nowrap">
              {isEnConsultation
                ? `en consultation · ${dureeDepuis} min`
                : `attend depuis ${dureeDepuis} min`}
            </span>
          </div>
        )}
      </div>

      {/* ── Actions ────────────────────────────────────────────────── */}
      <Actions ticket={ticket} onAction={onAction} onAnnonce={onAnnonce} />
    </div>
  );
}

function Actions({
  ticket,
  onAction,
  onAnnonce,
}: {
  ticket: TicketVue;
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onAnnonce?: (numero: number) => void;
}) {
  const { id, etat } = ticket;

  if (etat === "en_attente") {
    return (
      <button
        onClick={() => {
          onAction(id, { action: "appeler" });
          onAnnonce?.(ticket.numero);
        }}
        className="cursor-pointer shrink-0 text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded text-xs font-label font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5"
      >
        Appeler ▸
      </button>
    );
  }

  if (etat === "appele") {
    return (
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onAction(id, { action: "demarrer" })}
          className="cursor-pointer bg-surface border border-status-consultation/30 text-status-consultation text-xs font-label font-bold uppercase tracking-widest px-3 py-1.5 rounded hover:bg-status-consultation hover:text-on-primary transition-colors"
        >
          Marquer Entré
        </button>
        <button
          onClick={() => onAction(id, { action: "absent" })}
          className="cursor-pointer text-on-surface-variant text-xs font-label font-bold uppercase tracking-widest hover:text-status-absent transition-colors px-2 py-1.5"
        >
          Absent
        </button>
      </div>
    );
  }

  if (etat === "en_consultation") {
    return (
      <button
        onClick={() => onAction(id, { action: "terminer" })}
        className="cursor-pointer shrink-0 bg-surface border border-on-surface/20 text-on-surface text-xs font-label font-bold uppercase tracking-widest px-4 py-1.5 rounded hover:bg-on-surface hover:text-surface transition-colors"
      >
        Terminer ✓
      </button>
    );
  }

  return null;
}
