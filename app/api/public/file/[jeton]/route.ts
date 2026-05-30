import { NextRequest, NextResponse } from "next/server";
import { prismaTicketRepository as repo } from "@infrastructure/prisma/ticket-repository";
import { getCabinetParams } from "@infrastructure/prisma/cabinet-repository";
import { realClock as clock } from "@infrastructure/clock";
import { obtenirEtatPatient } from "@application/tickets/obtenir-etat-patient";
import { rateLimit, getIP } from "@infrastructure/rate-limiter";
import { logger } from "@infrastructure/logger";

type Params = { params: Promise<{ jeton: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  // Rate limit : 30 req/min par IP (le patient poll toutes les 5s → 12 req/min normalement)
  const ip = getIP(req);
  if (!rateLimit(`public:file:${ip}`, 60_000, 30)) {
    logger.warn({ ip, endpoint: "/api/public/file" }, "rate_limit_exceeded");
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { jeton } = await params;

  // Trouver d'abord le ticket pour récupérer le cabinet_id
  const ticket = await repo.findByJeton(jeton);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable ou expiré" }, { status: 404 });
  }

  const cabinetParams = await getCabinetParams(ticket.cabinet_id);

  const etat = await obtenirEtatPatient(
    repo,
    clock,
    jeton,
    cabinetParams.afficher_nom,
    cabinetParams.duree_moyenne_min
  );

  if (!etat) {
    return NextResponse.json({ error: "Ticket introuvable ou expiré" }, { status: 404 });
  }

  return NextResponse.json(etat, {
    headers: {
      // Pas de cache — données temps réel
      "Cache-Control": "no-store",
    },
  });
}
