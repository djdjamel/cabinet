import { db } from "./db";
import type {
  CreateTicketInput,
  TicketRepository,
  UpdateTicketInput,
} from "@application/ports";
import type { Ticket, TicketEtat, TicketType } from "@domain/queue";
import type { Ticket as PrismaTicket } from "./client/client";

// Convertit un enregistrement Prisma en type domaine Ticket
function toDomain(p: PrismaTicket): Ticket {
  return {
    id: p.id,
    cabinet_id: p.cabinet_id,
    date_file: p.date_file,
    numero: p.numero,
    type: p.type as TicketType,
    etat: p.etat as TicketEtat,
    jeton_public: p.jeton_public,
    nom_prive: p.nom_prive,
    ordre: Number(p.ordre),
    grace_expire_le: p.grace_expire_le,
    nb_reintegrations: p.nb_reintegrations,
    cree_le: p.cree_le,
    appele_le: p.appele_le,
    absent_le: p.absent_le,
    debut_consult_le: p.debut_consult_le,
    fin_le: p.fin_le,
  };
}

export const prismaTicketRepository: TicketRepository = {
  async findById(id, cabinetId) {
    const t = await db.ticket.findFirst({
      where: { id, cabinet_id: cabinetId },
    });
    return t ? toDomain(t) : null;
  },

  async findByJeton(jeton) {
    const t = await db.ticket.findUnique({
      where: { jeton_public: jeton },
    });
    return t ? toDomain(t) : null;
  },

  async findTodayByCabinet(cabinetId, date) {
    const tickets = await db.ticket.findMany({
      where: { cabinet_id: cabinetId, date_file: date },
      orderBy: { ordre: "asc" },
    });
    return tickets.map(toDomain);
  },

  async getNextNumero(cabinetId, date) {
    // La contrainte UNIQUE (cabinet_id, date_file, numero) protège contre les doublons
    const max = await db.ticket.aggregate({
      where: { cabinet_id: cabinetId, date_file: date },
      _max: { numero: true },
    });
    return (max._max.numero ?? 0) + 1;
  },

  async create(input: CreateTicketInput) {
    const t = await db.ticket.create({
      data: {
        cabinet_id: input.cabinet_id,
        date_file: input.date_file,
        numero: input.numero,
        type: input.type,
        etat: "en_attente",
        jeton_public: input.jeton_public,
        nom_prive: input.nom_prive,
        ordre: input.ordre,
        cree_le: input.cree_le,
      },
    });
    return toDomain(t);
  },

  async update(id, cabinetId, changes: UpdateTicketInput) {
    const t = await db.ticket.update({
      where: { id },
      data: {
        ...(changes.etat !== undefined && { etat: changes.etat }),
        ...(changes.nom_prive !== undefined && { nom_prive: changes.nom_prive }),
        ...(changes.ordre !== undefined && { ordre: changes.ordre }),
        ...(changes.grace_expire_le !== undefined && { grace_expire_le: changes.grace_expire_le }),
        ...(changes.nb_reintegrations !== undefined && { nb_reintegrations: changes.nb_reintegrations }),
        ...(changes.appele_le !== undefined && { appele_le: changes.appele_le }),
        ...(changes.absent_le !== undefined && { absent_le: changes.absent_le }),
        ...(changes.debut_consult_le !== undefined && { debut_consult_le: changes.debut_consult_le }),
        ...(changes.fin_le !== undefined && { fin_le: changes.fin_le }),
      },
    });
    return toDomain(t);
  },

  async findAbsentsExpires(now) {
    const tickets = await db.ticket.findMany({
      where: {
        etat: "absent",
        grace_expire_le: { lte: now },
      },
    });
    return tickets.map(toDomain);
  },

  async findStaleTickets(cabinetId, today) {
    const tickets = await db.ticket.findMany({
      where: {
        cabinet_id: cabinetId,
        date_file: { lt: today },
        etat: { in: ["en_attente", "appele", "en_consultation", "absent"] },
      },
      orderBy: { date_file: "desc" },
    });
    return tickets.map(toDomain);
  },

  async closeDay(cabinetId, date, now) {
    const result = await db.ticket.updateMany({
      where: {
        cabinet_id: cabinetId,
        date_file: date,
        etat: { in: ["en_attente", "appele", "en_consultation", "absent"] },
      },
      data: { etat: "annule", fin_le: now },
    });
    return result.count;
  },
};

// ─── Rétention ───────────────────────────────────────────────────────────────

/**
 * Supprime tous les tickets dont la date_file est antérieure à `retentionDays` jours.
 * Retourne le nombre de tickets supprimés.
 */
export async function purgeOldTickets(retentionDays: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  cutoff.setHours(0, 0, 0, 0);

  const result = await db.ticket.deleteMany({
    where: { date_file: { lt: cutoff } },
  });

  return result.count;
}

// ─── Métriques ────────────────────────────────────────────────────────────────

export interface MetricsToday {
  total: number;
  termines: number;
  en_cours: number;
  en_attente: number;
  absents: number;
  expires: number;
  annules: number;
  duree_moy_min: number | null;
}

export async function getMetricsToday(
  cabinetId: string,
  today: Date
): Promise<MetricsToday> {
  const tickets = await db.ticket.findMany({
    where: { cabinet_id: cabinetId, date_file: today },
    select: { etat: true, debut_consult_le: true, fin_le: true },
  });

  type Row = typeof tickets[number];
  const count = (etat: string) => tickets.filter((t: Row) => t.etat === etat).length;

  const durees = tickets
    .filter((t: Row) => t.etat === "termine" && t.debut_consult_le && t.fin_le)
    .map((t: Row) => (t.fin_le!.getTime() - t.debut_consult_le!.getTime()) / 60_000);

  const duree_moy_min =
    durees.length > 0
      ? Math.round(durees.reduce((a: number, b: number) => a + b, 0) / durees.length)
      : null;

  return {
    total:      tickets.length,
    termines:   count("termine"),
    en_cours:   count("appele") + count("en_consultation"),
    en_attente: count("en_attente"),
    absents:    count("absent"),
    expires:    count("expire"),
    annules:    count("annule"),
    duree_moy_min,
  };
}
