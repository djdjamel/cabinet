import type { Clock, TicketRepository } from "@application/ports";

const BUFFER_SIZE = 2;

export interface SuivantResult {
  clos: boolean;
  admis: boolean;
  appele: boolean;
}

/**
 * Cascade « par admission » — T3 / T3b du design_file.md v2.
 *
 * En un seul appel :
 *  1. Clore le patient EN_CONSULTATION (→ terminé)
 *  2. Admettre la tête du tampon ON_DECK (→ en_consultation)
 *  3. FILL : appeler le prochain EN_ATTENTE pour garder le tampon plein
 *
 * Si le tampon est vide mais qu'un patient est en consultation (T3b),
 * on le clôture seulement (borne libre).
 * Si rien à faire, renvoie { clos:false, admis:false, appele:false }.
 */
export async function suivantCascade(
  repo: TicketRepository,
  clock: Clock,
  cabinetId: string
): Promise<SuivantResult> {
  const now = clock.now();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tickets = await repo.findTodayByCabinet(cabinetId, today);

  const enConsultation = tickets.find((t) => t.etat === "en_consultation") ?? null;
  const tampon = tickets
    .filter((t) => t.etat === "appele")
    .sort((a, b) => a.ordre - b.ordre);
  const enAttente = tickets
    .filter((t) => t.etat === "en_attente")
    .sort((a, b) => a.ordre - b.ordre);

  if (!enConsultation && tampon.length === 0) {
    return { clos: false, admis: false, appele: false };
  }

  // 1. Clore la consultation en cours
  if (enConsultation) {
    await repo.update(enConsultation.id, cabinetId, {
      etat: "termine",
      fin_le: now,
    });
  }

  // 2. Admettre la tête du tampon (T3)
  const tamponHead = tampon[0] ?? null;
  if (tamponHead) {
    await repo.update(tamponHead.id, cabinetId, {
      etat: "en_consultation",
      debut_consult_le: now,
    });
  }

  // 3. FILL — le tampon a perdu sa tête ; s'il reste de la place, on rappelle
  const tamponRestant = tampon.length - (tamponHead ? 1 : 0);
  let appele = false;
  if (tamponRestant < BUFFER_SIZE && enAttente.length > 0) {
    await repo.update(enAttente[0].id, cabinetId, {
      etat: "appele",
      appele_le: now,
    });
    appele = true;
  }

  return { clos: !!enConsultation, admis: !!tamponHead, appele };
}
