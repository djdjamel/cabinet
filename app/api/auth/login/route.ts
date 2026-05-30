import { NextRequest, NextResponse } from "next/server";
import { login } from "@application/auth/login";
import { rateLimit, getIP } from "@infrastructure/rate-limiter";
import { logger } from "@infrastructure/logger";

export async function POST(req: NextRequest) {
  // Rate limit : 5 tentatives/min par IP (anti brute-force)
  const ip = getIP(req);
  if (!rateLimit(`auth:login:${ip}`, 60_000, 5)) {
    logger.warn({ ip }, "login.rate_limited");
    return NextResponse.json({ error: "Trop de tentatives" }, { status: 429 });
  }

  const body = await req.json();
  const { identifiant, mot_de_passe } = body ?? {};

  if (!identifiant || !mot_de_passe) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const result = await login(identifiant, mot_de_passe);

  if (!result.ok) {
    logger.warn({ identifiant, ip }, "login.failed");
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  logger.info({ identifiant }, "login.success");
  return NextResponse.json({ ok: true });
}
