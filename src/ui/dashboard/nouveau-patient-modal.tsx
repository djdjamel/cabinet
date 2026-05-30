"use client";

import { useState, FormEvent } from "react";

interface NouveauPatientModalProps {
  onClose: () => void;
  onCreer: (type: string, nom?: string) => Promise<{ numero: number; jetonUrl: string; qr: string }>;
}

type TicketType = "normal" | "urgent" | "acte_court";

const TYPES: { value: TicketType; label: string; color: string }[] = [
  { value: "normal",     label: "Normal",     color: "bg-blue-600 text-white" },
  { value: "urgent",     label: "Urgent",     color: "bg-red-500 text-white" },
  { value: "acte_court", label: "Acte court", color: "bg-purple-600 text-white" },
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
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Numéro attribué</p>
          <p className="text-6xl font-bold text-blue-600 tabular-nums">{ticket.numero}</p>

          {/* QR en grand — le patient scanne depuis cet écran */}
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ticket.qr} alt="QR code patient" className="w-56 h-56" />
          </div>

          <p className="text-sm text-gray-600">
            Le patient scanne ce QR avec son téléphone.
          </p>

          <div className="flex gap-3 justify-center pt-2">
            <a
              href={`/print/${ticket.jetonUrl.split("/f/")[1]}`}
              target="_blank"
              rel="noreferrer"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              🖨️ Imprimer le ticket
            </a>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
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
      <h2 className="text-lg font-bold text-gray-800 mb-4">Nouveau patient</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition border-2 ${
                  type === t.value
                    ? t.color + " border-transparent"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoFocus
            placeholder="Prénom Nom"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
