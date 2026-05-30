import type { Clock, TicketRepository } from "@application/ports";

/**
 * Expire tous les tickets absents dont le délai de grâce est dépassé.
 * Appelé en début de chaque polling GET /api/tickets (pattern lazy).
 */
export async function expirerAbsents(
  repo: TicketRepository,
  clock: Clock
): Promise<number> {
  const now = clock.now();
  const expires = await repo.findAbsentsExpires(now);

  await Promise.all(
    expires.map((t) =>
      repo.update(t.id, t.cabinet_id, { etat: "expire", fin_le: now })
    )
  );

  return expires.length;
}
