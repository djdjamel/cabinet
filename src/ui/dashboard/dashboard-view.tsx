"use client";

import { useState, useEffect } from "react";
import { useDashboard, type TicketVue } from "./use-dashboard";
import { TicketCard } from "./ticket-card";
import { AbsentsSection } from "./absents-section";
import { NouveauPatientModal } from "./nouveau-patient-modal";
import { DayClosureModal } from "./day-closure-modal";
import { TicketDetailPanel } from "./ticket-detail-panel";
import { MetricsPanel } from "./metrics-panel";
import { useAnnonce } from "./use-annonce";

export function DashboardView() {
  const { state, status, action, creerTicket, cloturerJournee } = useDashboard();
  const { jouerAnnonce } = useAnnonce();

  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketVue | null>(null);
  const [staleDate, setStaleDate] = useState<string | null>(null);
  const [staleIgnored, setStaleIgnored] = useState(false);

  // Détection journée non clôturée
  useEffect(() => {
    fetch("/api/queue/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.staleTickets && !staleIgnored) setStaleDate(data.staleDate);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bandeau hors-ligne */}
      {status === "reconnecting" && (
        <div className="bg-yellow-400 text-yellow-900 text-sm text-center py-2 font-medium">
          ⚠️ Connexion perdue — Reconnexion en cours…
        </div>
      )}

      {/* Modale clôture journée */}
      {staleDate && !staleIgnored && (
        <DayClosureModal
          staleDate={staleDate}
          onCloturer={async () => {
            await cloturerJournee(staleDate);
            setStaleDate(null);
          }}
          onContinuer={() => {
            setStaleIgnored(true);
            setStaleDate(null);
          }}
        />
      )}

      {/* Modale nouveau patient */}
      {showNouveauModal && (
        <NouveauPatientModal
          onClose={() => setShowNouveauModal(false)}
          onCreer={creerTicket}
        />
      )}

      {/* Panneau détail ticket */}
      {selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAction={async (id, payload) => {
            await action(id, payload);
            setSelectedTicket(null);
          }}
        />
      )}

      {/* Layout principal */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* En-tête */}
        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-lg font-bold text-gray-800 capitalize">{today}</h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/settings"
              className="text-gray-400 hover:text-gray-600 text-xl px-2 py-1 rounded-lg hover:bg-gray-100 transition"
              title="Paramètres"
            >
              ⚙
            </a>
            <button
              onClick={() => setShowNouveauModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition"
            >
              + Nouveau patient
            </button>
          </div>
        </div>

        {/* Métriques (si activé dans les paramètres) */}
        {state.params.metriques && <MetricsPanel />}

        {/* EN CONSULTATION */}
        {state.en_cours && (
          <section>
            <SectionTitle
              title="EN CONSULTATION"
              color="text-green-700"
              bgColor="bg-green-50"
            />
            <div className="mt-2">
              <TicketCard
                ticket={state.en_cours}
                onAction={action}
                onSelect={setSelectedTicket}
                onAnnonce={state.params.annonce_vocale ? jouerAnnonce : undefined}
              />
            </div>
          </section>
        )}

        {/* FILE D'ATTENTE */}
        <section>
          <SectionTitle
            title="FILE D'ATTENTE"
            color="text-blue-700"
            bgColor="bg-blue-50"
            count={state.en_attente.length}
          />
          <div className="mt-2 space-y-2">
            {state.en_attente.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">
                File vide — en attente de patients
              </p>
            ) : (
              state.en_attente.map((t) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  onAction={action}
                  onSelect={setSelectedTicket}
                  onAnnonce={state.params.annonce_vocale ? jouerAnnonce : undefined}
                />
              ))
            )}
          </div>
        </section>

        {/* ABSENTS */}
        <AbsentsSection
          absents={state.absents}
          onAction={action}
          onSelect={setSelectedTicket}
        />
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  color,
  bgColor,
  count,
}: {
  title: string;
  color: string;
  bgColor: string;
  count?: number;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor}`}>
      <span className={`text-xs font-bold tracking-widest ${color}`}>{title}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs font-semibold text-gray-500">({count})</span>
      )}
    </div>
  );
}
