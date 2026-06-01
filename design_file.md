# Spécification : Système de Gestion de File d'Attente « Zéro Friction »

> **Statut :** Conception (v2.1)
> **Date :** 2026-05-31
> **Contexte cible :** Cabinet médical mono-médecin, flux 100 % spontané (sans rendez-vous).
> **Changement majeur v2 :** l'**infirmière est l'opératrice unique** ; le **médecin n'a aucune interaction** avec le système ; la **tablette publique est supprimée** ; introduction d'un **pipeline d'enregistrement différé** (tampon de 2) ; la file avance par une **cascade « par admission »** en un seul clic.
> **Décisions verrouillées :**
> - priorité = urgence clinique, **binaire** (Normal/Urgent), posée par l'infirmière ;
> - réinsertion par *timestamp* d'arrivée original ;
> - affichage *rang + temps estimé* ;
> - profil d'accessibilité optionnel par jeton (nom d'annonce + mode silencieux) ;
> - **enregistrement différé** au moment « sur le pont » ; **tampon de 2** patients prêts ;
> - **délivrance en lot optionnelle et bornée** (2 à 10 tickets d'un coup) pour le flux d'ouverture, fonction *secondaire* ; **la liste matinale n'est pas importée** (pré-tri physique) ;
> - **aucun** vieillissement, **aucun** push web, **aucun filet de secours** en v2 (option A : le système se met en pause quand l'infirmière s'absente — limite assumée).

---

## 1. Objet et périmètre

Le système ordonne des **Jetons** anonymes et fait progresser les patients dans un **pipeline à trois étages** opéré par une seule personne (l'infirmière). Le médecin est traité comme **le service consommé** : il ne touche à rien.

### 1.1 Dans le périmètre
- Délivrance de tickets (Normal/Urgent) par l'infirmière, sans saisie de données patient.
- File d'attente, **tampon d'enregistrement** (les 2 prochains, prêts), consultation en cours.
- Avancement de la file par cascade, gestion des absences, réinsertion.
- Affichage temps réel du rang et du temps d'attente estimé (smartphone + TV + voix).
- Persistance et reprise après redémarrage.

### 1.2 Hors périmètre (non-objectifs)
- Aucune gestion de rendez-vous / créneaux horaires.
- Aucun dossier patient (motif, antécédents) : il reste dans l'**application d'enregistrement du cabinet** (le « PMS »), *indépendante* et non couplée à ce système.
- **Exception bornée :** un *nom d'annonce* (prénom) peut être attaché à un jeton comme **étiquette d'accessibilité** (§7.4) — pas une identité : write-once, non interrogeable, non triable, jamais exportée, détruite avec le jeton.
- Aucun multi-médecin (un seul point de consommation).
- **La liste matinale n'est pas importée** dans le système : c'est un pré-tri *physique*. À l'ouverture, l'infirmière délivre les tickets (au besoin **en lot**, §7.9) à la file *présente* ; les inscrits absents prennent un ticket à leur arrivée réelle (et perdent leur position de l'aube — effet volontairement dissuasif).
- **Aucun filet de secours en l'absence de l'infirmière** (option A, §7.7).

---

## 2. Principes directeurs

1. **Abstraction par défaut, exceptions d'accessibilité bornées.** Le système ne connaît que des Jetons anonymes (numéro + catégorie). Les accommodements (nom, mode silencieux) sont des exceptions explicites posées par l'infirmière.
2. **Le médecin est le service, pas un opérateur.** Il n'a ni écran ni bouton. La fin de consultation est détectée par l'infirmière (**ligne de vue sur la porte + retour du patient au bureau**), jamais par une action du médecin.
3. **Opératrice unique = l'infirmière.** Elle délivre les tickets, fait avancer la file, marque les absents, réinsère. Conséquence assumée (option A) : **quand elle s'absente, le système se met en pause** ; il n'y a pas de repli automatique.
4. **Charge différée (pipeline).** On n'enregistre un patient dans le PMS que lorsqu'il devient imminent (« sur le pont »), *pendant* la consultation du précédent. On masque ainsi le temps d'enregistrement et on n'enregistre jamais ceux qui abandonnent tôt.
5. **Un seul ordre, une seule opération.** La priorité = un tri stable `(catégorie, heure d'arrivée)` ; l'avancement = une cascade déclenchée par un seul clic.
6. **Aucun changement inexpliqué à l'écran.** Tout événement non monotone visible du public (urgence insérée, réinsertion d'un absent) est explicité (marqueur visuel + variante vocale).
7. **Anti-spam total.** Seule l'infirmière délivre des tickets : un patient ne peut pas s'auto-servir (la tablette publique est supprimée).

---

## 3. Glossaire

| Terme | Définition |
|---|---|
| **Jeton (Token)** | Unité abstraite circulant dans le système (numéro + catégorie). Seule donnée métier. |
| **Infirmière (Opératrice)** | Unique opératrice. Interface à son bureau + imprimante à tickets. |
| **Médecin** | Le service consommé. Aucune interaction avec le système. |
| **Cerveau (Moteur)** | Serveur orchestrateur : stocke, ordonne, chronomètre, annonce. |
| **PMS** | Logiciel d'enregistrement du cabinet, **indépendant** de ce système. |
| **En attente** | Jeton avec ticket, **non encore enregistré**, dans la file principale. |
| **Sur le pont (tampon)** | Les `BUFFER_SIZE` (=2) prochains jetons, appelés au bureau et enregistrés dans le PMS, prêts à entrer. |
| **En consultation** | Jeton actuellement chez le médecin (au plus un). |
| **Purgatoire** | État transitoire des absents, soumis à un compte à rebours (TTL). |
| **Cascade « par admission »** | Le clic « Suivant » fait *entrer* le prochain ; le précédent est clôturé en conséquence. |
| **Rang / EMA** | Position d'un jeton / moyenne mobile exponentielle de la durée de consultation. |

---

## 4. Topologie et matrice des autorisations

**Le seul levier sensible (l'urgence) et tout ticket sont entre les mains de l'infirmière.**

| Nœud | Acteur | Appareil | Actions | Authentification |
|---|---|---|---|---|
| **A** | Patient | Son smartphone / la TV de la salle | *Consulter* son statut (rang + ETA) ; se présenter au bureau quand appelé | Aucune (lecture seule via ID du jeton) |
| **B** | **Infirmière** | **Interface unique** à son bureau + imprimante | Délivrer ticket (Normal/Urgent), **Suivant** (cascade), **Absent**, **Réinsertion**, profil d'accessibilité, **Annuler** | Rôle `NURSE` |
| **C** | Médecin | *(aucun)* | *(aucune — il consulte, c'est tout)* | — |
| **D** | — | Serveur (Cerveau) | Orchestration, tampon, TTL, EMA, diffusion SSE | — |
| **TV** | — | Écran de la salle | Affiche « en cours » + prochains numéros, voix | — |

> **Le médecin est hors boucle.** La fin de consultation est captée par l'infirmière (ligne de vue + retour du patient). Aucun matériel ni clic côté médecin.
>
> **Plus de tablette.** L'infirmière délivre chaque ticket d'**un tap**, en posant le badge (Normal par défaut, Urgent si elle juge). Le ticket imprimé porte numéro + QR (le suivi smartphone est conservé).

---

## 5. Modèle de données

### 5.1 Entité `Token`

| Champ | Type | Mutable ? | Description |
|---|---|---|---|
| `id` | UUID v4 | Non | Identifiant unique, encodé dans le QR. |
| `number` | Entier | Non | Numéro séquentiel quotidien (ex. 142). |
| `category` | `NORMAL` \| `URGENT` | Oui (monotone) | Badge posé par l'infirmière. N'évolue que `NORMAL → URGENT`. |
| `created_at` | Timestamp (ISO-8601, ms) | Non | **Heure d'arrivée. Clé d'ordonnancement. Jamais modifiée, même après réinsertion.** |
| `state` | `TokenState` | Oui | `WAITING` \| `ON_DECK` \| `IN_CONSULTATION` \| `ABSENT` \| `DONE` \| `EXPIRED`. |
| `ondeck_at` | Timestamp \| null | Oui | Entrée dans le tampon (appel au bureau). |
| `consultation_started_at` | Timestamp \| null | Oui | Entrée en consultation. |
| `done_at` | Timestamp \| null | Oui | Clôture de la consultation. |
| `absent_at` / `expires_at` | Timestamp \| null | Oui | Entrée au purgatoire / échéance du TTL. |
| `reinsert_count` | Entier ≥ 0 | Oui | Réinsertions effectuées (plafonné). |
| `announce_label` | string \| null | Oui (write-once, infirmière) | Profil d'accessibilité : prénom annoncé. Non interrogeable, non trié, jamais exporté, détruit avec le jeton. |
| `announce_mode` | `NORMAL` \| `SILENT` | Oui (infirmière) | `SILENT` = aucune annonce publique ; appel poussé seulement sur l'appareil du patient. Défaut `NORMAL`. |

### 5.2 État global du Cerveau

| Champ | Type | Description |
|---|---|---|
| `tokens` | Map<UUID, Token> | Tous les jetons du jour. |
| `next_number` | Entier | Compteur séquentiel (réinitialisé quotidiennement). |
| `in_consultation_id` | UUID \| null | Jeton chez le médecin (invariant : au plus un). |
| `on_deck` | Liste ordonnée (≤ `BUFFER_SIZE`) | Tampon des prochains prêts. |
| `ema_service_seconds` / `ema_sample_count` | Réel / Entier | Durée de consultation lissée et son compteur. |
| `last_action` | Snapshot \| null | Instantané pour `Annuler`. |

### 5.3 Clé d'ordonnancement (le cœur mathématique)

```
rang_categorie(URGENT) = 0 ; rang_categorie(NORMAL) = 1
clé(token) = ( rang_categorie(token.category), token.created_at )
```

- L'ordre **global** sur les jetons non terminés est `clé` croissante.
- Le **tampon** (`on_deck`) = le préfixe de cet ordre, déjà appelé et enregistré (au plus `BUFFER_SIZE`).
- Le **prochain admis** = tête de `on_deck` = le jeton de `clé` minimale.
- Les `URGENT` passent avant les `NORMAL` ; à catégorie égale, **FIFO par heure d'arrivée** (tri stable).
- **Exception de non-préemption :** un patient déjà `IN_CONSULTATION` n'est jamais interrompu ; un `URGENT` arrivé tardivement attend donc au plus les patients déjà `ON_DECK` devant lui (≤ 2).
- La réinsertion conserve `created_at` ⇒ l'absent revenu reprend *sa* place naturelle.

---

## 6. Machine à états

### 6.1 Schéma

```
   (infirmière : "Délivrer ticket")
              │
              ▼
   ┌────────────────────┐   réinsertion (si TTL non écoulé,
   │     EN ATTENTE      │◄──   reinsert_count < MAX_REINSERT)
   └─────────┬──────────┘                          ▲
   remplissage auto du tampon                       │
   (pop_min, ≤ BUFFER_SIZE)                          │
              ▼                                       │
   ┌────────────────────┐  "Absent" (no-show au      │
   │  SUR LE PONT        │───  bureau) ──► ABSENT ──(TTL)──► EXPIRÉ
   │  (tampon de 2,      │
   │   enregistrement)   │
   └─────────┬──────────┘
   "Suivant" : la tête entre…
              ▼
   ┌────────────────────┐  …et le précédent est
   │  EN CONSULTATION    │── clôturé en conséquence ──► TERMINÉ
   └────────────────────┘

  • "Suivant" (cascade par admission) :
      1) s'il y a un patient EN CONSULTATION → TERMINÉ (clôture conséquente) ;
      2) la tête de SUR LE PONT → EN CONSULTATION ;
      3) remplissage auto : pop_min(EN ATTENTE) → SUR LE PONT (appel + à enregistrer).
    S'il n'y a personne à admettre, "Suivant" clôt juste le patient courant (borne libre).
  • La pause du médecin = l'infirmière diffère simplement son clic.
```

### 6.2 Table de transitions

| # | Source | Événement | Garde | Cible | Effets de bord |
|---|---|---|---|---|---|
| T1 | (néant) | `CREATE_TICKET` (Normal/Urgent) | rôle `NURSE` | `WAITING` | `number ← next_number++`, `created_at ← now`, `category` selon le bouton ; **puis FILL** |
| T2 | `WAITING` | `FILL` (auto) | `|on_deck| < BUFFER_SIZE` ET jeton = `pop_min()` | `ON_DECK` | `ondeck_at ← now` ; **annonce** (§10) `reason ∈ {NEW, REINSERTED}` |
| T3 | `ON_DECK`(tête) | `NEXT` (« Suivant ») | rôle `NURSE` | `IN_CONSULTATION` | si `in_consultation_id` existe → ce jeton `DONE` (`done_at ← now`, **EMA** §8) ; `consultation_started_at ← now` ; `in_consultation_id ← id` ; **puis FILL** |
| T3b | (aucun ON_DECK) | `NEXT` | rôle `NURSE` | — | clôt le `IN_CONSULTATION` courant → `DONE` (EMA) ; `in_consultation_id ← null` (borne libre) |
| T4 | `ON_DECK` | `ABSENT` (jeton ciblé) | rôle `NURSE` | `ABSENT` | `absent_at ← now` ; `expires_at ← now + TTL_ABSENT` ; **puis FILL** |
| T5 | `ABSENT` | `REINSERT` | rôle `NURSE`, `now < expires_at`, `reinsert_count < MAX_REINSERT` | `WAITING` | `reinsert_count++` ; `expires_at,absent_at ← null` ; **`created_at` inchangé** (prochain appel `reason = REINSERTED`) ; **puis FILL** |
| T6 | `ABSENT` | `TTL_EXPIRE` | `now ≥ expires_at` | `EXPIRED` | destruction logique |
| T7 | `WAITING`/`ON_DECK`/`IN_CONSULTATION` | `PROMOTE` | rôle `NURSE`, `category = NORMAL` | (inchangé) | `category ← URGENT` (réordonne ; sans préempter le patient en consultation) |
| T8 | non terminal | `SET_ACCESS` | rôle `NURSE` | (inchangé) | pose `announce_label` et/ou `announce_mode` |

> **FILL** est une opération interne déclenchée après T1/T3/T4/T5 : tant que `|on_deck| < BUFFER_SIZE` et qu'il reste des `WAITING`, on tire le `pop_min()` vers `ON_DECK` et on l'annonce. À l'équilibre, exactement **un** nouveau patient est appelé par cycle.
>
> **Délivrance en lot (optionnelle, §7.9).** Un raccourci équivaut à `N` exécutions successives de **T1** (avec `BATCH_MIN ≤ N ≤ BATCH_MAX`), aux `created_at` strictement croissants pour préserver l'ordre de la file physique. **Aucun nouvel état ni transition** : c'est purement un confort d'émission.

### 6.3 Invariants

- **I1 — Unicité :** au plus un jeton `IN_CONSULTATION`.
- **I2 — Immutabilité :** `id`, `number`, `created_at` ne changent jamais.
- **I3 — Monotonie :** `category` n'évolue que `NORMAL → URGENT`.
- **I4 — Tampon borné et plein :** `|on_deck| = min(BUFFER_SIZE, |on_deck| + |WAITING|)` après chaque événement (rempli avidement).
- **I5 — Ordre :** `on_deck` est le préfixe de l'ordre global `clé` ; le prochain admis est la tête.
- **I6 — Non-préemption :** un jeton `IN_CONSULTATION` n'est jamais interrompu.
- **I7 — Terminaux figés :** depuis `DONE`/`EXPIRED`, aucune transition.
- **I8 — Réinsertion plafonnée :** `reinsert_count ≤ MAX_REINSERT`.
- **I9 — Purgatoire :** un `ABSENT` a `expires_at` défini et passe `EXPIRED` dès `now ≥ expires_at`.
- **I10 — Étiquette bornée :** `announce_label` ni interrogeable ni triable ni exporté ; purgé avec le jeton.

---

## 7. Opérations et scénarios

### 7.1 Pipeline et cascade « par admission »
À chaque fin de consultation, l'infirmière (qui a vu la porte se libérer + le patient ressortir) clique **« Suivant »** : la tête du tampon **entre** chez le médecin, et le patient précédent est **clôturé en conséquence**. Le système **réalimente** alors le tampon depuis la file (un nouveau patient est appelé au bureau pour enregistrement). La **pause du médecin** ne demande aucun bouton : l'infirmière diffère son clic.

### 7.2 Enregistrement différé (le « différé de charge »)
À l'arrivée, l'infirmière délivre un ticket **sans rien saisir** (rapide, et on n'encombre pas le PMS de patients qui pourraient abandonner). Le patient n'est **enregistré dans le PMS** que lorsqu'il passe **« sur le pont »** — pendant que le médecin consulte le précédent. Le tampon de **2** garantit qu'un patient prêt attend toujours, même si un enregistrement est long. *(L'enregistrement lui-même se fait dans le PMS, hors de ce système ; ce système indique seulement « qui enregistrer maintenant ».)*

### 7.3 Filtrage des absents *avant* le médecin
L'annonce et l'enregistrement ont lieu **au bureau**. Un no-show est donc détecté **au comptoir** : l'infirmière clique `Absent`, le jeton part au purgatoire (TTL), et le tampon se réalimente. **Le médecin ne subit jamais une absence** : tout patient qui arrive chez lui est forcément présent et enregistré.

### 7.4 Profil d'accessibilité (nom d'annonce + mode silencieux)
Posé par l'infirmière (T8), typiquement à la délivrance du ticket :
- **`announce_label` (nom)** pour illettré / malvoyant : l'appel au bureau devient « Numéro 142, **Madame Fatima** » (le numéro reste la clé ; le nom est l'aide). Annoncé à la voix et sur la page perso du patient ; **jamais sur la TV partagée**.
- **`announce_mode = SILENT`** pour sensibilité sensorielle : aucune annonce publique ; appel poussé seulement sur l'appareil du patient (salle calme).

### 7.5 Réinsertion par timestamp original
Sans tablette, c'est l'infirmière qui réinsère un absent revenu (T5) : il repasse `WAITING` **en conservant `created_at`** et reprend sa place naturelle (en tête des Normaux). Anti-boucle : `MAX_REINSERT = 1`.

### 7.6 Annulation (`Annuler`)
Chaque action de flux prend un **instantané** (`last_action`) avant exécution. Pendant `UNDO_WINDOW`, `Annuler` restaure l'instantané (utile car la cascade modifie plusieurs jetons à la fois). Au-delà, l'instantané est purgé.

### 7.7 Absence de filet de secours (option A, assumée)
L'infirmière étant l'opératrice unique, **son absence met le système en pause** : pas de nouveau ticket, pas d'avancement, pas de marquage d'absence. C'est un compromis accepté pour rester économique et sans matériel public. Dans un petit cabinet, une courte absence ralentit de toute façon l'activité (le médecin aussi). *Évolution possible (option B, hors v2) : une mini-borne uniquement pour délivrer des tickets.*

### 7.8 Marqueur d'explication (anti « saut dans le temps »)
L'appel d'un jeton réinséré porte `reason = REINSERTED` : marqueur **« ↩ retour »** + voix « …, de retour ». La TV affiche en permanence **« en cours » + les prochains numéros**, ce qui banalise les séquences non monotones.

### 7.9 Délivrance en lot à l'ouverture (optionnelle, secondaire)
**But :** absorber le coup de feu de l'ouverture, lorsqu'un petit groupe (typiquement 5–10 personnes, p. ex. issues d'une liste matinale) attend déjà, **physiquement présent et auto-ordonné**. L'infirmière saisit un nombre `N` et délivre `N` tickets d'un coup, à distribuer dans l'ordre de la file présente.

**Règles de cadrage (pour ne pas dénaturer l'outil) :**
- **Bornée :** `BATCH_MIN ≤ N ≤ BATCH_MAX` (défaut 2 à 10). Un lot de 1 = un ticket normal ; au-delà de `BATCH_MAX`, refus (`BATCH_SIZE_OUT_OF_RANGE`).
- **Optionnelle et secondaire :** activable par cabinet (`BATCH_ISSUE_ENABLED`), présentée comme une **action discrète**, jamais comme le bouton principal. Le flux normal reste la délivrance unitaire.
- **Sémantique :** équivaut à `N` × T1, tous **Normaux**, aux `created_at` strictement croissants ⇒ l'ordre de délivrance (= ordre de la file physique = ordre de la liste) est **préservé automatiquement**. Une urgence éventuelle se promeut ensuite individuellement (T7).
- **Pas d'appariement dans le système :** les tickets sont remis dans l'ordre à la file présente ; chaque présent repart avec **son QR** et peut suivre la file. Le lien nom ↔ numéro (s'il existe sur la liste papier) **reste sur le papier** — l'application demeure anonyme.
- **Périmètre volontairement restreint :** on ne gère **ni l'import de la liste**, ni ses **absents** (qui n'ont ni QR ni présence) — c'est précisément ce qui aurait alourdi l'outil pour un faible bénéfice. Les absents reprennent un ticket à leur arrivée réelle.

---

## 8. Calcul du temps d'attente estimé

```
À chaque clôture de consultation (T3/T3b, IN_CONSULTATION → DONE) :
    échantillon = done_at − consultation_started_at      (en secondes)
    si ema_sample_count == 0 :  ema ← échantillon
    sinon                    :  ema ← α · échantillon + (1 − α) · ema
    ema_sample_count++
```

- L'échantillon mesure le temps réellement passé en consultation (incluant une éventuelle pause avant le clic de l'infirmière) : c'est le **débit réalisé**, idéal pour l'ETA.
- **Démarrage à froid :** `ema_sample_count == 0` ⇒ on utilise `S0_DEFAULT`.

```
ahead(t) = [1 si in_consultation_id ≠ null sinon 0]
         + |{ x ∈ (on_deck ∪ WAITING) : clé(x) < clé(t) }|
rang(t)  = ahead(t) + 1
eta_seconds(t) = ahead(t) × (ema si disponible sinon S0_DEFAULT)
```

**UX (honnêteté) :** la page patient affiche « N° 142 — 3 personnes devant vous — environ 32 min », et prévient que l'estimation peut augmenter en cas d'urgence. Statuts : `En attente → Présentez-vous à l'accueil (ON_DECK) → Entrez en consultation (IN_CONSULTATION) → Absent : revenez à l'accueil`.

---

## 9. API

Base : `/api`. JSON UTF-8, horodatages ISO-8601 (ms, UTC). Endpoints privilégiés : en-tête `Authorization: Bearer <device-token>` de rôle `NURSE`. (Plus aucun rôle `GUICHET` : le médecin n'a pas d'appareil.)

### 9.1 Endpoints patient (lecture seule, publics)

#### `GET /api/tickets/{id}` — instantané de statut
```json
{ "id":"9f1c…","number":142,"category":"NORMAL","state":"WAITING",
  "rang":4,"eta_seconds":1920,"people_ahead":3 }
```
#### `GET /api/tickets/{id}/stream` (SSE) — flux temps réel du statut (§10).

### 9.2 Endpoints infirmière (rôle `NURSE`)

| Endpoint | Effet |
|---|---|
| `POST /api/tickets` `{ "category":"NORMAL"\|"URGENT" }` | Délivre un ticket (T1). **201** → le `Token` + `tracking_url`. |
| `POST /api/tickets/batch` `{ "count": N }` | *(Optionnel, §7.9)* Délivre `N` tickets Normaux d'un coup (`BATCH_MIN ≤ N ≤ BATCH_MAX`), aux `created_at` croissants. **201** → liste ordonnée de `Token`. Erreurs `BATCH_DISABLED` (403), `BATCH_SIZE_OUT_OF_RANGE` (422). |
| `POST /api/flow/next` | Cascade « Suivant » (T3/T3b). **200** → `{ "admitted":{…}\|null, "finished":{…}\|null, "called_to_desk":{…}\|null }`. |
| `POST /api/tickets/{id}/absent` | Marque un `ON_DECK` absent (T4). **200** → `{ "absent":{…}, "called_to_desk":{…}\|null }`. Erreur `NOT_ON_DECK` (409). |
| `POST /api/tickets/{id}/reinsert` | Réinsère un absent (T5). Erreurs `TICKET_NOT_ABSENT` (409), `TICKET_EXPIRED` (410), `MAX_REINSERT_REACHED` (409). |
| `POST /api/tickets/{id}/promote` | Passe en `URGENT` (T7). Erreurs `ALREADY_URGENT` (409), `TICKET_TERMINAL` (409). |
| `POST /api/tickets/{id}/access` `{ "announce_label":…, "announce_mode":… }` | Profil d'accessibilité (T8). |
| `POST /api/flow/undo` | Annule la dernière action de flux dans `UNDO_WINDOW`. Erreurs `UNDO_WINDOW_EXPIRED`, `NO_ACTION_TO_UNDO`. |

### 9.3 Supervision (rôle `NURSE`)

#### `GET /api/queue` / `GET /api/queue/stream` (SSE)
```json
{
  "in_consultation": { "id":"…","number":140,"category":"NORMAL","consultation_started_at":"…" },
  "on_deck": [ { "id":"…","number":141,"category":"NORMAL","announce_label":null,"announce_mode":"NORMAL" },
               { "id":"…","number":142,"category":"URGENT","announce_label":null,"announce_mode":"NORMAL" } ],
  "waiting": [ { "id":"…","number":143,"category":"NORMAL","rang":4 } ],
  "absent_count": 2,
  "eta_global_seconds": 2700,
  "ema_service_seconds": 640, "ema_sample_count": 18
}
```
> `on_deck` et `waiting` portent les `id` : la **promotion en urgence se fait par numéro** d'un tap dans la liste (sans se lever ni solliciter le téléphone du patient). `eta_global_seconds` permet d'annoncer « ~45 min aujourd'hui » à l'accueil.

### 9.4 Affichage TV

#### `GET /api/display/stream` (SSE) — « en cours » + prochains numéros, voix ; respecte `SILENT`.

### 9.5 Modèle d'erreur
```json
{ "error": { "code": "TICKET_EXPIRED", "message": "Ce ticket a expiré, reprenez un ticket à l'accueil." } }
```
Codes : `TICKET_NOT_FOUND` (404), `NOT_ON_DECK` (409), `TICKET_NOT_ABSENT` (409), `TICKET_EXPIRED` (410), `MAX_REINSERT_REACHED` (409), `ALREADY_URGENT` (409), `TICKET_TERMINAL` (409), `UNDO_WINDOW_EXPIRED` (409), `NO_ACTION_TO_UNDO` (409), `BATCH_DISABLED` (403), `BATCH_SIZE_OUT_OF_RANGE` (422), `UNAUTHORIZED` (401/403).

---

## 10. Temps réel (SSE)

| Événement | Cible | Charge utile | Déclencheur |
|---|---|---|---|
| `status` | page patient | `{ state, rang, eta_seconds, people_ahead }` | tout changement affectant ce jeton |
| `called` | TV | `{ number, category, reason:"NEW"\|"REINSERTED", label, mode }` | entrée `ON_DECK` (FILL) |
| `queue_update` | TV / supervision | `{ in_consultation, next_numbers:[…], waiting_count, absent_count, eta_global_seconds }` | toute mutation |

Règles d'annonce (au moment **« sur le pont »**, c'est-à-dire l'appel au bureau) :
- `mode = SILENT` → ni voix ni TV ; seul le `status` du patient passe à « Présentez-vous à l'accueil ».
- `mode = NORMAL` + `label` → voix « Numéro {number}, {label} » ; la TV affiche le **numéro seul**.
- `reason = REINSERTED` → marqueur **« ↩ retour »** + voix « …, de retour ».
- L'entrée en consultation n'est **pas** annoncée publiquement (le patient est déjà au bureau ; sa page passe au vert « Entrez en consultation »).

Côté patient (sans push en v2) : à `rang ≤ BIENTOT_THRESHOLD`, la page passe à l'orange ; à l'appel au bureau, message « Présentez-vous à l'accueil » ; à l'admission, vert. Limite §12.

Synthèse vocale : `SpeechSynthesis` du navigateur sur l'appareil TV.

---

## 11. Persistance et robustesse (non-négociable)

- **Stockage durable :** chaque mutation est persistée (SQLite / journal + instantané). Au redémarrage, l'état complet (jetons, `next_number`, `in_consultation_id`, `on_deck`, EMA) est restauré.
- **Reconstruction du TTL :** au démarrage, tout `ABSENT` échu passe `EXPIRED` ; les autres conservent leur compte à rebours.
- **Réinitialisation quotidienne :** à `DAILY_RESET_TIME`, `next_number` repart à 1 ; jetons de la veille archivés/purgés.
- **Idempotence :** les actions de flux portent un identifiant de requête optionnel (anti double-clic réseau).

---

## 12. Accessibilité (énoncée honnêtement)

- **Profil par jeton (§7.4) :** nom d'annonce (illettré/malvoyant) **et** mode silencieux (sensibilité sensorielle) — deux besoins opposés couverts à la carte.
- **Canaux par défaut :** voix + TV couvrent un large spectre, sans être « universels » (aveugle ⇒ voix ; sourd ⇒ écran), d'où le profil ciblé.
- **Assistance humaine :** l'infirmière aide et pose le profil à la délivrance du ticket.
- **Limite — « partir et revenir » dégradé (sans push) :** le SSE ne vit que page au premier plan. Un patient qui met le navigateur en arrière-plan n'est pas alerté ; il doit rouvrir/rafraîchir sa page. Compromis assumé en v2.
- **Limite — pas de filet de secours (option A) :** en l'absence de l'infirmière, le système est en pause (§7.7).
- **Compromis :** un patient sans smartphone suit via la TV/voix mais ne peut pas s'absenter.

---

## 13. Paramètres de configuration

| Clé | Défaut | Description |
|---|---|---|
| `BUFFER_SIZE` | 2 | Nombre de patients « sur le pont » (prêts/enregistrés). |
| `BATCH_ISSUE_ENABLED` | true | Active la délivrance en lot (§7.9), action secondaire. |
| `BATCH_MIN` / `BATCH_MAX` | 2 / 10 | Bornes du nombre de tickets délivrables d'un coup. |
| `TTL_ABSENT` | 30 min | Durée du purgatoire avant destruction. |
| `MAX_REINSERT` | 1 | Réinsertions autorisées par jeton. |
| `EMA_ALPHA` (α) | 0,25 | Poids du dernier échantillon dans l'EMA. |
| `S0_DEFAULT` | 12 min | Durée de consultation par défaut (démarrage à froid). |
| `UNDO_WINDOW` | 30 s | Fenêtre d'annulation. |
| `BIENTOT_THRESHOLD` | 2 | Rang à partir duquel la page patient passe à l'orange. |
| `NEXT_PREVIEW_COUNT` | 3 | Nombre de prochains numéros affichés sur la TV. |
| `DAILY_RESET_TIME` | 00:00 | Réinitialisation du compteur de numéros. |

---

## 14. Décisions tranchées et évolutions possibles

### 14.1 Tranché
- **Médecin hors boucle**, opératrice unique = infirmière ; fin de consultation captée par ligne de vue + retour du patient.
- **Tablette supprimée** ; tickets délivrés par l'infirmière ; anti-spam total.
- **Pipeline** `En attente → Sur le pont (tampon 2) → En consultation → Terminé` ; **enregistrement différé** ; **cascade par admission** (1 clic) ; pause = clic différé.
- **Urgence binaire** ; **pas de push** ; **pas de vieillissement** ; **pas de filet de secours** (option A).
- **Délivrance en lot** optionnelle et bornée (2–10), secondaire, pour l'ouverture ; **liste matinale non importée** (pré-tri physique, absents non gérés — choix de simplicité assumé).
- Supervision intégrée (file + ETA global + promotion par numéro + profil d'accessibilité).

### 14.2 Évolutions possibles (hors v2)
- **Option B :** mini-borne de délivrance de tickets pour les absences de l'infirmière.
- **Push web** pour fiabiliser « partir et revenir ».
- Statistiques de fin de journée (attente moyenne, taux d'absences).
