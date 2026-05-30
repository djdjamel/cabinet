"use client";

import { useState, FormEvent } from "react";

interface NouveauPatientModalProps {
  onClose: () => void;
  onCreer: (type: string, nom?: string) => Promise<{ numero: number; jetonUrl: string; qr: string }>;
}

type TicketType = "normal" | "urgent" | "acte_court";

const TYPES: {
  value: TicketType;
  label: string;
  selected: string;
  unselected: string;
}[] = [
  {
    value: "normal",
    label: "Normal",
    selected: "bg-primary text-on-primary ring-2 ring-primary",
    unselected: "bg-surface text-on-surface ring-1 ring-outline-variant hover:bg-surface-container-low",
  },
  {
    value: "urgent",
    label: "Urgent",
    selected: "bg-error text-on-primary ring-2 ring-error",
    unselected: "bg-surface text-on-surface ring-1 ring-outline-variant hover:bg-surface-container-low",
  },
  {
    value: "acte_court",
    label: "Acte court",
    selected: "bg-status-consultation text-on-primary ring-2 ring-status-consultation",
    unselected: "bg-surface text-on-surface ring-1 ring-outline-variant hover:bg-surface-container-low",
  },
];

export function NouveauPatientModal({ onClose, onCreer }: NouveauPatientModalProps) {
  const [type, setType] = useState<TicketType>("normal");
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<{ numero: number; jetonUrl: string; qr: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await onCreer(type, nom.trim() || undefined);
    setTicket(result);
    setLoading(false);
  }

  // ── Phase 2 : affichage QR ────────────────────────────────────────────────
  if (ticket) {
    return (
      <Modal onClose={onClose}>
        <div className="text-center space-y-5">
          {/* Numéro héro */}
          <div>
            <p className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-2">
              Numéro attribué
            </p>
            <p className="text-7xl font-display font-bold text-primary tabular-nums leading-none">
              {ticket.numero}
            </p>
          </div>

          {/* QR en grand — le patient scanne depuis cet écran */}
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.qr}
              alt="QR code patient"
              className="w-52 h-52 rounded-lg border border-outline-variant p-2"
            />
          </div>

          <p className="text-sm text-on-surface-variant">
            Le patient scanne ce QR avec son téléphone pour suivre sa position.
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-1">
            <a
              href={`/print/${ticket.jetonUrl.split("/f/")[1]}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 border border-outline text-on-surface-variant text-xs font-label font-bold uppercase tracking-widest px-4 py-2.5 rounded hover:bg-surface-container-low transition-colors"
            >
              🖨 Imprimer
            </a>
            <button
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 text-on-primary text-xs font-label font-bold uppercase tracking-widest px-6 py-2.5 rounded shadow-sm transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Phase 1 : formulaire ─────────────────────────────────────────────────
  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-display font-bold text-on-surface mb-5">Nouveau patient</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type */}
        <div>
          <label className="block text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">
            Type de consultation
          </label>
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`cursor-pointer flex-1 py-2 rounded text-xs font-label font-bold uppercase tracking-widest transition-all ${
                  type === t.value ? t.selected : t.unselected
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nom */}
        <div>
          <label className="block text-xs font-label font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">
            Nom{" "}
            <span className="text-on-surface-variant/60 normal-case font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoFocus
            placeholder="Prénom Nom"
            className="w-full border border-outline-variant rounded px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex-1 border border-outline text-on-surface-variant text-xs font-label font-bold uppercase tracking-widest py-2.5 rounded hover:bg-surface-container-low transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex-1 bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 text-on-primary text-xs font-label font-bold uppercase tracking-widest py-2.5 rounded shadow-sm transition-all"
          >
            {loading ? "Création…" : "Créer le ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Wrapper modal ─────────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
