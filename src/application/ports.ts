/**
 * application/ports.ts — Interfaces que les use-cases utilisent.
 * Les implémentations concrètes sont dans infrastructure/.
 */

import type { Ticket, TicketEtat, TicketType } from "@domain/queue";

// ─── Ticket Repository ────────────────────────────────────────────────────────

export interface CreateTicketInput {
  cabinet_id: string;
  date_file: Date;
  numero: number;
  type: TicketType;
  jeton_public: string;
  nom_prive: string | null;
  ordre: number;
  cree_le: Date;
}

export interface UpdateTicketInput {
  etat?: TicketEtat;
  nom_prive?: string | null;
  ordre?: number;
  grace_expire_le?: Date | null;
  nb_reintegrations?: number;
  appele_le?: Date | null;
  absent_le?: Date | null;
  debut_consult_le?: Date | null;
  fin_le?: Date | null;
}

export interface TicketRepository {
  /** Récupère un ticket par id, vérifie l'appartenance au cabinet. */
  findById(id: string, cabinetId: string): Promise<Ticket | null>;

  /** Récupère un ticket par son jeton public (sans auth, pour la page patient). */
  findByJeton(jeton: string): Promise<Ticket | null>;

  /** Tous les tickets actifs d'un cabinet pour une date donnée. */
  findTodayByCabinet(cabinetId: string, date: Date): Promise<Ticket[]>;

  /** Prochain numéro de séquence pour ce cabinet/date (en transaction). */
  getNextNumero(cabinetId: string, date: Date): Promise<number>;

  /** Crée un ticket. */
  create(input: CreateTicketInput): Promise<Ticket>;

  /** Met à jour un ticket. */
  update(id: string, cabinetId: string, changes: UpdateTicketInput): Promise<Ticket>;

  /** Tickets absents dont le délai de grâce est expiré. */
  findAbsentsExpires(now: Date): Promise<Ticket[]>;

  /** Tickets actifs (non terminés) de jours précédents — détection de clôture manquée. */
  findStaleTickets(cabinetId: string, today: Date): Promise<Ticket[]>;

  /** Clôture (annule) tous les tickets non terminés d'une date donnée. */
  closeDay(cabinetId: string, date: Date, now: Date): Promise<number>;
}

// ─── Clock ────────────────────────────────────────────────────────────────────

export interface Clock {
  now(): Date;
}

// ─── Token Generator ─────────────────────────────────────────────────────────

export interface TokenGenerator {
  /** Génère un jeton aléatoire (base62, 128 bits). */
  generate(): string;
}
