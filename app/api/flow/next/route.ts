import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@infrastructure/auth/session";
import { checkOrigin } from "@infrastructure/csrf";
import { prismaTicketRepository } from "@infrastructure/prisma/ticket-repository";
import { realClock } from "@infrastructure/clock";
import { suivantCascade } from "@application/tickets/suivant-cascade";
import { logger } from "@infrastructure/logger";

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    logger.warn({ endpoint: "POST /api/flow/next" }, "csrf_rejected");
    return NextResponse.json({ error: "Requête refusée" }, { status: 403 });
  }

  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const result = await suivantCascade(
      prismaTicketRepository,
      realClock,
      session.cabinetId
    );

    logger.info({ cabinet_id: session.cabinetId, ...result }, "flow.next");
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    logger.warn({ cabinet_id: session.cabinetId, error: message }, "flow.next.error");
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
