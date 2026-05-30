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
      <div className="min-h-screen flex items-center justify-center text-on-surface-variant text-sm bg-surface">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">

      {/* ── Bandeau hors-ligne ───────────────────────────────────────── */}
      {status === "reconnecting" && (
        <div className="bg-status-waitlist/15 text-status-waitlist text-sm text-center py-2 font-label font-bold tracking-wide border-b border-status-waitlist/20">
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

      {/* ── Top App Bar ──────────────────────────────────────────────── */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-primary/20 shadow-sm sticky top-0 z-50 transition-all duration-200">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          {/* Nom du cabinet + date */}
          <div className="min-w-0">
            <p className="text-2xl font-display font-bold text-primary tracking-tight truncate leading-tight">
              {state.nom}
            </p>
            <p className="text-xs font-body text-on-surface-variant capitalize leading-tight font-semibold mt-0.5">
              {today} · {heure}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/settings"
              className="cursor-pointer p-2 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors duration-200 text-lg"
              title="Paramètres"
            >
              ⚙
            </a>
            <button
              onClick={() => setShowNouveauModal(true)}
              className="cursor-pointer bg-primary hover:bg-primary/90 active:bg-primary/80 text-on-primary font-label font-bold text-xs uppercase tracking-widest px-6 py-2 rounded shadow-sm hover:shadow-md transition-all duration-200"
            >
              Nouveau patient
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenu principal ────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-8 py-8 flex flex-col gap-10">

        {/* Métriques (optionnelles) */}
        {state.params.metriques && (
          <section aria-labelledby="metrics-heading">
            <SectionLabel
              id="metrics-heading"
              icon="📊"
              text="Métriques du jour"
              color="text-primary"
              countColor=""
            />
            <MetricsPanel />
          </section>
        )}

        {/* EN CONSULTATION */}
        {state.en_cours && (
          <section aria-labelledby="consultation-heading">
            <SectionLabel
              id="consultation-heading"
              icon="⚕"
              text="En Consultation"
              count={1}
              color="text-status-consultation"
              countColor="text-status-consultation/80 bg-status-consultation/10"
            />
            <TicketCard
              ticket={state.en_cours}
              onAction={action}
              onSelect={setSelectedTicket}
              onAnnonce={state.params.annonce_vocale ? jouerAnnonce : undefined}
            />
          </section>
        )}

        {/* FILE D'ATTENTE */}
        <section aria-labelledby="queue-heading">
          <SectionLabel
            id="queue-heading"
            icon="⏳"
            text="File d'Attente"
            count={state.en_attente.length}
            color="text-status-waitlist"
            countColor="text-status-waitlist/80 bg-status-waitlist/10"
          />
          <div className="flex flex-col gap-2">
            {state.en_attente.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant text-sm bg-white rounded border border-outline-variant/40">
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

function SectionLabel({
  id,
  icon,
  text,
  count,
  color,
  countColor,
}: {
  id: string;
  icon: string;
  text: string;
  count?: number;
  color: string;
  countColor: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-surface-container-highest pb-2">
      <h2
        id={id}
        className={`text-xs font-label font-bold uppercase tracking-[0.15em] flex items-center gap-2 ${color}`}
      >
        <span aria-hidden="true">{icon}</span>
        {text}
      </h2>
      {count !== undefined && countColor && (
        <span className={`text-xs font-body font-semibold px-2.5 py-0.5 rounded-full ${countColor}`}>
          {count} patient{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
