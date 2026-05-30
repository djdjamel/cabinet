---
inclusion: always
---

# Convention d'architecture — séparation stricte UI / logique

Règle directrice du projet (non négociable) : **la logique métier est totalement séparée
de l'UI**, pour faciliter la maintenance, les tests et l'évolution.

## Couches (les dépendances pointent vers l'intérieur)

```
ui/  ──►  application/  ──►  domain/   ◄──  infrastructure/
(React)    (use-cases)      (règles pures)     (Prisma, TTS, QR…)
```

- **domain/** — Règles métier **pures** (ordre de la file, calcul de position, estimation
  du temps, machine à états du no-show, numérotation). Types et fonctions purs.
  **N'importe NI React, NI Next, NI Prisma, NI I/O.** Testable sans base de données.
- **application/** — Use-cases qui orchestrent le domaine via des **ports** (interfaces de
  dépôt). Pas de JSX, pas d'accès direct à la base.
- **infrastructure/** — Implémentations concrètes : dépôts Prisma, génération QR, TTS,
  impression. Aucune règle métier.
- **ui/** — Composants **présentables** + hooks. Reçoivent des données déjà calculées ;
  ne contiennent **aucune** règle métier.

## Règles concrètes

1. **Aucune règle métier dans un composant React ni dans un handler de route API.** Les
   routes API et les composants sont **minces** et délèguent aux use-cases.
2. `domain/` ne dépend d'aucun framework → testé en isolation (tests unitaires purs).
3. Les use-cases dépendent d'**interfaces** (ex. `TicketRepository`, `Clock`), jamais des
   implémentations → substituables et mockables.
4. Les composants UI ne recalculent pas la logique (position, fourchette d'attente déjà
   fournies par l'API/use-cases).

## Arborescence cible

```
src/
  domain/          # entités + règles pures
  application/     # use-cases + ports (interfaces)
  infrastructure/  # prisma/, tts/, qr/, print/ (adapters)
  ui/              # composants présentables + hooks
app/               # routes Next (minces) -> appellent application/
tests/             # tests unitaires domain/application (sans DB)
```

Voir `docs/design.md` §2 pour le détail.
