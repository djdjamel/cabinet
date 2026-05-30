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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-gray-800">Journée non clôturée</h2>
          <p className="text-sm text-gray-600 mt-2">
            Des tickets de la journée du <strong>{dateFormatee}</strong> sont encore actifs.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onCloturer}
            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition"
          >
            Clôturer et commencer aujourd'hui
          </button>
          <button
            onClick={onContinuer}
            className="cursor-pointer w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-xl transition"
          >
            Continuer la journée précédente
          </button>
        </div>
      </div>
    </div>
  );
}
