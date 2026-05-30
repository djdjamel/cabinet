import { NextResponse } from "next/server";
import { getSession } from "@infrastructure/auth/session";
import { purgeOldTickets } from "@infrastructure/prisma/ticket-repository";
import { logger } from "@infrastructure/logger";

const RETENTION_DAYS = Number(process.env.RETENTION_DAYS ?? "30");

export async function POST() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const purged = await purgeOldTickets(RETENTION_DAYS);
  logger.info({ purged, retention_days: RETENTION_DAYS }, "retention.purge");

  return NextResponse.json({ purged, retention_days: RETENTION_DAYS });
}

export const dynamic = "force-dynamic";
