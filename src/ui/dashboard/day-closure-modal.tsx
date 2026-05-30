"use client";

interface DayClosureModalProps {
  staleDate: string; // "2026-05-29"
  onCloturer: () => void;
  onContinuer: () => void;
}

export function DayClosureModal({ staleDate, onCloturer, onContinuer }: DayClosureModalProps) {
  const dateFormatee = new Date(staleDate + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border border-outline-variant/20">
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-display font-bold text-on-surface">Journée non clôturée</h2>
          <p className="text-sm text-on-surface-variant mt-2">
            Des tickets de la journée du <strong>{dateFormatee}</strong> sont encore actifs.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onCloturer}
            className="cursor-pointer w-full bg-primary hover:bg-primary/90 text-on-primary font-label font-bold text-xs uppercase tracking-widest py-2.5 rounded shadow-sm transition-all"
          >
            Clôturer et commencer aujourd'hui
          </button>
          <button
            onClick={onContinuer}
            className="cursor-pointer w-full border border-outline text-on-surface-variant font-label font-bold text-xs uppercase tracking-widest py-2.5 rounded hover:bg-surface-container-low transition-colors"
          >
            Continuer la journée précédente
          </button>
        </div>
      </div>
    </div>
  );
}
