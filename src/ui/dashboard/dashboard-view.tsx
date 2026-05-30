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
  const { state, status, action, creerTicket, cloturerJournee, moveTickets } = useDashboard();
  const { jouerAnnonce } = useAnnonce();

  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketVue | null>(null);
  const [staleDate, setStaleDate] = useState<string | null>(null);
  const [staleIgnored, setStaleIgnored] = useState(false);
  const [heure, setHeure] = useState(() =>
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );

  // Horloge temps réel
  useEffect(() => {
    const id = setInterval(() => {
      setHeure(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    }, 10000);
    return () => clearInterval(id);
  }, []);

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

  // Réordonnancement : échange les ordres de deux tickets adjacents
  function moveTicket(ticket: TicketVue, direction: "up" | "down") {
    if (!state) return;
    const list = state.en_attente;
    const idx = list.findIndex((t) => t.id === ticket.id);
    const neighbor = direction === "up" ? list[idx - 1] : list[idx + 1];
    if (!neighbor) return;
    moveTickets(ticket.id, neighbor.ordre, neighbor.id, ticket.ordre);
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Bandeau hors-ligne ───────────────────────────────────────── */}
      {status === "reconnecting" && (
        <div className="bg-amber-400 text-amber-900 text-sm text-center py-2 font-medium">
          Connexion perdue — Reconnexion en cours…
        </div>
      )}

      {/* ── Modales / panneau ────────────────────────────────────────── */}
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

      {showNouveauModal && (
        <NouveauPatientModal
          onClose={() => setShowNouveauModal(false)}
          onCreer={creerTicket}
        />
      )}

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

      {/* ── MD3 Top App Bar ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Nom du cabinet + date */}
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900 truncate leading-tight">
              {state.nom}
            </p>
            <p className="text-xs text-slate-400 capitalize leading-tight">
              {today} · {heure}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/settings"
              className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors text-lg"
              title="Paramètres"
            >
              ⚙
            </a>
            <button
              onClick={() => setShowNouveauModal(true)}
              className="cursor-pointer bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-medium px-5 py-2 rounded-full text-sm transition-colors"
            >
              + Nouveau patient
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenu principal ────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6">

        {/* Métriques (optionnelles) */}
        {state.params.metriques && <MetricsPanel />}

        {/* EN CONSULTATION */}
        {state.en_cours && (
          <section>
            <SectionLabel text="En consultation" count={1} dot="bg-green-500" />
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
          <SectionLabel text="File d'attente" count={state.en_attente.length} dot="bg-blue-500" />
          <div className="mt-2 space-y-2">
            {state.en_attente.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
                File vide — en attente de patients
              </div>
            ) : (
              state.en_attente.map((t, idx) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  onAction={action}
                  onSelect={setSelectedTicket}
                  onAnnonce={state.params.annonce_vocale ? jouerAnnonce : undefined}
                  onMoveUp={idx > 0 ? () => moveTicket(t, "up") : undefined}
                  onMoveDown={idx < state.en_attente.length - 1 ? () => moveTicket(t, "down") : undefined}
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
      </main>
    </div>
  );
}

function SectionLabel({ text, count, dot }: { text: string; count?: number; dot: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-xs font-semibold tracking-widest uppercase text-slate-500">
        {text}
      </span>
      {count !== undefined && (
        <span className="ml-auto text-xs font-medium text-slate-400">{count}</span>
      )}
    </div>
  );
}
