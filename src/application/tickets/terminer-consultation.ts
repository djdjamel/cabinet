import type { Ticket } from "@domain/queue";
import type { Clock, TicketRepository } from "@application/ports";

export async function terminerConsultation(
  repo: TicketRepository,
  clock: Clock,
  id: string,
  cabinetId: string
): Promise<Ticket> {
  const ticket = await repo.findById(id, cabinetId);
  if (!ticket) throw new Error("Ticket introuvable");
  if (ticket.etat !== "en_consultation") throw new Error(`Transition invalide : ${ticket.etat} → termine`);

  return repo.update(id, cabinetId, {
    etat: "termine",
    fin_le: clock.now(),
  });
}
