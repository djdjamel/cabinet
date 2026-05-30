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
    selected: "bg-blue-700 text-white ring-2 ring-blue-700",
    unselected: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
  },
  {
    value: "urgent",
    label: "Urgent",
    selected: "bg-red-600 text-white ring-2 ring-red-600",
    unselected: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
  },
  {
    value: "acte_court",
    label: "Acte court",
    selected: "bg-purple-700 text-white ring-2 ring-purple-700",
    unselected: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
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
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">
              Numéro attribué
            </p>
            <p className="text-7xl font-bold text-blue-700 tabular-nums leading-none">
              {ticket.numero}
            </p>
          </div>

          {/* QR en grand — le patient scanne depuis cet écran */}
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.qr}
              alt="QR code patient"
              className="w-52 h-52 rounded-2xl border border-slate-200 p-2"
            />
          </div>

          <p className="text-sm text-slate-500">
            Le patient scanne ce QR avec son téléphone pour suivre sa position.
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-1">
            <a
              href={`/print/${ticket.jetonUrl.split("/f/")[1]}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-full transition-colors"
            >
              🖨 Imprimer
            </a>
            <button
              onClick={onClose}
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors"
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
      <h2 className="text-lg font-semibold text-slate-900 mb-5">Nouveau patient</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Type de consultation
          </label>
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`cursor-pointer flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
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
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Nom{" "}
            <span className="text-slate-400 normal-case font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoFocus
            placeholder="Prénom Nom"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 rounded-full transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex-1 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-full transition-colors"
          >
            {loading ? "Création…" : "Créer le ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Wrapper modal MD3 (Dialog) ────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
