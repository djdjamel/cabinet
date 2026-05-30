"use client";

import type { TicketVue } from "./use-dashboard";

interface TicketCardProps {
  ticket: TicketVue;
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onSelect: (ticket: TicketVue) => void;
  compact?: boolean;
  onAnnonce?: (numero: number) => void;
}

const TYPE_COLORS: Record<string, string> = {
  normal: "bg-blue-100 text-blue-800",
  urgent: "bg-red-100 text-red-800",
  acte_court: "bg-purple-100 text-purple-800",
};

const TYPE_LABELS: Record<string, string> = {
  normal: "Normal",
  urgent: "Urgent",
  acte_court: "Acte court",
};

export function TicketCard({ ticket, onAction, onSelect, compact, onAnnonce }: TicketCardProps) {
  const dureeDepuis = ticket.debut_consult_le
    ? Math.floor((Date.now() - new Date(ticket.debut_consult_le).getTime()) / 60000)
    : ticket.appele_le
    ? Math.floor((Date.now() - new Date(ticket.appele_le).getTime()) / 60000)
    : Math.floor((Date.now() - new Date(ticket.cree_le).getTime()) / 60000);

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition">
      {/* Numéro cliquable → panneau détail */}
      <button
        onClick={() => onSelect(ticket)}
        className="text-xl font-bold text-blue-600 hover:text-blue-800 w-10 text-left tabular-nums shrink-0"
      >
        {ticket.numero}
      </button>

      {/* Nom + type */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">
          {ticket.nom_prive ?? <span className="text-gray-400 italic">Sans nom</span>}
        </p>
        {!compact && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[ticket.type]}`}>
              {TYPE_LABELS[ticket.type]}
            </span>
            <span className="text-xs text-gray-400">
              {ticket.etat === "en_consultation"
                ? `depuis ${dureeDepuis} min`
                : `attend ${dureeDepuis} min`}
            </span>
          </div>
        )}
      </div>

      {/* Actions selon état */}
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
        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
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
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
        >
          Entré ✓
        </button>
        <button
          onClick={() => onAction(id, { action: "absent" })}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
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
        className="shrink-0 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
      >
        Terminer ✓
      </button>
    );
  }

  return null;
}
