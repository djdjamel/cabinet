/**
 * Rate limiter in-memory (sliding window).
 * Adapté à un déploiement single-instance.
 * Clé = IP + endpoint.
 */

const store = new Map<string, number[]>();

/**
 * Retourne true si la requête est autorisée, false si limitée.
 * @param key       Identifiant unique (ex. "ip:endpoint")
 * @param windowMs  Fenêtre en ms (ex. 60_000 = 1 min)
 * @param max       Nombre max de requêtes par fenêtre
 */
export function rateLimit(key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const times = (store.get(key) ?? []).filter((t) => t > now - windowMs);

  if (times.length >= max) {
    store.set(key, times);
    return false;
  }

  times.push(now);
  store.set(key, times);
  return true;
}

/** Extrait l'IP cliente depuis les headers ou req.ip. */
export function getIP(request: { headers: Headers; ip?: string }): string {
  return (
    (request.headers as { get: (k: string) => string | null }).get("x-forwarded-for")
      ?.split(",")[0]
      .trim() ??
    request.ip ??
    "unknown"
  );
}
