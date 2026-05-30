"use client";

import { useState } from "react";
import type { TicketVue } from "./use-dashboard";

interface TicketDetailPanelProps {
  ticket: TicketVue;
  onClose: () => void;
  onAction: (id: string, payload: Record<string, unknown>) => void;
}

const ETAT_CONFIG: Record<string, { label: string; color: string }> = {
  en_attente:      { label: "En attente",       color: "text-blue-700 bg-blue-50" },
  appele:          { label: "Appelé",            color: "text-amber-700 bg-amber-50" },
  en_consultation: { label: "En consultation",   color: "text-green-700 bg-green-50" },
  termine:         { label: "Terminé",           color: "text-slate-600 bg-slate-100" },
  absent:          { label: "Absent",            color: "text-orange-700 bg-orange-50" },
  expire:          { label: "Expiré",            color: "text-red-700 bg-red-50" },
  annule:          { label: "Annulé",            color: "text-slate-500 bg-slate-50" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  normal:     { label: "Normal",     color: "text-blue-700 bg-blue-100" },
  urgent:     { label: "Urgent",     color: "text-red-700 bg-red-100" },
  acte_court: { label: "Acte court", color: "text-purple-700 bg-purple-100" },
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
  const etatCfg = ETAT_CONFIG[ticket.etat] ?? { label: ticket.etat, color: "text-slate-600 bg-slate-100" };
  const typeCfg = TYPE_CONFIG[ticket.type] ?? TYPE_CONFIG.normal;

  return (
    // Backdrop — clic en dehors ferme le volet
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-xs h-full shadow-2xl flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── En-tête MD3 (Top App Bar style) ─────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Numéro héro */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold tabular-nums ${typeCfg.color}`}>
              {ticket.numero}
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Ticket</p>
              <p className="font-semibold text-slate-900">{ticket.nom_prive ?? "Sans nom"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">

          {/* ── État + Type (chips MD3) ──────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${etatCfg.color}`}>
              {etatCfg.label}
            </span>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${typeCfg.color}`}>
              {typeCfg.label}
            </span>
          </div>

          {/* ── Nom éditable ─────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Nom du patient
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveNom()}
                placeholder="Optionnel"
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={saveNom}
                disabled={saving}
                className="cursor-pointer bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors"
              >
                {saving ? "…" : "OK"}
              </button>
            </div>
          </div>

          {/* ── Horodatages ──────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Horodatages
            </p>
            <div className="space-y-2.5">
              <TimeRow label="Arrivée"      value={fmt(ticket.cree_le)} />
              <TimeRow label="Appelé"       value={fmt(ticket.appele_le)} />
              <TimeRow label="Consultation" value={fmt(ticket.debut_consult_le)} />
            </div>
          </div>

          {/* ── QR code patient ──────────────────────────────────────── */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              QR patient
            </p>
            {/* L'image est servie par /api/public/qr-image/[jeton] */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/public/qr-image/${ticket.jeton_public}`}
              alt={`QR code ticket N°${ticket.numero}`}
              width={144}
              height={144}
              className="w-36 h-36 mx-auto rounded-xl border border-slate-200 p-1"
            />
            <a
              href={`/print/${ticket.jeton_public}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-center text-xs text-blue-700 hover:text-blue-900 hover:underline transition-colors"
            >
              Imprimer le ticket →
            </a>
          </div>
        </div>

        {/* ── Action annuler ───────────────────────────────────────── */}
        {canCancel && (
          <div className="px-6 pb-6 border-t border-slate-100 pt-4">
            <button
              onClick={async () => {
                await onAction(ticket.id, { action: "annuler" });
                onClose();
              }}
              className="cursor-pointer w-full border border-red-200 hover:bg-red-50 active:bg-red-100 text-red-600 text-sm font-medium py-2.5 rounded-full transition-colors"
            >
              Annuler ce ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}
