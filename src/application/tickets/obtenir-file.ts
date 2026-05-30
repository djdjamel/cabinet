import { calculerPosition, estimerAttente, type Ticket } from "@domain/queue";
import type { Clock, TicketRepository } from "@application/ports";

export interface TicketVue {
  id: string;
  numero: number;
  type: Ticket["type"];
  etat: Ticket["etat"];
  nom_prive: string | null;
  jeton_public: string;
  ordre: number;
  position: number;
  attente_estimee_min: [number, number];
  grace_restante_sec: number | null;
  cree_le: Date;
  appele_le: Date | null;
  debut_consult_le: Date | null;
}

export interface FileVue {
  en_attente: TicketVue[];
  en_cours: TicketVue | null;
  absents: TicketVue[];
}

export async function obtenirFile(
  repo: TicketRepository,
  clock: Clock,
  cabinetId: string,
  dureeMoyenneMin: number = 15
): Promise<FileVue> {
  const now = clock.now();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tickets = await repo.findTodayByCabinet(cabinetId, today);

  function toVue(t: Ticket): TicketVue {
    const grace_restante_sec =
      t.etat === "absent" && t.grace_expire_le
        ? Math.max(0, Math.floor((t.grace_expire_le.getTime() - now.getTime()) / 1000))
        : null;

    return {
      id: t.id,
      numero: t.numero,
      type: t.type,
      etat: t.etat,
      nom_prive: t.nom_prive,
      jeton_public: t.jeton_public,
      ordre: t.ordre,
      position: calculerPosition(t, tickets),
      attente_estimee_min: estimerAttente(t, tickets, dureeMoyenneMin),
      grace_restante_sec,
      cree_le: t.cree_le,
      appele_le: t.appele_le,
      debut_consult_le: t.debut_consult_le,
    };
  }

  return {
    en_attente: tickets
      .filter((t) => t.etat === "en_attente")
      .sort((a, b) => a.ordre - b.ordre)
      .map(toVue),
    en_cours: (() => {
      const t = tickets.find((t) => ["appele", "en_consultation"].includes(t.etat));
      return t ? toVue(t) : null;
    })(),
    absents: tickets
      .filter((t) => t.etat === "absent")
      .map(toVue),
  };
}
