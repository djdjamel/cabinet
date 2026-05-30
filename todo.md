# Plan de réalisation — Application de gestion de file d'attente patients

## Décisions d'architecture arrêtées
- **Imprimante** : écran = canal principal (QR en grand dans modale), impression = secondaire via `/print/[jeton]`
- **Voix arabe** : clips MP3 pré-générés avec `edge-tts` (ar-MA-JamalNeural + fr-FR-HenriNeural, 1–200)
- **Réseau patients** : Cloudflare Tunnel (`cloudflared` dans Docker Compose), code agnostique via `BASE_URL`
- **Clôture journée** : détection lazy au chargement dashboard (modale si tickets stale), pas de cron

---

## Lot 1 — Socle technique

- [x] 1.1 Initialiser le projet Next.js (TypeScript, App Router, Tailwind CSS)
- [x] 1.2 Créer l'arborescence des dossiers (`src/domain`, `src/application`, `src/infrastructure`, `src/ui`, `tests/`)
- [x] 1.3 Configurer `tsconfig.json` avec alias de chemins (`@domain`, `@application`, `@infrastructure`, `@ui`)
- [x] 1.4 Configurer Docker Compose (`app` + `postgres` + `cloudflared`)
- [x] 1.5 Créer le schéma Prisma (`cabinets`, `users`, `tickets`)
- [x] 1.6 Configurer les variables d'environnement (`.env.example`)
- [x] 1.7 Implémenter l'authentification infirmière (login / logout / session cookie argon2id)
- [x] 1.8 Proxy Next.js 16 (`proxy.ts`) : protection des routes `/dashboard` + scoping `cabinet_id`
- [x] 1.9 Test d'isolation multi-tenant (3 tests passent)

---

## Lot 2 — Cœur métier (domain/ en premier)

- [x] 2.1 Types domaine : `Ticket`, `TicketType`, `TicketEtat`
- [x] 2.2 Règle : calcul de `position`
- [x] 2.3 Règle : numérotation séquentielle + `ordreNormal`
- [x] 2.4 Règle : insertion d'urgence (`ordreUrgent`) + réintégration (`ordreReintegre`)
- [x] 2.5 Règle : estimation du temps d'attente (fourchette ±20%, arrondie à 5 min)
- [x] 2.6 Ports : `TicketRepository`, `Clock`, `TokenGenerator`
- [x] 2.7 Use-case `enregistrerPatient`
- [x] 2.8 Use-cases `appelerTicket` / `demarrerConsultation` / `terminerConsultation`
- [x] 2.9 Use-cases `marquerAbsent` / `reintegrerPatient` / `annulerTicket`
- [x] 2.10 Use-case `reordonnerTicket`
- [x] 2.11 Use-cases `cloturerJournee` + `verifierJourneeStale` + `obtenirFile` + `obtenirEtatPatient`
- [x] 2.12 Tests unitaires purs : 30 tests passent (3 suites)

---

## Lot 3 — QR code & page patient

- [x] 3.1 Génération jeton aléatoire (base62, 128 bits) — `infrastructure/qr/token.ts`
- [x] 3.2 Génération QR code SVG + data URL (lib `qrcode`) — `infrastructure/qr/qr-generator.ts`
- [x] 3.3 Routes API `POST /api/tickets` + `PATCH /api/tickets/[id]` (actions)
- [x] 3.4 Route API publique `GET /api/public/file/[jeton]`
- [x] 3.5 Page patient `/f/[jeton]` — polling 5s, hook `usePatientState`
- [x] 3.6 États : bandeau vert (appelé), orange + chrono (absent), gris (terminé)
- [x] 3.7 Blocs RTL (arabe) + LTR (français), chiffres occidentaux
- [x] Routes API `GET /api/queue/status` + `POST /api/queue/close-day`
- [x] `PrismaTicketRepository` + `CabinetRepository` + `Clock` réels

---

## Lot 4 — Tableau de bord infirmière

- [x] 4.1 `GET /api/tickets` retourne `FileVue` calculé (positions + estimations)
- [x] 4.2 `PATCH /api/tickets/[id]` — toutes les actions en un seul endpoint
- [x] 4.3 `POST /api/queue/close-day` (déjà fait Lot 3)
- [x] 4.4 `FileList` intégré dans `DashboardView` (ordre par position)
- [x] 4.5 `TicketCard` : numéro, nom, type, durée, actions contextuelles par état
- [x] 4.6 `AbsentsSection` repliable avec chronos décomptés localement
- [x] 4.7 `NouveauPatientModal` : type + nom → QR grand écran + bouton imprimer
- [x] 4.8 `DayClosureModal` : détection lazy au chargement + clôturer / continuer
- [x] 4.9 `TicketDetailPanel` : nom éditable, horodatages, annuler
- [x] 4.10 `useDashboard` polling 4s + `DashboardView` bandeau hors-ligne

---

## Lot 5 — Impression du ticket thermique

- [x] 5.1 Route `/print/[jeton]` : page dédiée (layout propre, zéro CDN)
- [x] 5.2 `TicketPrint` bilingue AR+FR : cabinet, numéro, QR, instructions, date
- [x] 5.3 CSS `@page { size: 58mm auto; margin: 2mm }` + `AutoPrint` (useEffect)

---

## Lot 6 — No-show & délai de grâce

- [x] 6.1 Règle domaine : délai de grâce (30 min, configurable)
- [x] 6.2 Règle domaine : réintégration (+2 positions, garde-fou 1 max)
- [x] 6.3 Expiration automatique des absents (vérification au polling serveur)
- [x] 6.4 Page patient : bandeau orange + compte à rebours si `absent`
- [x] 6.5 Dashboard : chronos individuels dans section « Absents »

---

## Lot 7 — Modules optionnels

- [x] 7.1 Page écran de salle `/salle/[cabinet]` + route API
- [x] 7.2 Annonce vocale : script `gen:audio` (edge-tts), lecture `Audio` AR→FR
- [x] 7.3 Métriques dashboard + route API
- [x] 7.4 Page paramètres cabinet

---

## Lot 8 — Sécurité & production

- [x] 8.1 Rate limiting endpoints publics
- [x] 8.2 Protection CSRF sur mutations
- [x] 8.3 Logs structurés Pino (sans données personnelles)
- [x] 8.4 Politique de rétention (purge tickets après X jours)
- [x] 8.5 Ressources statiques embarquées (pas de CDN)

---

## Révision
*(à compléter au fur et à mesure)*
