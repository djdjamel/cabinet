import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@infrastructure/auth/session";
import { checkOrigin } from "@infrastructure/csrf";
import { logger } from "@infrastructure/logger";
import { prismaTicketRepository as repo } from "@infrastructure/prisma/ticket-repository";
import { getCabinetParams } from "@infrastructure/prisma/cabinet-repository";
import { realClock as clock } from "@infrastructure/clock";
import { appelerTicket } from "@application/tickets/appeler-ticket";
import { demarrerConsultation } from "@application/tickets/demarrer-consultation";
import { terminerConsultation } from "@application/tickets/terminer-consultation";
import { marquerAbsentEtRemplir } from "@application/tickets/marquer-absent-fill";
import { reintegrerPatient } from "@application/tickets/reintegrer-patient";
import { annulerTicket } from "@application/tickets/annuler-ticket";
import { reordonnerTicket } from "@application/tickets/reordonner-ticket";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/tickets/:id  { action?, ordre?, nom? }
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!checkOrigin(req)) {
    logger.warn({ endpoint: "PATCH /api/tickets/[id]" }, "csrf_rejected");
    return NextResponse.json({ error: "Requête refusée" }, { status: 403 });
  }

  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const cabinetId = session.cabinetId;
  const body = await req.json();
  const { action, ordre, nom } = body ?? {};

  const cabinetParams = await getCabinetParams(cabinetId);

  try {
    let ticket;

    if (action === "appeler") {
      ticket = await appelerTicket(repo, clock, id, cabinetId);
    } else if (action === "demarrer") {
      ticket = await demarrerConsultation(repo, clock, id, cabinetId);
    } else if (action === "terminer") {
      ticket = await terminerConsultation(repo, clock, id, cabinetId);
    } else if (action === "absent") {
      ticket = await marquerAbsentEtRemplir(repo, clock, id, cabinetId, cabinetParams.delai_grace_min);
    } else if (action === "reintegrer") {
      ticket = await reintegrerPatient(
        repo, clock, id, cabinetId,
        cabinetParams.decalage_reintegration,
        cabinetParams.max_reintegrations
      );
    } else if (action === "annuler") {
      ticket = await annulerTicket(repo, clock, id, cabinetId);
    } else if (ordre !== undefined) {
      ticket = await reordonnerTicket(repo, id, cabinetId, ordre);
    } else if (nom !== undefined) {
      ticket = await repo.update(id, cabinetId, { nom_prive: nom });
    } else {
      return NextResponse.json({ error: "Action ou champ invalide" }, { status: 400 });
    }

    if (action) {
      logger.info({ cabinet_id: cabinetId, ticket_id: id, action }, "ticket.action");
    }
    return NextResponse.json({ ticket });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    logger.warn({ cabinet_id: cabinetId, ticket_id: id, action, error: message }, "ticket.action.error");
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
