import { NextRequest, NextResponse } from "next/server";
import { db } from "@infrastructure/prisma/db";
import { rateLimit, getIP } from "@infrastructure/rate-limiter";

// Public — pas d'authentification requise (écran de salle)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cabinetId: string }> }
) {
  // Rate limit : 20 req/min par IP (poll toutes les 5s → 12 req/min normalement)
  const ip = getIP(req);
  if (!rateLimit(`public:salle:${ip}`, 60_000, 20)) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { cabinetId } = await params;

  const cabinet = await db.cabinet.findUnique({
    where: { id: cabinetId },
    select: { nom: true },
  });
  if (!cabinet) {
    return NextResponse.json({ error: "Cabinet introuvable" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tickets = await db.ticket.findMany({
    where: {
      cabinet_id: cabinetId,
      date_file: today,
      etat: { in: ["en_attente", "appele", "en_consultation"] },
    },
    orderBy: { ordre: "asc" },
    select: { numero: true, etat: true, type: true },
  });

  type Row = typeof tickets[number];
  const enCours = tickets.find((t: Row) => t.etat === "en_consultation") ?? null;
  const appele  = tickets.find((t: Row) => t.etat === "appele") ?? null;
  const enAttenteCount = tickets.filter((t: Row) => t.etat === "en_attente").length;

  return NextResponse.json({
    cabinetNom: cabinet.nom,
    enCours: enCours ? { numero: enCours.numero, type: enCours.type } : null,
    appele:   appele  ? { numero: appele.numero,  type: appele.type  } : null,
    enAttenteCount,
  });
}

export const dynamic = "force-dynamic";
