# Spécification de référence — Application de gestion de file d'attente patients

> **Document de référence** issu de la phase de cadrage. Il fait foi pour le périmètre,
> les règles métier et les paramètres par défaut. Il reste vivant : toute évolution passe
> par une mise à jour de ce fichier.

---

## 1. Problème & vision

**Constat.** Dans notre contexte local, les cabinets de médecins réputés sont engorgés.
La prise de rendez-vous se fait sur place : le patient se présente, l'infirmière
l'enregistre dans une liste sur son PC, puis le patient attend son tour dans une salle
souvent trop petite — parfois debout à l'extérieur du cabinet.

**Vision.** Une application qui **dématérialise l'attente**. Chaque patient reçoit un
**numéro** et un **QR code**. En scannant ce QR avec son propre téléphone, il accède à
une page web qui affiche **en temps réel** l'avancement de la file. Il peut donc
s'éloigner et revenir au bon moment, sans perdre sa place.

**Bénéfices visés :**
- Désengorger la salle d'attente.
- Réduire le stress et l'incertitude du patient ("dans combien de temps ?").
- Donner à l'infirmière un outil simple pour piloter la file.

---

## 2. Périmètre

### Objectifs de la V1
- Un **cabinet** unique en exploitation, **un seul médecin**.
- L'**infirmière** pilote seule la file.
- Fonctionnement **premier arrivé, premier servi** (FCFS).
- Gestion des **exceptions** (urgences, actes courts) à la main de l'infirmière.
- **QR par patient** : livré à l'écran **et** sur ticket imprimé.
- Page patient **temps réel** affichant la **position** (et non un simple numéro).
- **Affichage bilingue arabe + français** (ticket et page patient).
- **Estimation du temps d'attente affichée dès la V1** (fourchette).
- Gestion du **no-show avec délai de grâce**.

### Non-objectifs de la V1 (volontairement reportés)
- Prise de rendez-vous à l'avance / planning horaire.
- Plusieurs médecins ou plusieurs files par cabinet.
- Comptes patients, historique médical, dossier patient.
- Paiement, facturation.
- Notification active du patient (SMS / push web).

### Conçu pour évoluer
Même si la V1 sert **un seul cabinet**, le modèle de données est **multi-cabinet dès le
départ** (voir §11) afin d'éviter une migration douloureuse plus tard.

---

## 3. Acteurs

| Acteur | Rôle | Interface |
|---|---|---|
| **Patient** | Scanne son QR, consulte l'état de la file. Aucune installation, aucun compte. | Page web publique (mobile) |
| **Infirmière** | Enregistre les arrivants, attribue numéro + QR, fait avancer la file, gère les exceptions. | Tableau de bord (PC du cabinet) |
| **Médecin** | (V1) N'utilise pas l'outil directement. Évolution possible : bouton "patient suivant". | — |
| **Administrateur** | (Multi-cabinet, plus tard) Crée et gère les cabinets et leurs comptes ; supervise métriques & erreurs. | Back-office |

---

## 4. Parcours utilisateur

### 4.1 Parcours patient
1. Le patient arrive au cabinet.
2. L'infirmière l'enregistre (type + **nom optionnel**) → le système crée un **ticket**
   avec un **numéro** et un **lien unique** (jeton aléatoire non devinable).
3. Le lien est présenté en **QR code** : affiché à l'écran de l'infirmière **et** imprimé
   sur un petit ticket papier (bilingue).
4. Le patient scanne le QR avec **son téléphone** → il "capture" son lien personnel.
5. Sa page (bilingue) affiche : son numéro, le numéro en cours, **le nombre de personnes
   devant lui**, l'**estimation du temps d'attente**, et l'état de son ticket. La page
   **se met à jour automatiquement**.
6. Le patient peut s'éloigner ; il revient quand son compteur approche de 0.
7. Quand c'est son tour, l'infirmière "appelle" le ticket → la page passe en mode
   « C'est à vous » (+ annonce vocale bilingue optionnelle dans la salle).

### 4.2 Parcours infirmière
1. Ouverture de la journée : file vide.
2. À chaque arrivée : bouton **"Nouveau patient"** → choix du **type** (normal / urgent /
   acte court) + **nom optionnel** → génération numéro + QR (écran + impression).
3. Vue principale : la **liste ordonnée** des patients, avec leur état ; une **section
   repliable "Absents (en délai)"** (chronos de grâce — §7.4).
4. Actions sur la file :
   - **Appeler le suivant** (→ *appelé*).
   - **Démarrer / Terminer** la consultation.
   - **Marquer absent** (no-show) → entre dans le délai de grâce (§7.4).
   - **Réintégrer** un absent revenu dans les délais.
   - **Annuler** un ticket.
   - **Réordonner** (drag & drop) / **faire passer en priorité**.
   - **Assigner / modifier le nom** à tout moment en cliquant sur le numéro d'un patient.
5. Fermeture de la journée : tickets restants clôturés ; remise à zéro le lendemain.

---

## 5. Concept central — Numéro ≠ Position

> **Le numéro du patient n'est pas sa position dans la file.**

- **Numéro de ticket** : attribué à l'arrivée, dans l'ordre chronologique. **Permanent**.
  C'est l'identité que le patient retient ("je suis le 12").
- **Position** : « il reste N personnes avant vous ». **Calculée dynamiquement**, elle
  peut évoluer (notamment lors d'une insertion d'urgence).

**Pourquoi c'est fondamental :** la page patient affiche la **position** ("3 personnes
avant vous"), pas une comparaison de numéros. Ainsi, quand l'infirmière intercale une
urgence, le compteur passe simplement de 3 à 4 — c'est honnête, lisible, et **ça absorbe
les exceptions sans casser le modèle mental du patient**.

---

## 6. Cycle de vie d'un ticket (états)

```
          ┌─────────────┐
          │  en_attente │  ◄── création (numéro + QR)
          └──────┬──────┘
                 │ infirmière : "appeler"
                 ▼
          ┌─────────────┐
          │   appelé    │  ── annonce vocale / "C'est à vous" sur la page patient
          └──────┬──────┘
        ┌────────┼─────────────┐
        │ entrée │ non présent │
        ▼        │             ▼
 ┌──────────────┐│      ┌──────────────────────┐
 │ en_consultation │    │  absent (délai grâce) │── compte à rebours (30 min)
 └──────┬───────┘ │     └──────┬──────────┬─────┘
        │ fin     │            │ revient  │ délai écoulé
        ▼         │            ▼          ▼
 ┌─────────────┐  │   (réintégré à      ┌─────────┐
 │  terminé    │  │    +2 positions)    │ expiré  │ ── doit se réenregistrer
 └─────────────┘  │     → en_attente    └─────────┘
                  │
  Transition transverse depuis en_attente / appelé :
   • annulé   (le patient part)
```

---

## 7. Règles métier

### 7.1 Ordre par défaut
**Premier arrivé, premier servi** : l'ordre suit l'horodatage d'arrivée des tickets
`normal`.

### 7.2 Exceptions — l'humain décide, l'outil facilite
On **ne code pas** de règle automatique rigide. L'infirmière garde la main sur l'ordre ;
le **type** ne fait que suggérer un placement et colorer le ticket.

- **Urgent** : position **par défaut = "juste après le patient en cours"**, l'infirmière
  pouvant **réaffecter manuellement**. Les patients derrière voient leur compteur monter
  de 1, **silencieusement**.
- **Acte court** (lecture de bilan, renouvellement, signature…) : interaction brève,
  glissée entre deux consultations ; durée courte connue → ne fausse pas l'estimation.

### 7.3 Stratégie anti-frustration (principe directeur)
- On affiche une **position** honnête, jamais une comparaison de numéros.
- Les insertions d'urgence sont **silencieuses** (le compteur monte, sans explication).
- Aucun nom n'apparaît jamais sur l'**écran commun** ni dans l'**annonce vocale**.

### 7.4 Patient absent (no-show) — délai de grâce
Deux temporisations distinctes :

1. **Fenêtre de réponse à l'appel** *(manuelle)* : après "appeler", l'infirmière décide
   quand cliquer **"absent"** si le patient ne se présente pas.
2. **Délai de grâce** *(automatique, configurable — défaut **30 min**)* : démarre au
   passage en `absent`. **Compte à rebours individuel** affiché.

Règles associées :
- **Pendant le délai, le patient conserve son numéro.** S'il revient, l'infirmière clique
  **"réintégrer"** → réinséré **après les N prochains patients** (N configurable, **défaut
  = 2** ; ajustable manuellement).
- **À l'expiration** (chrono = 0) : passage **automatique** en `expiré` → le patient doit
  **se réenregistrer** (nouveau numéro, en fin de file).
- **Garde-fou anti-abus : ACTIVÉ par défaut** → **1 seule réintégration** ; au 2ᵉ no-show,
  réenregistrement obligatoire. (Désactivable dans les paramètres.)
- **Côté patient** : message clair + **compte à rebours en direct** (« présentez-vous dans
  28:45, sinon réenregistrement »).
- **Côté infirmière** : section repliable **"Absents (en délai)"** sous la file, chronos.

### 7.5 Annulation
Un patient qui part est retiré de la file par l'infirmière ; les positions se recalculent.

### 7.6 Remise à zéro quotidienne
Les numéros repartent **à 1 chaque jour, par cabinet**. L'unicité globale d'un ticket est
garantie par son **jeton aléatoire** (lien/QR), pas par le numéro.

---

## 8. Fonctionnalités

### Indispensables (V1)
- Enregistrement d'un patient → numéro + lien/QR (+ nom optionnel).
- Affichage du QR à l'écran **et** impression d'un ticket bilingue.
- Tableau de bord infirmière : liste ordonnée, états, actions (appeler, démarrer,
  terminer, absent, réintégrer, annuler, réordonner, assigner un nom), section "Absents
  (en délai)".
- Page patient temps réel **bilingue** (position, numéro en cours, **estimation du
  temps**, état, chrono no-show).
- **Estimation du temps d'attente** (fourchette) — §9.
- Isolation par cabinet (multi-tenant côté données).

### Modules optionnels (activables par cabinet)
- **Écran d'affichage commun** en salle d'attente (numéro en cours en grand ; numéros
  seulement, jamais de nom).
- **Annonce vocale bilingue** (arabe puis français), déclenchée par "appeler".
- **Métriques tableau de bord** (§12.1).

### Nice to have (plus tard)
- Notification active du patient (SMS / push web) quand son tour approche.

---

## 9. Temps réel & estimation du temps

**Temps réel.** Deux approches :
- **Polling léger** : la page redemande l'état toutes les ~5–10 s. Simple, robuste,
  **suffisant**. → **Retenu pour la V1.**
- **Push (WebSocket / SSE)** : instantané, plus complexe. → évolution possible.

**Estimation du temps (affichée dès la V1).**
- Champ **durée moyenne de consultation** par cabinet, **configurable**.
- **Auto-ajustable** sur les **métriques réelles** (horodatages des tickets terminés).
- Pondérée par le nombre de personnes devant et le **type** des tickets (l'acte court
  pèse moins).
- Présentée en **fourchette** ("≈ 20–30 min") pour ne pas promettre une heure précise.

---

## 10. QR code, livraison & bilinguisme

### 10.1 QR code
- **Un QR par patient**, encodant `<BASE_URL>/f/<jeton_aléatoire>` (URL de base
  **configurable** — pas de domaine fixe pour le moment, voir `docs/design.md` §4).
- Jeton aléatoire, long, non devinable ; **expirant en fin de journée**.
- Livraison **double** : écran de l'infirmière + **ticket imprimé** sur **imprimante
  thermique (58 mm)** au poste.
- **Repli sans smartphone** : ticket papier (numéro) + écran de salle / annonce vocale.

### 10.2 Affichage bilingue (arabe + français)
- **Ticket** et **page patient** affichent les deux langues **simultanément**.
- Arabe **RTL** + français **LTR** → mise en page gérant les deux directions (blocs
  distincts, attribut `dir` adapté par bloc).
- **Chiffres : occidentaux (0-9).** *(décidé)*

### 10.3 Annonce vocale bilingue (optionnelle)
- Déclenchée par "appeler" (clic = geste utilisateur → contourne le blocage autoplay).
- **Ordre : arabe puis français** *(décidé)*, chaque énoncé avec la voix/le moteur adapté.
- N'énonce **que le numéro**, jamais le nom.

---

## 11. Architecture multi-cabinet (multi-tenant)

**Principe :** modèle de données multi-cabinet **dès le jour 1**, expérience mono-cabinet
en V1.
- Chaque entité (ticket, file, compte, paramètres) porte un **`cabinet_id`**.
- Files **isolées par cabinet** ; isolation **appliquée et testée côté serveur** (faille
  classique du multi-tenant — §14).
- Le lien/QR rattache implicitement le ticket à son cabinet.
- Passer au multi-cabinet = ajouter **onboarding** + **gestion des comptes**, sans refonte.

---

## 12. Métriques & observabilité

### 12.1 Métriques cabinet (tableau de bord, activables)
Calculées à partir des horodatages déjà stockés :
- Patients vus aujourd'hui / en attente maintenant.
- **Temps d'attente moyen réel** du jour.
- **Durée moyenne de consultation réelle** (alimente l'auto-ajustement de l'estimation).
- No-shows / annulations du jour.
- **Débit** (patients/heure) et heure de pointe.
- Plus longue attente en cours.

### 12.2 Métriques plateforme (multi-cabinet, plus tard)
- Cabinets actifs, volume total de tickets, taux d'adoption.
- **Disponibilité (uptime)**, latence, **taux d'erreur**.
- Usage des modules optionnels.

### 12.3 Rapports d'erreurs & observabilité
- Capture des erreurs **navigateur** (page patient + dashboard) et **serveur**.
- **Logs structurés** + alertes ; **expurgation de toute donnée personnelle**.

---

## 13. Connectivité & mode dégradé

- Connexion **généralement bonne**, mais cas **médiocres** prévus.
- **Page patient** : ultra-légère (n'échange que des numéros), **polling avec reconnexion**
  automatique, affiche "reconnexion…" plutôt que de casser.
- **Tableau de bord** (critique) : robuste aux coupures réseau (ré-essais) ; à terme,
  étudier un **mode local-first / PWA**.
- N'échanger **que des numéros** rend le produit naturellement résilient.

---

## 14. Sécurité & confidentialité

- **Anonymat public** : la page patient n'expose que des **numéros** via un **jeton
  aléatoire non devinable**, **expirant** en fin de journée.
- **Aucune donnée de santé** stockée ; **minimisation des données**.
- **Nom du patient** : **optionnel**, saisissable à la création **ou à tout moment** (clic
  sur le numéro). Affiché **par défaut** sur le **tableau de bord** et la **page perso du
  patient** (sa propre donnée). **Désactivable** via un réglage. **Jamais** affiché sur
  l'**écran commun** ni énoncé par la **voix** (surfaces visibles/audibles par tous).
- **Isolation multi-tenant stricte** par `cabinet_id`, **testée explicitement**.
- **Authentification infirmière** robuste (mots de passe hashés, sessions ; 2FA plus tard).
- **HTTPS partout** ; **rate limiting** sur les endpoints publics.
- **Sauvegardes** + **politique de rétention** (purge des tickets après X jours).

---

## 15. Paramètres de cabinet (valeurs par défaut)

| Paramètre | Défaut | Configurable |
|---|---|---|
| Durée moyenne de consultation (estimation) | 15 min | Oui (auto-ajustée) |
| Délai de grâce no-show | **30 min** | Oui |
| Décalage de réintégration (N) | **2 patients** | Oui |
| Garde-fou anti-abus no-show | **Activé** (1 réintégration) | Oui |
| Affichage du nom (dashboard + page perso) | **Activé** | Oui |
| Chiffres | **Occidentaux (0-9)** | — |
| Annonce vocale | Désactivée (module) ; ordre **AR → FR** | Oui |
| Écran de salle | Désactivé (module) | Oui |
| Métriques dashboard | Désactivées (module) | Oui |

---

## 16. Modèle de données (ébauche)

> Affiné dans le document de conception (`docs/design.md`). `cabinet_id` présent partout.

**Cabinet** : `id`, `nom`, `fuseau_horaire`, + paramètres (§15).
**Utilisateur** : `id`, `cabinet_id`, `nom`, identifiants (mot de passe hashé), `role`.
**Ticket** :
- `id`, `cabinet_id`, `date_file`, `numero` (séquence par cabinet/jour)
- `type` : `normal | urgent | acte_court`
- `etat` : `en_attente | appelé | en_consultation | terminé | absent | expiré | annulé`
- `jeton_public` (aléatoire, expirant), `nom_prive` (optionnel)
- `ordre` (position explicite), `grace_expire_le`, `nb_reintegrations`
- horodatages : `cree_le`, `appele_le`, `absent_le`, `debut_consult_le`, `fin_le`

---

## 17. Contraintes du contexte local

- **Hébergement** : **auto-hébergé au cabinet** (Docker), pas de cloud. URL de base des
  liens/QR **configurable** ; accessibilité réseau des patients à arbitrer (`docs/design.md` §4).
- **Connexion** : qualité internet du cabinet + data patients (mode dégradé — §13).
- **Langue** : ticket, page et annonce **bilingues arabe + français**.
- **Smartphone** : repli ticket papier + écran/voix pour ceux qui n'en ont pas.
- **Matériel** : PC infirmière + **imprimante thermique (58 mm)**. Écran de salle et
  haut-parleur optionnels. Annonce vocale **100 % locale** (clips pré-générés).

---

## 18. Phases

- **Phase 0 — Cadrage** *(terminée)* : ce document.
- **Phase 1 — Conception** *(en cours)* : `docs/design.md` — choix techniques, modèle de
  données détaillé, API, maquettes des écrans.
- **Phase 2 — V1 mono-cabinet** : enregistrement, QR bilingue, dashboard (dont no-show),
  page temps réel bilingue, estimation du temps.
- **Phase 3 — Modules optionnels** : écran de salle, annonce vocale, métriques cabinet.
- **Phase 4 — Multi-cabinet** : onboarding, comptes, back-office, métriques plateforme.
