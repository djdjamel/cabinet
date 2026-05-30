import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@infrastructure/auth/session";
import { db } from "@infrastructure/prisma/db";
import { checkOrigin } from "@infrastructure/csrf";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const cabinet = await db.cabinet.findUnique({
    where: { id: session.cabinetId },
    select: { nom: true, params: true },
  });

  return NextResponse.json(cabinet);
}

export async function PATCH(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: "Requête refusée" }, { status: 403 });
  }

  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { nom, params } = body ?? {};

  const current = await db.cabinet.findUnique({
    where: { id: session.cabinetId },
    select: { params: true },
  });

  const mergedParams = { ...(current?.params as object ?? {}), ...(params ?? {}) };

  await db.cabinet.update({
    where: { id: session.cabinetId },
    data: {
      ...(nom !== undefined && { nom: String(nom).trim() }),
      params: mergedParams,
    },
  });

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
