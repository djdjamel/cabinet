"use client";

import type { TicketVue } from "./use-dashboard";

interface TicketCardProps {
  ticket: TicketVue;
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onSelect: (ticket: TicketVue) => void;
  compact?: boolean;
  isFeatured?: boolean;
  afficherNom?: boolean;
  onAnnonce?: (numero: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

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

export function TicketCard({
  ticket,
  onAction,
  onSelect,
  compact,
  isFeatured,
  afficherNom,
  onAnnonce,
  onMoveUp,
  onMoveDown,
}: TicketCardProps) {
  const cfg = TYPE_CONFIG[ticket.type] ?? TYPE_CONFIG.normal;
  const isAppele = ticket.etat === "appele";
  const isEnConsultation = ticket.etat === "en_consultation";
  const showReorder = (onMoveUp || onMoveDown) && ticket.etat === "en_attente";

  const dureeDepuis = ticket.debut_consult_le
    ? Math.floor((Date.now() - new Date(ticket.debut_consult_le).getTime()) / 60000)
    : ticket.appele_le
    ? Math.floor((Date.now() - new Date(ticket.appele_le).getTime()) / 60000)
    : Math.floor((Date.now() - new Date(ticket.cree_le).getTime()) / 60000);

  // ── Featured card (en_cours — appele or en_consultation) ─────────────────
  if (isFeatured) {
    const colorClasses = isEnConsultation
      ? "bg-status-consultation/5 border border-status-consultation/20 border-l-4 border-l-status-consultation"
      : "bg-status-waitlist/5 border border-status-waitlist/20 border-l-4 border-l-status-waitlist";
    const numColor = isEnConsultation ? "text-status-consultation" : "text-status-waitlist";

    return (
      <div className={`rounded-lg px-6 py-5 flex items-center gap-6 ${colorClasses}`}>
        <button
          onClick={() => onSelect(ticket)}
          title="Voir le détail"
          className={`text-6xl font-display font-bold tabular-nums leading-none shrink-0 w-20 text-center cursor-pointer hover:opacity-70 transition-opacity ${numColor}`}
        >
          {ticket.numero}
        </button>

        <div className="flex-1 min-w-0">
          {afficherNom && (
            <p className="text-xl font-headline font-bold text-on-surface italic leading-snug truncate mb-1.5">
              {ticket.nom_prive ?? <span className="not-italic font-normal text-on-surface-variant">Sans nom</span>}
            </p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-label font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${cfg.chip}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-on-surface-variant">
              {isEnConsultation ? "en consultation" : "appelé"} · {formatDuree(dureeDepuis)}
            </span>
          </div>
        </div>

        <Actions ticket={ticket} onAction={onAction} onAnnonce={onAnnonce} isAppele={isAppele} />
      </div>
    );
  }

  // ── Queue row — compact borderless ───────────────────────────────────────
  return (
    <div
      className={`queue-row group flex items-center gap-3 px-2 py-2 ${isAppele ? "bg-status-waitlist/5" : ""}`}
    >
      {/* Réordonnancement — invisible par défaut, visible au survol */}
      {showReorder && (
        <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMoveUp}
            disabled={!onMoveUp}
            title="Monter"
            className="cursor-pointer w-5 h-5 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-0 transition-colors text-xs"
          >
            ▲
          </button>
          <button
            onClick={onMoveDown}
            disabled={!onMoveDown}
            title="Descendre"
            className="cursor-pointer w-5 h-5 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-0 transition-colors text-xs"
          >
            ▼
          </button>
        </div>
      )}

      {/* Numéro */}
      <button
        onClick={() => onSelect(ticket)}
        title="Voir le détail"
        className={`
          text-3xl font-display font-bold tabular-nums leading-none shrink-0 w-12 text-center cursor-pointer transition-opacity hover:opacity-60
          ${isAppele ? "text-status-waitlist" : "text-on-surface-variant/25"}
        `}
      >
        {ticket.numero}
      </button>

      {/* Infos */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {!compact && (
          <>
            <span className={`text-xs font-label font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm shrink-0 ${cfg.chip}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-on-surface-variant/50 shrink-0">
              {formatDuree(dureeDepuis)}
            </span>
          </>
        )}
        {afficherNom && ticket.nom_prive && (
          <span className="text-xs text-on-surface/60 italic truncate">
            {ticket.nom_prive}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0">
        <Actions ticket={ticket} onAction={onAction} onAnnonce={onAnnonce} isAppele={isAppele} />
      </div>
    </div>
  );
}

function Actions({
  ticket,
  onAction,
  onAnnonce,
  isAppele,
}: {
  ticket: TicketVue;
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onAnnonce?: (numero: number) => void;
  isAppele: boolean;
}) {
  const { id } = ticket;

  if (ticket.etat === "en_consultation") {
    return (
      <button
        onClick={() => onAction(id, { action: "terminer" })}
        className="cursor-pointer shrink-0 border border-status-consultation/40 text-status-consultation text-xs font-label font-bold uppercase tracking-widest px-4 py-2 rounded-sm hover:bg-status-consultation hover:text-on-primary transition-colors"
      >
        Terminer
      </button>
    );
  }

  if (!isAppele) {
    return (
      <button
        onClick={() => {
          onAction(id, { action: "appeler" });
          onAnnonce?.(ticket.numero);
        }}
        className="cursor-pointer text-primary text-xs font-label font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm border border-primary/20 bg-primary/0 hover:bg-primary hover:text-on-primary opacity-0 group-hover:opacity-100 transition-all"
      >
        Appeler ▸
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onAction(id, { action: "demarrer" })}
        className="cursor-pointer border border-status-consultation/30 text-status-consultation text-xs font-label font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-status-consultation hover:text-on-primary transition-colors"
      >
        Entré ✓
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
