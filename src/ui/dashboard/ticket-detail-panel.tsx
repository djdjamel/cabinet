"use client";

import { useState } from "react";
import type { TicketVue } from "./use-dashboard";

interface TicketDetailPanelProps {
  ticket: TicketVue;
  onClose: () => void;
  onAction: (id: string, payload: Record<string, unknown>) => void;
}

const ETAT_CONFIG: Record<string, { label: string; color: string }> = {
  en_attente:      { label: "En attente",       color: "text-status-waitlist bg-status-waitlist/10" },
  appele:          { label: "Appelé",            color: "text-status-waitlist bg-status-waitlist/10" },
  en_consultation: { label: "En consultation",   color: "text-status-consultation bg-status-consultation/10" },
  termine:         { label: "Terminé",           color: "text-on-surface-variant bg-surface-container" },
  absent:          { label: "Absent",            color: "text-status-absent bg-status-absent/10" },
  expire:          { label: "Expiré",            color: "text-error bg-error/10" },
  annule:          { label: "Annulé",            color: "text-on-surface-variant bg-surface-container" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  normal:     { label: "Normal",     color: "text-on-surface-variant bg-surface-container-high" },
  urgent:     { label: "Urgent",     color: "text-error bg-error/10" },
  acte_court: { label: "Acte court", color: "text-status-consultation bg-status-consultation/10" },
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
  const etatCfg = ETAT_CONFIG[ticket.etat] ?? { label: ticket.etat, color: "text-on-surface-variant bg-surface-container" };
  const typeCfg = TYPE_CONFIG[ticket.type] ?? TYPE_CONFIG.normal;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col overflow-y-auto border-l border-outline-variant/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── En-tête ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            {/* Numéro */}
            <span className={`text-3xl font-display font-bold tabular-nums ${typeCfg.color.split(" ")[0]}`}>
              {ticket.numero}
            </span>
            <div>
              <p className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em]">Ticket</p>
              <p className="font-headline font-bold text-on-surface italic">{ticket.nom_prive ?? "Sans nom"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">

          {/* ── État + Type ──────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-label font-bold uppercase tracking-widest px-3 py-1 rounded ${etatCfg.color}`}>
              {etatCfg.label}
            </span>
            <span className={`text-xs font-label font-bold uppercase tracking-widest px-3 py-1 rounded ${typeCfg.color}`}>
              {typeCfg.label}
            </span>
          </div>

          {/* ── Nom éditable ─────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">
              Nom du patient
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveNom()}
                placeholder="Optionnel"
                className="flex-1 border border-outline-variant rounded px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                onClick={saveNom}
                disabled={saving}
                className="cursor-pointer bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary text-xs font-label font-bold uppercase tracking-widest px-3 py-2 rounded transition-all"
              >
                {saving ? "…" : "OK"}
              </button>
            </div>
          </div>

          {/* ── Horodatages ──────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-3">
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
            <p className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-3">
              QR patient
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/public/qr-image/${ticket.jeton_public}`}
              alt={`QR code ticket N°${ticket.numero}`}
              width={144}
              height={144}
              className="w-36 h-36 mx-auto rounded-lg border border-outline-variant p-1"
            />
            <a
              href={`/print/${ticket.jeton_public}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-center text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              Imprimer le ticket →
            </a>
          </div>
        </div>

        {/* ── Action annuler ───────────────────────────────────────── */}
        {canCancel && (
          <div className="px-6 pb-6 border-t border-outline-variant/30 pt-4">
            <button
              onClick={async () => {
                await onAction(ticket.id, { action: "annuler" });
                onClose();
              }}
              className="cursor-pointer w-full border border-status-absent/30 hover:bg-status-absent/5 active:bg-status-absent/10 text-status-absent text-xs font-label font-bold uppercase tracking-widest py-2.5 rounded transition-colors"
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
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface tabular-nums">{value}</span>
    </div>
  );
}
