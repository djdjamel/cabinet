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

      {/* ── Header — dark navy ──────────────────────────────────────── */}
      <header className="bg-[#0F1F3D] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          {/* Nom du cabinet + date */}
          <div className="min-w-0 flex items-baseline gap-4">
            <p className="text-xl font-display font-bold text-white tracking-tight truncate leading-tight">
              {state.nom}
            </p>
            <p className="text-xs text-white/35 capitalize font-semibold hidden sm:block">
              {today} · {heure}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/settings"
              className="cursor-pointer p-2 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors text-lg"
              title="Paramètres"
            >
              ⚙
            </a>
            <button
              onClick={() => setShowNouveauModal(true)}
              className="cursor-pointer border border-white/25 text-white hover:bg-white hover:text-[#0F1F3D] font-label font-bold text-xs uppercase tracking-[0.15em] px-5 py-2 rounded-sm transition-all"
            >
              + Nouveau patient
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenu principal — 2 colonnes ──────────────────────────── */}
      <main className="max-w-6xl mx-auto px-8 py-8 flex flex-col lg:flex-row gap-8">

        {/* ── Colonne gauche : workflow principal ──────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-8">

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
                isFeatured
                afficherNom={state.params.afficher_nom}
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
            <div className="flex flex-col gap-1 max-h-[55vh] overflow-y-auto pr-1">
              {state.en_attente.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant/50 text-sm">
                  File vide — en attente de patients
                </div>
              ) : (
                state.en_attente.map((t, idx) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    afficherNom={state.params.afficher_nom}
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
        </div>

        {/* ── Sidebar droite : infos secondaires ──────────────────── */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">

          {/* MÉTRIQUES */}
          {state.params.metriques && (
            <section aria-labelledby="metrics-heading">
              <SectionLabel
                id="metrics-heading"
                icon="📊"
                text="Métriques"
                color="text-primary"
                countColor=""
              />
              <MetricsPanel />
            </section>
          )}

          {/* ABSENTS */}
          <AbsentsSection
            absents={state.absents}
            onAction={action}
            onSelect={setSelectedTicket}
            compact
            afficherNom={state.params.afficher_nom}
          />
        </div>
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
