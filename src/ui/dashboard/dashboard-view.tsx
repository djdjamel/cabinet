"use client";

import { useState, useEffect } from "react";
import { useDashboard, type TicketVue } from "./use-dashboard";
import { TicketCard } from "./ticket-card";
import { AbsentsSection } from "./absents-section";
import { TamponSection } from "./tampon-section";
import { NouveauPatientModal } from "./nouveau-patient-modal";
import { DayClosureModal } from "./day-closure-modal";
import { TicketDetailPanel } from "./ticket-detail-panel";
import { MetricsPanel } from "./metrics-panel";
import { useAnnonce } from "./use-annonce";

const TYPE_CHIP: Record<string, string> = {
  normal:     "text-on-surface-variant/70 bg-surface-container",
  urgent:     "text-status-absent bg-status-absent/8",
  acte_court: "text-status-consultation bg-status-consultation/8",
};
const TYPE_LABEL: Record<string, string> = {
  normal: "Normal", urgent: "Urgent", acte_court: "Acte court",
};

function formatDuree(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

export function DashboardView() {
  const { state, status, action, creerTicket, cloturerJournee, moveTickets, suivant } = useDashboard();
  const { jouerAnnonce } = useAnnonce();

  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketVue | null>(null);
  const [staleDate, setStaleDate] = useState<string | null>(null);
  const [staleIgnored, setStaleIgnored] = useState(false);
  const [heure, setHeure] = useState(() =>
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setHeure(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    }, 10000);
    return () => clearInterval(id);
  }, []);

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

  const tamponPlein = state.tampon.length >= 2;
  const canSuivant = !!(state.en_cours || state.tampon.length > 0);

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

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="bg-[#0F1F3D] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-baseline gap-4">
            <p className="text-xl font-display font-bold text-white tracking-tight truncate leading-tight">
              {state.nom}
            </p>
            <p className="text-xs text-white/35 capitalize font-semibold hidden sm:block">
              {today} · {heure}
            </p>
          </div>
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
            <button
              onClick={suivant}
              disabled={!canSuivant}
              className="cursor-pointer bg-status-consultation text-white font-label font-bold text-sm uppercase tracking-[0.12em] px-6 py-2 rounded-sm hover:bg-status-consultation/90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Admettre le prochain patient (cascade)"
            >
              Suivant ▸
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenu — 2 colonnes ────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-8 py-8 flex flex-col lg:flex-row gap-8">

        {/* ── Colonne gauche : workflow principal ──────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-8">

          {/* SUR LE PONT (Tampon) */}
          <section aria-labelledby="tampon-heading">
            <SectionLabel
              id="tampon-heading"
              icon="🔔"
              text="Sur le Pont"
              count={state.tampon.length}
              color="text-status-waitlist"
              countColor="text-status-waitlist/80 bg-status-waitlist/10"
            />
            <TamponSection
              tampon={state.tampon}
              onAction={action}
              onSelect={setSelectedTicket}
              afficherNom={state.params.afficher_nom}
            />
          </section>

          {/* FILE D'ATTENTE */}
          <section aria-labelledby="queue-heading">
            <SectionLabel
              id="queue-heading"
              icon="⏳"
              text="File d'Attente"
              count={state.en_attente.length}
              color="text-primary"
              countColor="text-primary/80 bg-primary/10"
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
                    tamponPlein={tamponPlein}
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
            afficherNom={state.params.afficher_nom}
          />
        </div>

        {/* ── Sidebar droite ───────────────────────────────────────── */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">

          {/* EN CONSULTATION */}
          <section aria-labelledby="consultation-heading">
            <SectionLabel
              id="consultation-heading"
              icon="⚕"
              text="En Consultation"
              count={state.en_cours ? 1 : undefined}
              color="text-status-consultation"
              countColor="text-status-consultation/80 bg-status-consultation/10"
            />
            {state.en_cours ? (
              <ConsultationSidebarCard
                ticket={state.en_cours}
                onAction={action}
                onSelect={setSelectedTicket}
                afficherNom={state.params.afficher_nom}
              />
            ) : (
              <div className="border border-outline-variant/30 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[100px] gap-1 bg-surface-container/20">
                <span className="text-2xl font-display text-on-surface-variant/20">—</span>
                <span className="text-[10px] font-label text-on-surface-variant/30 uppercase tracking-widest">Libre</span>
              </div>
            )}
          </section>

          {/* MÉTRIQUES (bas de sidebar) */}
          {state.params.metriques && (
            <section aria-labelledby="metrics-heading">
              <SectionLabel
                id="metrics-heading"
                icon="📊"
                text="Métriques"
                color="text-on-surface-variant"
                countColor=""
              />
              <MetricsPanel />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Carte En Consultation (sidebar) ──────────────────────────────────────────

function ConsultationSidebarCard({
  ticket,
  onAction,
  onSelect,
  afficherNom,
}: {
  ticket: TicketVue;
  onAction: (id: string, payload: Record<string, unknown>) => void;
  onSelect: (ticket: TicketVue) => void;
  afficherNom: boolean;
}) {
  const duree = ticket.debut_consult_le
    ? Math.floor((Date.now() - new Date(ticket.debut_consult_le).getTime()) / 60000)
    : 0;
  const chip = TYPE_CHIP[ticket.type] ?? TYPE_CHIP.normal;
  const label = TYPE_LABEL[ticket.type] ?? TYPE_LABEL.normal;

  return (
    <div className="bg-status-consultation/5 border border-status-consultation/20 border-l-4 border-l-status-consultation rounded-lg px-4 py-4 space-y-3">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onSelect(ticket)}
          title="Voir le détail"
          className="text-5xl font-display font-bold tabular-nums text-status-consultation leading-none shrink-0 hover:opacity-70 cursor-pointer transition-opacity"
        >
          {ticket.numero}
        </button>
        <div className="flex-1 min-w-0 pt-0.5">
          {afficherNom && (
            <p className="text-sm font-headline font-bold text-on-surface italic truncate">
              {ticket.nom_prive ?? (
                <span className="not-italic font-normal text-on-surface-variant">Sans nom</span>
              )}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${chip}`}>
              {label}
            </span>
            <span className="text-xs text-on-surface-variant tabular-nums">{formatDuree(duree)}</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onAction(ticket.id, { action: "terminer" })}
        className="cursor-pointer w-full border border-status-consultation/40 text-status-consultation text-xs font-label font-bold uppercase tracking-widest py-2 rounded-sm hover:bg-status-consultation hover:text-on-primary transition-colors"
      >
        Terminer
      </button>
    </div>
  );
}

// ── Étiquette de section ──────────────────────────────────────────────────────

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
