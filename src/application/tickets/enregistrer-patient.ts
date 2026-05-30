import { ordreNormal, ordreUrgent, type Ticket } from "@domain/queue";
import type { Clock, TicketRepository, TokenGenerator } from "@application/ports";

interface Deps {
  repo: TicketRepository;
  clock: Clock;
  token: TokenGenerator;
}

interface Input {
  cabinetId: string;
  type: "normal" | "urgent" | "acte_court";
  nom?: string;
  baseUrl: string;
}

export interface EnregistrerPatientResult {
  ticket: Ticket;
  jetonUrl: string;
}

export async function enregistrerPatient(
  deps: Deps,
  input: Input
): Promise<EnregistrerPatientResult> {
  const now = deps.clock.now();
  const dateFile = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const ticketsAujourdhui = await deps.repo.findTodayByCabinet(
    input.cabinetId,
    dateFile
  );

  const numero = await deps.repo.getNextNumero(input.cabinetId, dateFile);

  const ordre =
    input.type === "urgent"
      ? (ordreUrgent(ticketsAujourdhui) ?? ordreNormal(ticketsAujourdhui))
      : ordreNormal(ticketsAujourdhui);

  const jeton = deps.token.generate();

  const ticket = await deps.repo.create({
    cabinet_id: input.cabinetId,
    date_file: dateFile,
    numero,
    type: input.type,
    jeton_public: jeton,
    nom_prive: input.nom ?? null,
    ordre,
    cree_le: now,
  });

  return {
    ticket,
    jetonUrl: `${input.baseUrl}/f/${jeton}`,
  };
}
