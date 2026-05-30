import { NextResponse } from "next/server";
import { getSession } from "@infrastructure/auth/session";
import { prismaTicketRepository as repo } from "@infrastructure/prisma/ticket-repository";
import { realClock as clock } from "@infrastructure/clock";
import { verifierJourneeStale } from "@application/tickets/cloturer-journee";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const staleDate = await verifierJourneeStale(repo, clock, session.cabinetId);

  return NextResponse.json({
    staleTickets: staleDate !== null,
    staleDate: staleDate?.toISOString().slice(0, 10) ?? null,
  });
}
