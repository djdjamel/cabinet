import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@infrastructure/auth/session";
import { prismaTicketRepository as repo } from "@infrastructure/prisma/ticket-repository";
import { realClock as clock } from "@infrastructure/clock";
import { cloturerJournee } from "@application/tickets/cloturer-journee";
import { checkOrigin } from "@infrastructure/csrf";
import { logger } from "@infrastructure/logger";

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: "Requête refusée" }, { status: 403 });
  }

  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { date } = body ?? {};

  if (!date) {
    return NextResponse.json({ error: "Date manquante" }, { status: 400 });
  }

  const dateObj = new Date(date);
  const result = await cloturerJournee(repo, clock, session.cabinetId, dateObj);

  logger.info({ cabinet_id: session.cabinetId, date, clotures: result.ticketsClotures }, "day.closed");
  return NextResponse.json(result);
}
