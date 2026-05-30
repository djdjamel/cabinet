"use client";

import { useState } from "react";
import type { TicketVue } from "./use-dashboard";

interface TicketDetailPanelProps {
  ticket: TicketVue;
  onClose: () => void;
  onAction: (id: string, payload: Record<string, unknown>) => void;
}

const ETAT_LABELS: Record<string, string> = {
  en_attente: "En attente",
  appele: "Appelé",
  en_consultation: "En consultation",
  termine: "Terminé",
  absent: "Absent",
  expire: "Expiré",
  annule: "Annulé",
};

export function TicketDetailPanel({ ticket, onClose, onAction }: TicketDetailPanelProps) {
  const [nom, setNom] = useState(ticket.nom_prive ?? "");
  const [saving, setSaving] = useState(false);

  async function saveNom() {
    setSaving(true);
    await onAction(ticket.id, { nom: nom.trim() || null });
    setSaving(false);
  }

  function fmt(date: Date | string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  const canCancel = ["en_attente", "appele"].includes(ticket.etat);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-xs h-full shadow-2xl p-6 overflow-y-auto flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-blue-600 tabular-nums">N° {ticket.numero}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* État */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">État</p>
          <p className="font-medium text-gray-800">{ETAT_LABELS[ticket.etat] ?? ticket.etat}</p>
        </div>

        {/* Nom éditable */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Nom</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveNom()}
              placeholder="Optionnel"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={saveNom}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
            >
              {saving ? "…" : "OK"}
            </button>
          </div>
        </div>

        {/* Horodatages */}
        <div className="space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Horodatages</p>
          <Row label="Arrivée" value={fmt(ticket.cree_le)} />
          <Row label="Appelé" value={fmt(ticket.appele_le)} />
          <Row label="Consultation" value={fmt(ticket.debut_consult_le)} />
        </div>

        {/* Actions */}
        {canCancel && (
          <div className="mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={async () => {
                await onAction(ticket.id, { action: "annuler" });
                onClose();
              }}
              className="w-full border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium py-2 rounded-xl transition"
            >
              Annuler ce ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium tabular-nums">{value}</span>
    </div>
  );
}
