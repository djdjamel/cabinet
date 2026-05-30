import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@infrastructure/auth/session";
import { prismaTicketRepository, purgeOldTickets } from "@infrastructure/prisma/ticket-repository";
import { getCabinetParams } from "@infrastructure/prisma/cabinet-repository";
import { realClock } from "@infrastructure/clock";
import { tokenGenerator } from "@infrastructure/qr/token";
import { generateQRDataUrl } from "@infrastructure/qr/qr-generator";
import { enregistrerPatient } from "@application/tickets/enregistrer-patient";
import { obtenirFile } from "@application/tickets/obtenir-file";
import { expirerAbsents } from "@application/tickets/expirer-absents";
import { checkOrigin } from "@infrastructure/csrf";
import { logger } from "@infrastructure/logger";

const RETENTION_DAYS = Number(process.env.RETENTION_DAYS ?? "30");

// Purge lazy : une fois par jour, déclenché sur le premier polling du dashboard
let lastPurgeDay = "";

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    logger.warn({ endpoint: "POST /api/tickets" }, "csrf_rejected");
    return NextResponse.json({ error: "Requête refusée" }, { status: 403 });
  }

  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { type, nom } = body ?? {};

  if (!["normal", "urgent", "acte_court"].includes(type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

  const result = await enregistrerPatient(
    { repo: prismaTicketRepository, clock: realClock, token: tokenGenerator },
    { cabinetId: session.cabinetId, type, nom, baseUrl }
  );

  const qrDataUrl = await generateQRDataUrl(result.jetonUrl);

  logger.info({
    cabinet_id: session.cabinetId,
    numero: result.ticket.numero,
    type: result.ticket.type,
  }, "ticket.created");

  return NextResponse.json({
    id: result.ticket.id,
    numero: result.ticket.numero,
    jeton: result.ticket.jeton_public,
    jetonUrl: result.jetonUrl,
    qr: qrDataUrl,
  });
}

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Purge lazy : une fois par jour, supprime les tickets anciens
  const now = realClock.now();
  const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}-${String(now.getUTCDate()).padStart(2,"0")}`;
  if (lastPurgeDay !== todayStr) {
    lastPurgeDay = todayStr;
    purgeOldTickets(RETENTION_DAYS)
      .then((n) => { if (n > 0) logger.info({ purged: n, retention_days: RETENTION_DAYS }, "retention.purge"); })
      .catch((err: unknown) => logger.error({ err }, "retention.purge.error"));
  }

  // Expiration lazy : passe les absents expirés en "expire" avant de retourner la file
  await expirerAbsents(prismaTicketRepository, realClock);

  const params = await getCabinetParams(session.cabinetId);
  const file = await obtenirFile(
    prismaTicketRepository,
    realClock,
    session.cabinetId,
    params.duree_moyenne_min
  );

  return NextResponse.json({ ...file, params });
}
