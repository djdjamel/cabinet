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

// MD3 container colors par type
const TYPE_CONFIG: Record<string, { label: string; badge: string; badgeHover: string; chip: string }> = {
  normal:     { label: "Normal",     badge: "bg-blue-100 text-blue-800",     badgeHover: "hover:bg-blue-200",   chip: "bg-blue-100 text-blue-700" },
  urgent:     { label: "Urgent",     badge: "bg-red-100 text-red-800",       badgeHover: "hover:bg-red-200",    chip: "bg-red-100 text-red-700" },
  acte_court: { label: "Acte court", badge: "bg-purple-100 text-purple-800", badgeHover: "hover:bg-purple-200", chip: "bg-purple-100 text-purple-700" },
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
        flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-150
        ${isEnConsultation
          ? "bg-green-50 border-green-200 shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"}
      `}
    >
      {/* ── Boutons réordonnancement ─────────────────────────────── */}
      {showReorder && (
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={!onMoveUp}
            title="Monter dans la file"
            className="cursor-pointer w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-default transition-colors text-xs"
          >
            ▲
          </button>
          <button
            onClick={onMoveDown}
            disabled={!onMoveDown}
            title="Descendre dans la file"
            className="cursor-pointer w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-default transition-colors text-xs"
          >
            ▼
          </button>
        </div>
      )}

      {/* ── Numéro héro ─────────────────────────────────────────── */}
      <button
        onClick={() => onSelect(ticket)}
        title="Voir le détail du ticket"
        className={`
          shrink-0 w-14 h-14 rounded-xl
          flex items-center justify-center
          text-2xl font-bold tabular-nums
          cursor-pointer select-none
          ring-2 ring-transparent
          transition-all duration-150
          active:scale-95
          ${cfg.badge} ${cfg.badgeHover}
        `}
      >
        {ticket.numero}
      </button>

      {/* ── Informations ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate leading-snug">
          {ticket.nom_prive ?? (
            <span className="text-slate-400 italic font-normal">Sans nom</span>
          )}
        </p>
        {!compact && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.chip}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-slate-400">
              {isEnConsultation
                ? `en consultation · ${dureeDepuis} min`
                : `attend · ${dureeDepuis} min`}
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
        className="cursor-pointer shrink-0 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
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
          className="cursor-pointer bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-800 text-sm font-medium px-4 py-2 rounded-full transition-colors"
        >
          Entré ✓
        </button>
        <button
          onClick={() => onAction(id, { action: "absent" })}
          className="cursor-pointer bg-orange-100 hover:bg-orange-200 active:bg-orange-300 text-orange-800 text-sm font-medium px-4 py-2 rounded-full transition-colors"
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
        className="cursor-pointer shrink-0 bg-slate-800 hover:bg-slate-900 active:bg-black text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
      >
        Terminer ✓
      </button>
    );
  }

  return null;
}
