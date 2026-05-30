import { ordreReintegre, type Ticket } from "@domain/queue";
import type { Clock, TicketRepository } from "@application/ports";

export async function reintegrerPatient(
  repo: TicketRepository,
  clock: Clock,
  id: string,
  cabinetId: string,
  decalage: number = 2,
  maxReintegrations: number = 1
): Promise<Ticket> {
  const ticket = await repo.findById(id, cabinetId);
  if (!ticket) throw new Error("Ticket introuvable");
  if (ticket.etat !== "absent") throw new Error(`Transition invalide : ${ticket.etat} → en_attente`);

  // Garde-fou anti-abus
  if (ticket.nb_reintegrations >= maxReintegrations) {
    throw new Error("Nombre maximal de réintégrations atteint — réenregistrement obligatoire");
  }

  const dateFile = ticket.date_file;
  const tousLesTickets = await repo.findTodayByCabinet(cabinetId, dateFile);

  const nouvelOrdre = ordreReintegre(tousLesTickets, decalage);

  return repo.update(id, cabinetId, {
    etat: "en_attente",
    ordre: nouvelOrdre,
    grace_expire_le: null,
    nb_reintegrations: ticket.nb_reintegrations + 1,
  });
}
