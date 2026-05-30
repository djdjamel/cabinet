import type { Ticket } from "@domain/queue";
import type { TicketRepository } from "@application/ports";

export async function reordonnerTicket(
  repo: TicketRepository,
  id: string,
  cabinetId: string,
  nouvelOrdre: number
): Promise<Ticket> {
  const ticket = await repo.findById(id, cabinetId);
  if (!ticket) throw new Error("Ticket introuvable");
  if (!["en_attente", "appele"].includes(ticket.etat)) {
    throw new Error("Seuls les tickets en attente ou appelés peuvent être réordonnés");
  }

  return repo.update(id, cabinetId, { ordre: nouvelOrdre });
}
