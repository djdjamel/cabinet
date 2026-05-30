import { calculerPosition, estimerAttente } from "@domain/queue";
import type { Clock, TicketRepository } from "@application/ports";

export interface EtatPatient {
  mon_numero: number;
  numero_en_cours: number | null;
  personnes_devant: number;
  etat: string;
  attente_estimee_min: [number, number];
  grace_restante_sec: number | null;
  nom: string | null;
}

export async function obtenirEtatPatient(
  repo: TicketRepository,
  clock: Clock,
  jeton: string,
  afficherNom: boolean = true,
  dureeMoyenneMin: number = 15
): Promise<EtatPatient | null> {
  const ticket = await repo.findByJeton(jeton);
  if (!ticket) return null;

  // Vérifier que le jeton est du jour (expiration en fin de journée)
  const now = clock.now();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dateFile = new Date(ticket.date_file);
  if (dateFile < today) return null; // jeton expiré

  const tousLesTickets = await repo.findTodayByCabinet(ticket.cabinet_id, dateFile);

  const enCours = tousLesTickets.find((t) =>
    ["appele", "en_consultation"].includes(t.etat)
  );

  const grace_restante_sec =
    ticket.etat === "absent" && ticket.grace_expire_le
      ? Math.max(0, Math.floor((ticket.grace_expire_le.getTime() - now.getTime()) / 1000))
      : null;

  return {
    mon_numero: ticket.numero,
    numero_en_cours: enCours?.numero ?? null,
    personnes_devant: calculerPosition(ticket, tousLesTickets),
    etat: ticket.etat,
    attente_estimee_min: estimerAttente(ticket, tousLesTickets, dureeMoyenneMin),
    grace_restante_sec,
    nom: afficherNom ? ticket.nom_prive : null,
  };
}
