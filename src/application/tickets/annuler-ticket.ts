import type { Ticket } from "@domain/queue";
import type { Clock, TicketRepository } from "@application/ports";

const ETATS_ANNULABLES = ["en_attente", "appele"];

export async function annulerTicket(
  repo: TicketRepository,
  clock: Clock,
  id: string,
  cabinetId: string
): Promise<Ticket> {
  const ticket = await repo.findById(id, cabinetId);
  if (!ticket) throw new Error("Ticket introuvable");
  if (!ETATS_ANNULABLES.includes(ticket.etat)) {
    throw new Error(`Impossible d'annuler un ticket en état : ${ticket.etat}`);
  }

  return repo.update(id, cabinetId, {
    etat: "annule",
    fin_le: clock.now(),
  });
}
