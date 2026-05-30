import type { Ticket } from "@domain/queue";
import type { Clock, TicketRepository } from "@application/ports";

export async function demarrerConsultation(
  repo: TicketRepository,
  clock: Clock,
  id: string,
  cabinetId: string
): Promise<Ticket> {
  const ticket = await repo.findById(id, cabinetId);
  if (!ticket) throw new Error("Ticket introuvable");
  if (ticket.etat !== "appele") throw new Error(`Transition invalide : ${ticket.etat} → en_consultation`);

  return repo.update(id, cabinetId, {
    etat: "en_consultation",
    debut_consult_le: clock.now(),
  });
}
