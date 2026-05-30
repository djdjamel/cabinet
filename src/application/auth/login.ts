import { db } from "@infrastructure/prisma/db";
import { getSession } from "@infrastructure/auth/session";
import { verify } from "argon2";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function login(
  identifiant: string,
  motDePasse: string
): Promise<LoginResult> {
  const user = await db.user.findUnique({ where: { identifiant } });

  if (!user) {
    return { ok: false, error: "Identifiant ou mot de passe incorrect" };
  }

  const valid = await verify(user.mot_de_passe_hash, motDePasse);
  if (!valid) {
    return { ok: false, error: "Identifiant ou mot de passe incorrect" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.cabinetId = user.cabinet_id;
  session.role = user.role as "nurse" | "admin";
  session.isLoggedIn = true;
  await session.save();

  return { ok: true };
}
