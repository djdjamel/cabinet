import pino from "pino";

/**
 * Logger structuré (JSON) — aucune donnée personnelle.
 *
 * Champs jamais loggés : nom_prive, jeton_public, mot_de_passe, mot_de_passe_hash.
 * Champs loggés        : cabinet_id, ticket_id, numero, action, etat, ip.
 *
 * En développement : `npm run dev | npx pino-pretty` pour un affichage lisible.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "*.nom_prive",
      "*.jeton_public",
      "*.mot_de_passe",
      "*.mot_de_passe_hash",
    ],
    censor: "[REDACTED]",
  },
});
