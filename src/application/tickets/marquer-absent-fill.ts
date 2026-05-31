import type { Ticket } from "@domain/queue";
import type { Clock, TicketRepository } from "@application/ports";
import { marquerAbsent } from "./marquer-absent";

const BUFFER_SIZE = 2;

/**
 * Marque un patient ON_DECK (appele) comme absent, puis FILL :
 * si la place libérée dans le tampon n'est pas comblée, appelle
 * automatiquement le prochain patient EN_ATTENTE.
 * Correspond à T4 + FILL du design_file.md v2.
 */
export async function marquerAbsentEtRemplir(
  repo: TicketRepository,
  clock: Clock,
  id: string,
  cabinetId: string,
  delaiGraceMin: number
): Promise<Ticket> {
  const now = clock.now();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // 1. Marquer absent (valide la transition + pose le TTL)
  const ticket = await marquerAbsent(repo, clock, id, cabinetId, delaiGraceMin);

  // 2. FILL — une place vient de se libérer dans le tampon
  const tickets = await repo.findTodayByCabinet(cabinetId, today);
  const tamponCount = tickets.filter((t) => t.etat === "appele").length;

  if (tamponCount < BUFFER_SIZE) {
    const prochain = tickets
      .filter((t) => t.etat === "en_attente")
      .sort((a, b) => a.ordre - b.ordre)[0];

    if (prochain) {
      await repo.update(prochain.id, cabinetId, {
        etat: "appele",
        appele_le: now,
      });
    }
  }

  return ticket;
}
