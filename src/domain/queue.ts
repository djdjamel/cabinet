/**
 * domain/queue.ts — Règles pures de la file d'attente.
 * Aucune dépendance framework. Testable sans base de données.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketType = "normal" | "urgent" | "acte_court";

export type TicketEtat =
  | "en_attente"
  | "appele"
  | "en_consultation"
  | "termine"
  | "absent"
  | "expire"
  | "annule";

export interface Ticket {
  id: string;
  cabinet_id: string;
  date_file: Date;
  numero: number;
  type: TicketType;
  etat: TicketEtat;
  jeton_public: string;
  nom_prive: string | null;
  ordre: number;
  grace_expire_le: Date | null;
  nb_reintegrations: number;
  cree_le: Date;
  appele_le: Date | null;
  absent_le: Date | null;
  debut_consult_le: Date | null;
  fin_le: Date | null;
}

// ─── Isolation multi-tenant ───────────────────────────────────────────────────

/** Filtre une liste de tickets par cabinet_id. Règle de sécurité fondamentale. */
export function filterTicketsByCabinet<T extends { cabinet_id: string }>(
  tickets: T[],
  cabinetId: string
): T[] {
  return tickets.filter((t) => t.cabinet_id === cabinetId);
}

// ─── Position ────────────────────────────────────────────────────────────────

/** États considérés comme "actifs" dans la file (bloquent les tickets derrière). */
const ETATS_ACTIFS: TicketEtat[] = ["en_attente", "appele"];

/**
 * Calcule la position d'un ticket dans la file.
 * Position = nombre de tickets actifs avec un ordre inférieur.
 * Retourne 0 si c'est le prochain.
 */
export function calculerPosition(ticket: Ticket, tousLesTickets: Ticket[]): number {
  return tousLesTickets.filter(
    (t) =>
      ETATS_ACTIFS.includes(t.etat) &&
      t.ordre < ticket.ordre &&
      t.id !== ticket.id
  ).length;
}

// ─── Estimation du temps d'attente ───────────────────────────────────────────

const DUREE_ACTE_COURT_MIN = 3; // minutes

/**
 * Estime la durée d'attente en minutes pour un ticket.
 * Retourne une fourchette [min, max] arrondie à 5 min.
 */
export function estimerAttente(
  ticket: Ticket,
  tousLesTickets: Ticket[],
  dureeMoyenneConsultMin: number
): [number, number] {
  const ticketsDevant = tousLesTickets.filter(
    (t) => ETATS_ACTIFS.includes(t.etat) && t.ordre < ticket.ordre
  );

  const somme = ticketsDevant.reduce((acc, t) => {
    const duree =
      t.type === "acte_court" ? DUREE_ACTE_COURT_MIN : dureeMoyenneConsultMin;
    return acc + duree;
  }, 0);

  const min = arrondir5(somme * 0.8);
  const max = arrondir5(somme * 1.2);

  return [min, Math.max(max, min + 5)];
}

function arrondir5(n: number): number {
  return Math.round(n / 5) * 5;
}

// ─── Ordre d'insertion ────────────────────────────────────────────────────────

/**
 * Calcule l'ordre d'un nouveau ticket normal : à la fin de la file.
 * Retourne max_ordre + 1 (ou 1 si file vide).
 */
export function ordreNormal(tousLesTickets: Ticket[]): number {
  const actifs = tousLesTickets.filter(
    (t) => !["termine", "annule", "expire"].includes(t.etat)
  );
  if (actifs.length === 0) return 1;
  return Math.max(...actifs.map((t) => t.ordre)) + 1;
}

/**
 * Calcule l'ordre d'un ticket réintégré : après les N prochains patients actifs.
 * N = decalage (défaut 2).
 */
export function ordreReintegre(tousLesTickets: Ticket[], decalage: number = 2): number {
  const actifs = tousLesTickets
    .filter((t) => ETATS_ACTIFS.includes(t.etat))
    .sort((a, b) => a.ordre - b.ordre);

  if (actifs.length === 0) return 1;
  if (actifs.length <= decalage) {
    return actifs[actifs.length - 1].ordre + 1;
  }

  const apres = actifs[decalage - 1];
  const avant = actifs[decalage];
  return (apres.ordre + avant.ordre) / 2;
}

/**
 * Calcule l'ordre d'un ticket urgent : juste après le ticket en consultation.
 * Retourne null si aucun ticket actif n'est trouvé.
 */
export function ordreUrgent(tousLesTickets: Ticket[]): number | null {
  const enConsultation = tousLesTickets.find(
    (t) => t.etat === "en_consultation"
  );

  if (!enConsultation) {
    // Pas de consultation en cours : en tête de file
    const premier = tousLesTickets
      .filter((t) => ETATS_ACTIFS.includes(t.etat))
      .sort((a, b) => a.ordre - b.ordre)[0];
    return premier ? premier.ordre - 1 : 1;
  }

  // Juste après le ticket en cours
  const suivant = tousLesTickets
    .filter((t) => ETATS_ACTIFS.includes(t.etat) && t.ordre > enConsultation.ordre)
    .sort((a, b) => a.ordre - b.ordre)[0];

  if (!suivant) {
    return enConsultation.ordre + 1;
  }

  // Entre enConsultation.ordre et suivant.ordre
  return (enConsultation.ordre + suivant.ordre) / 2;
}
