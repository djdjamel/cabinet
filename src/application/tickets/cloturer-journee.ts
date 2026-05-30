import type { Clock, TicketRepository } from "@application/ports";

export interface CloturerJourneeResult {
  ticketsClotures: number;
  date: Date;
}

export async function cloturerJournee(
  repo: TicketRepository,
  clock: Clock,
  cabinetId: string,
  date: Date
): Promise<CloturerJourneeResult> {
  const ticketsClotures = await repo.closeDay(cabinetId, date, clock.now());
  return { ticketsClotures, date };
}

export async function verifierJourneeStale(
  repo: TicketRepository,
  clock: Clock,
  cabinetId: string
): Promise<Date | null> {
  const today = clock.now();
  const dateAujourdhui = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const stale = await repo.findStaleTickets(cabinetId, dateAujourdhui);
  if (stale.length === 0) return null;
  // Retourne la date de la journée non clôturée
  return stale[0].date_file;
}
