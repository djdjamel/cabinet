import type { Clock, TicketRepository } from "@application/ports";

const BUFFER_SIZE = 2;

export interface SuivantResult {
  clos: boolean;
  admis: boolean;
  appele: number;
}

/**
 * Cascade « par admission » — T3 / T3b du design_file.md v2.
 *
 * En un seul appel :
 *  1. Clore le patient EN_CONSULTATION (→ terminé)
 *  2. Admettre la tête du tampon ON_DECK (→ en_consultation)
 *  3. FILL : remplir toutes les places libres du tampon depuis EN_ATTENTE
 *
 * Si tampon et consultation sont vides mais qu'il y a des patients en
 * attente, le FILL remplit le tampon (jusqu'à BUFFER_SIZE) sans rien clore.
 * Si rien à faire du tout, renvoie { clos:false, admis:false, appele:0 }.
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

  // Rien à faire
  if (!enConsultation && tampon.length === 0 && enAttente.length === 0) {
    return { clos: false, admis: false, appele: 0 };
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

  // 3. FILL — remplir toutes les places disponibles du tampon
  let tamponRestant = tampon.length - (tamponHead ? 1 : 0);
  const enAttenteFile = [...enAttente];
  let appeleCount = 0;

  while (tamponRestant < BUFFER_SIZE && enAttenteFile.length > 0) {
    const prochain = enAttenteFile.shift()!;
    await repo.update(prochain.id, cabinetId, {
      etat: "appele",
      appele_le: now,
    });
    tamponRestant++;
    appeleCount++;
  }

  return { clos: !!enConsultation, admis: !!tamponHead, appele: appeleCount };
}
