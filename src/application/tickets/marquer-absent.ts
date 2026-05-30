import type { Ticket } from "@domain/queue";
import type { Clock, TicketRepository } from "@application/ports";

export async function marquerAbsent(
  repo: TicketRepository,
  clock: Clock,
  id: string,
  cabinetId: string,
  delaiGraceMin: number = 30
): Promise<Ticket> {
  const ticket = await repo.findById(id, cabinetId);
  if (!ticket) throw new Error("Ticket introuvable");
  if (!["appele", "en_attente"].includes(ticket.etat)) {
    throw new Error(`Transition invalide : ${ticket.etat} → absent`);
  }

  const now = clock.now();
  const graceExpireLe = new Date(now.getTime() + delaiGraceMin * 60 * 1000);

  return repo.update(id, cabinetId, {
    etat: "absent",
    absent_le: now,
    grace_expire_le: graceExpireLe,
  });
}
