import { NextResponse } from "next/server";
import { getSession } from "@infrastructure/auth/session";
import { getMetricsToday } from "@infrastructure/prisma/ticket-repository";
import { realClock } from "@infrastructure/clock";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const now = realClock.now();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const metrics = await getMetricsToday(session.cabinetId, today);

  return NextResponse.json(metrics);
}

export const dynamic = "force-dynamic";
