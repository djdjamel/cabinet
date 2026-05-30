import type { Ticket } from "@domain/queue";
import type { Clock, TicketRepository } from "@application/ports";

export async function appelerTicket(
  repo: TicketRepository,
  clock: Clock,
  id: string,
  cabinetId: string
): Promise<Ticket> {
  const ticket = await repo.findById(id, cabinetId);
  if (!ticket) throw new Error("Ticket introuvable");
  if (ticket.etat !== "en_attente") throw new Error(`Transition invalide : ${ticket.etat} → appele`);

  return repo.update(id, cabinetId, {
    etat: "appele",
    appele_le: clock.now(),
  });
}
