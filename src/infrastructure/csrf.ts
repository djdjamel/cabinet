import type { NextRequest } from "next/server";

/**
 * Vérifie que l'Origin de la requête correspond au host servi.
 * Protège les mutations contre les attaques CSRF cross-site.
 *
 * – Si l'Origin est absent (curl, appels serveur), la requête est acceptée.
 * – Si l'Origin est présent mais ne correspond pas au host de la requête, rejet.
 */
export function checkOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // appel non-navigateur → autorisé

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}
