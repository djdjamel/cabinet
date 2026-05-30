# Conception (Phase 1) — Application de gestion de file d'attente

> Document de conception technique. Découle de `docs/specification.md` (référence métier).
> Décisions techniques **arrêtées** avec l'équipe (voir §3). Les points encore ouverts
> sont listés en §13.

---

## 1. Vue d'ensemble de l'architecture

Trois surfaces, un seul backend, une base de données multi-tenant, **auto-hébergé au
cabinet** :

```
   ┌─────────────────────┐         ┌──────────────────────┐
   │  Page patient (mob.) │         │  Écran de salle (opt.)│
   │  /f/<jeton>          │         │  /salle/<cabinet>     │
   │  - lecture seule     │         │  - lecture seule      │
   │  - polling ~5s       │         │  - polling ~5s        │
   └──────────┬──────────┘         └───────────┬──────────┘
              │  (public, jeton)                │ (public, cabinet)
              ▼                                 ▼
        ┌───────────────────────────────────────────────┐
        │                  BACKEND / API                  │
        │  - REST, scoping par cabinet_id                  │
        │  - auth infirmière (session)                     │
        │  - calcul position + estimation                  │
        │  - logs structurés / métriques                   │
        └───────────────────┬──────────────────────────────┘
                             ▼
                   ┌───────────────────┐
                   │   PostgreSQL       │  (cabinets, users, tickets)
                   └───────────────────┘
              ▲
              │ (authentifié, session cabinet)
   ┌──────────┴───────────┐
   │ Tableau de bord       │
   │ infirmière (PC)       │
   │ - pilotage de la file │
   │ - polling ~3-5s       │
   │ - impression / voix   │
   └──────────────────────┘

   Le tout tourne sur une machine du cabinet (Docker Compose).
```

---

## 2. Organisation du code — séparation stricte UI / logique

**Principe directeur du projet (non négociable) :** la **logique métier** est totalement
**séparée de l'UI**, pour faciliter la maintenance, les tests et l'évolution.

### Couches (les dépendances pointent vers l'intérieur)

```
  ui/  ──►  application/  ──►  domain/   ◄──  infrastructure/
 (React)     (use-cases)      (règles pures)     (Prisma, TTS, QR…)
```

| Couche | Contient | Ne contient JAMAIS |
|---|---|---|
| **domain/** | Règles métier **pures** : ordre de la file, calcul de position, estimation du temps, machine à états du no-show, numérotation. Types/fonctions purs. | React, Next, Prisma, I/O |
| **application/** | Use-cases qui orchestrent le domaine via des **ports** (interfaces de dépôt). | JSX, accès direct à la DB |
| **infrastructure/** | Implémentations concrètes : dépôts Prisma, génération QR, TTS, impression. | Règles métier |
| **ui/** | Composants **présentables**, hooks de données, pages. | Règle métier (déléguée à l'API/use-cases) |

### Règles concrètes
- **Aucune règle métier dans un composant React ni dans un handler de route API.** Les
  routes API et les composants sont **minces** : ils appellent les use-cases.
- **`domain/` n'importe rien** de React / Next / Prisma → testable en isolation, sans DB.
- Les use-cases dépendent d'**interfaces** (`TicketRepository`, `Clock`…), pas des
  implémentations → on peut substituer/mocker.
- Les composants UI reçoivent des **données déjà calculées** (position, fourchette
  d'attente) ; ils ne recalculent rien.

### Arborescence cible
```
src/
  domain/          # entités + règles pures (file, ticket, estimation, no-show)
  application/     # use-cases + ports (interfaces)
  infrastructure/  # prisma/, tts/, qr/, print/ (adapters)
  ui/              # composants présentables + hooks
app/               # routes Next (minces) -> appellent application/
  (dashboard)/ (f)/ (salle)/ api/
tests/             # tests unitaires domain/application (sans DB)
```

> Cette convention est aussi consignée dans `.kiro/steering/architecture.md` pour guider
> tout le développement.

---

## 3. Choix techniques (arrêtés)

| Domaine | Choix | Notes |
|---|---|---|
| Langage | **TypeScript** (bout en bout) | Typage fort, un seul langage |
| Framework | **Next.js (App Router)** | Dashboard + pages patient + API |
| Base de données | **PostgreSQL** | Transactions (numérotation), JSON params |
| Accès données | **Prisma** | Dans `infrastructure/` uniquement |
| Style | **Tailwind CSS** | Support **RTL/LTR** |
| Temps réel | **Polling** (V1), SSE plus tard | Simple, robuste |
| QR | lib **qrcode** | Génération locale (SVG/PNG) |
| Impression | **CSS print**, **ticket thermique 58 mm** | *(décidé)* |
| Voix (TTS) | **Web Speech API du navigateur** (directe) | Intégrée, gratuite, zéro dépendance/surcoût |
| Auth | Sessions + mot de passe **argon2id** | 2FA plus tard |
| Observabilité | Logs **pino** + capture d'erreurs **local/auto-hébergé** | Pas de service cloud |
| Hébergement | **Auto-hébergé au cabinet — Docker Compose** | *(décidé)* |

---

## 4. Déploiement auto-hébergé & accessibilité réseau

Modèle de déploiement **arrêté** :

- Le serveur (app + PostgreSQL, via Docker Compose) tourne sur le **PC de l'infirmière**.
- Le **tableau de bord** de l'infirmière s'adresse au serveur en **`localhost`** → il
  **reste fonctionnel même en cas de coupure internet** (résilience locale ✅).
- Les **patients ne se connectent jamais au Wi-Fi du cabinet** : ils accèdent à leur page
  en **données mobiles (4G)**. Le serveur doit donc être **joignable depuis Internet**.
- Pendant une **coupure internet momentanée**, les patients perdent l'accès à leur page
  (comportement **accepté**) ; l'infirmière, elle, continue de piloter la file.

### Point d'entrée public (détail d'installation, code agnostique)
Pour que les patients en 4G atteignent le PC de l'infirmière, il faut un point d'entrée :
| Option | Derrière CGNAT ? | Dépendance tierce | Note |
|---|---|---|---|
| **Redirection de port + DNS dynamique** | Non | Aucune | Nécessite une IP publique côté box |
| **Tunnel inverse** (ex. Cloudflare Tunnel) | Oui | Service de tunnel | URL publique sans domaine |

> Le **code reste agnostique** : l'URL de base des liens/QR est une variable de
> configuration (`BASE_URL`). Le choix du point d'entrée se fait **à l'installation**, sans
> rien recoder.

### Conséquences sur le code (à respecter)
- **Aucune dépendance externe au runtime** côté tableau de bord (polices, scripts, CSS
  **embarqués localement**, pas de CDN) → la page charge même sans internet.
- Le **temps réel** (polling) dégrade proprement : bandeau « hors-ligne / reconnexion… »
  sans casser l'UI.

---

## 5. Modèle de données détaillé

> PostgreSQL. Identifiants en `uuid`. `cabinet_id` partout (multi-tenant).
> Le schéma vit dans `infrastructure/prisma` ; le `domain/` manipule ses propres types.

### Table `cabinets`
| Colonne | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| nom | text | |
| fuseau_horaire | text | ex. `Africa/Casablanca` |
| params | jsonb | paramètres §15 de la spec |
| cree_le | timestamptz | |

### Table `users`
| Colonne | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| cabinet_id | uuid (FK) | |
| nom | text | |
| identifiant | text (unique) | login |
| mot_de_passe_hash | text | argon2id |
| role | enum(`nurse`,`admin`) | |
| cree_le | timestamptz | |

### Table `tickets`
| Colonne | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| cabinet_id | uuid (FK) | |
| date_file | date | jour de la file |
| numero | int | séquence **par cabinet et par jour** |
| type | enum(`normal`,`urgent`,`acte_court`) | |
| etat | enum(`en_attente`,`appele`,`en_consultation`,`termine`,`absent`,`expire`,`annule`) | |
| jeton_public | text (unique) | aléatoire base62, **expirant** (cf. date_file) |
| nom_prive | text (null) | jamais exposé hors dashboard / page perso |
| ordre | numeric | position explicite (insertion sans renumérotation) |
| grace_expire_le | timestamptz (null) | si `absent` |
| nb_reintegrations | int (défaut 0) | garde-fou anti-abus |
| cree_le, appele_le, absent_le, debut_consult_le, fin_le | timestamptz (null) | métriques |

**Index / contraintes :**
- `UNIQUE (cabinet_id, date_file, numero)`
- `UNIQUE (jeton_public)`
- `INDEX (cabinet_id, date_file, etat, ordre)`

**Notes :**
- `ordre` en `numeric` → insérer **entre deux** tickets (ex. 3.5) sans renuméroter.
- La **position** = nb de tickets `en_attente|appele` d'`ordre` inférieur. Calculée à la
  volée (dans `domain/`), jamais stockée.
- Numérotation : `MAX(numero)+1` par `(cabinet_id, date_file)` en transaction.

---

## 6. API (REST) — ébauche

Les routes sont **minces** : validation + appel d'un use-case `application/`.

### Auth (infirmière)
- `POST /api/auth/login` → `{ identifiant, mot_de_passe }` → session cookie
- `POST /api/auth/logout`

### Tickets (authentifié, scoping cabinet automatique)
- `POST /api/tickets` → `{ type, nom? }` → `{ numero, jeton, qr }`
- `GET /api/tickets/today` → `{ en_attente[], en_cours, absents[] }`
- `PATCH /api/tickets/:id` → `{ etat?, type?, nom?, ordre? }`
- Sucre : `POST /api/tickets/:id/appeler|demarrer|terminer|absent|reintegrer|annuler`
- `GET /api/metrics/today` ; `GET|PATCH /api/settings`

### Public (sans auth, par jeton)
- `GET /api/public/file/:jeton` →
  ```json
  {
    "mon_numero": 12,
    "numero_en_cours": 7,
    "personnes_devant": 4,
    "etat": "en_attente",
    "attente_estimee_min": [20, 30],
    "grace_restante_sec": null,
    "nom": "…"        // uniquement si activé ET c'est SON ticket
  }
  ```
- `GET /api/public/salle/:cabinet` → numéro en cours + derniers appelés (numéros seuls)
- *(plus tard)* `GET /api/public/file/:jeton/stream` (SSE)

**Estimation (dans `domain/`) :** `somme(durée_type_i)` des tickets devant
(`normal=urgent=durée_moyenne`, `acte_court≈2–3 min`), affichée en fourchette
`[est×0.8, est×1.2]` arrondie à 5 min.

---

## 7. Maquette — Tableau de bord infirmière (PC)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Cabinet Dr. ____            Vendredi 29/05            [+ Nouveau patient]  │
│                                                  [Métriques] [Paramètres ⚙] │
├──────────────────────────────────────────────────────────────────────────┤
│  EN CONSULTATION                                                            │
│   ┌────────────────────────────────────────────────────────────────────┐  │
│   │  N° 07   • Ahmed B.        (normal)      depuis 6 min   [Terminer ✓] │  │
│   └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  FILE D'ATTENTE                                                  (4)        │
│   ┌────────────────────────────────────────────────────────────────────┐  │
│   │ ⠿ N° 08  • (sans nom)      [normal]   attend 12 min   [Appeler ▸] ⋮ │  │
│   │ ⠿ N° 09  • Fatima Z.       [urgent]   attend  3 min   [Appeler ▸] ⋮ │  │
│   │ ⠿ N° 10  • —               [acte court] attend 1 min  [Appeler ▸] ⋮ │  │
│   │ ⠿ N° 11  • —               [normal]   attend  0 min   [Appeler ▸] ⋮ │  │
│   └────────────────────────────────────────────────────────────────────┘  │
│   (⠿ = glisser pour réordonner ;  ⋮ = menu : nom, type, annuler)           │
│                                                                            │
│  ▸ ABSENTS (en délai)                                            (1)        │
│   ┌────────────────────────────────────────────────────────────────────┐  │
│   │  N° 06   • Karim L.        ⏳ 24:12 restantes   [Réintégrer ↩]       │  │
│   └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Modale "Nouveau patient"** : type (Normal / Urgent / Acte court) + **nom (optionnel)**,
puis **QR en grand** + **Imprimer le ticket**.
**Clic sur un numéro** → panneau : nom, type, horodatages, annuler.

---

## 8. Maquette — Page patient (mobile, bilingue AR + FR)

```
┌───────────────────────────────┐        États :
│        Cabinet Dr. ____        │        • en_attente (ci-contre)
│   رقمك / Votre numéro          │        • appelé → bandeau vert
│            12                  │            « C'est à vous ! / حان دورك »
│   ───────────────────────────  │        • absent → bandeau orange + chrono
│   En cours / الجاري:    07     │            « Présentez-vous : 28:45 »
│   Devant vous / أمامك:  4       │        • terminé → « Consultation terminée »
│   Attente / الانتظار: ≈ 20–30m │
│   ● Mise à jour auto…          │
└───────────────────────────────┘
```

- **RTL/LTR** : bloc arabe `dir="rtl"`, bloc français `dir="ltr"`.
- **Chiffres occidentaux (0-9)**. Page **ultra-légère** ; bandeau "reconnexion…" si réseau faible.

---

## 9. Ticket imprimé — thermique 58 mm (bilingue)

```
┌───────────────────────┐
│    Cabinet Dr. ____    │
│ ───────────────────── │
│  Votre numéro / رقمك   │
│          12            │
│      [ QR CODE ]       │
│  Scannez pour suivre   │
│  امسح لمتابعة دورك     │
│ ───────────────────── │
│  29/05/2026  14:32     │
└───────────────────────┘
```

- Route d'impression dédiée + `window.print()`, **CSS print calibré 58 mm** (rouleau
  thermique). Adaptable 80 mm si besoin.

---

## 10. Annonce vocale (module optionnel)

- Déclenchée au clic **"Appeler"** (geste utilisateur → autoplay autorisé).
- Séquence **arabe puis français** ; **numéro uniquement**, jamais le nom.
- **Implémentation : Web Speech API du navigateur** (`SpeechSynthesis`), directement —
  solution la plus simple, intégrée, gratuite, sans dépendance ni surcoût. On énonce le
  numéro avec la voix `ar` puis `fr` disponibles sur le poste.
- À **tester sur le PC réel** du cabinet (disponibilité d'une voix arabe correcte) ; sinon
  l'annonce française seule reste utilisable.

---

## 11. Sécurité — mise en œuvre

- **Scoping cabinet** : requêtes filtrées par `cabinet_id` de la **session** (jamais par
  paramètre client). **Test d'isolation obligatoire**.
- **Jeton public** : aléatoire 128 bits (base62), **expiration** = file du jour ;
  endpoint public **lecture seule** + **rate limiting** par IP/jeton.
- **Mots de passe** argon2id ; cookies `HttpOnly`/`SameSite` ; **CSRF** sur mutations.
- Si exposition Internet (option B/C §4) : **HTTPS obligatoire**, surface minimale.
- **Logs** sans donnée personnelle ; sauvegardes + purge des tickets après X jours.

---

## 12. Découpage en lots (Phase 2)

1. **Socle** : projet (arbo §2), Docker Compose, schéma Prisma, auth, multi-tenant +
   **test d'isolation**.
2. **Cœur file (domain/ d'abord)** : numérotation, ordre, position, actions
   appeler→terminer. Tests unitaires purs.
3. **QR + page patient** : génération QR, page publique bilingue, polling, estimation.
4. **Impression** : route ticket + CSS print 58 mm.
5. **No-show** : délai de grâce, chrono patient, réintégration, expiration auto, anti-abus.
6. **Modules** : écran de salle, annonce vocale (clips locaux), métriques dashboard.

---

## 13. Décisions de déploiement (arrêtées)

- **Hôte** : le **PC de l'infirmière** (Docker Compose : app + PostgreSQL).
- **Résilience** : le tableau de bord parle au serveur en `localhost` → **fonctionne même
  sans internet** ; les patients (en 4G) perdent l'accès le temps d'une coupure (accepté).
- **Accès patients** : **données mobiles uniquement** (jamais le Wi-Fi du cabinet) → point
  d'entrée public à finaliser **à l'installation** (redirection de port + DNS dynamique,
  ou tunnel inverse). Code **agnostique** via `BASE_URL`.
- **TTS** : **Web Speech API** du navigateur, directement.

> Tous les points structurants sont tranchés → **on peut développer la Phase 2**.
