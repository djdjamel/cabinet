# Le parcours utilisateur, expliqué simplement

> Document compagnon de `design_file.md` (v2), mais **sans technique** : il raconte qui fait quoi, ce que vit le patient, et comment les éléments se parlent. À lire par n'importe qui (médecin, infirmière, patient, décideur).

---

## 1. L'idée en une phrase

C'est comme le **ticket numéroté** d'une administration… sauf que **votre ticket vous suit sur votre téléphone** (numéro, nombre de personnes devant, temps estimé) — et que tout est orchestré par **une seule personne : l'infirmière de l'accueil**.

---

## 2. Les acteurs (qui fait quoi)

### Les personnes
- **Le patient** — il reçoit un ticket, attend, est appelé à l'accueil, puis entre chez le médecin.
- **L'infirmière (l'accueil)** — la **chef d'orchestre**. Elle délivre les tickets, fait avancer la file, enregistre les patients (sur le logiciel habituel du cabinet) et gère les absents. **Tout passe par elle.**
- **Le médecin** — il **ne touche à rien**. Il consulte, c'est tout. Le système le considère comme « le service » dont bénéficie le patient.

### Les outils
- **L'écran de l'infirmière** + une **petite imprimante** à tickets. (Il n'y a **plus de borne** en libre-service : c'est plus économique, et ça empêche les tickets abusifs.)
- **Le smartphone du patient** — après avoir scanné le QR de son ticket, il voit sa position et le temps estimé, en direct.
- **L'écran TV de la salle** — montre le numéro appelé, pour ceux qui n'ont pas de téléphone.
- **Le « cerveau »** — le programme invisible qui garde la liste, calcule l'ordre, déclenche les annonces et le compte à rebours.

> 💡 **Principe clé :** le système ne connaît que des **numéros**, pas des personnes. Le nom n'apparaît qu'en exception, pour aider certains patients (scénario B).

---

## 3. Le secret du système : la « file à trois places »

Au lieu d'enregistrer tout le monde dès l'arrivée (long, et inutile pour ceux qui repartent), le système fonctionne comme un **tapis roulant à trois zones** :

1. **En attente** — vous avez un ticket, mais vous n'êtes pas encore enregistré.
2. **Sur le pont** — c'est bientôt votre tour (vous êtes dans les **2 prochains**). L'infirmière vous appelle à l'accueil et **vous enregistre maintenant**, pendant que le médecin termine avec quelqu'un d'autre.
3. **En consultation** — vous êtes chez le médecin.

Pourquoi c'est malin :
- **On gagne du temps** : l'enregistrement se fait *pendant* la consultation du précédent, donc il ne ralentit personne.
- **On n'enregistre que les présents** : ceux qui repartent avant leur tour n'encombrent jamais le logiciel du cabinet.
- **Le médecin ne subit jamais une absence** : quand vous arrivez chez lui, vous êtes forcément déjà là et enregistré.

---

## 4. Le parcours type, étape par étape

Prenons **Sami**, qui arrive au cabinet :

1. **Il se présente à l'accueil.** L'infirmière lui délivre, d'un seul geste, un **ticket** : numéro **142**, avec un QR code. (Elle ne lui demande rien d'autre pour l'instant.)
2. **Il scanne le QR** avec son téléphone → *« N° 142 — 3 personnes devant vous — environ 32 min. »*
3. **Il va s'asseoir** (ou sort prendre l'air) et suit sa progression. Le nombre devant lui diminue.
4. **Quand son tour approche**, sa page **passe à l'orange**.
5. **Il devient « sur le pont »** : la TV et une voix annoncent *« Numéro 142, présentez-vous à l'accueil »*. Sami va au bureau ; l'infirmière l'**enregistre** (pendant que le médecin finit la consultation précédente).
6. **Le médecin se libère** (l'infirmière le voit, et le patient précédent ressort) : elle clique **« Suivant »**. Sami **entre en consultation**, et le patient précédent est automatiquement clôturé.
7. **À la fin**, Sami ressort, repasse devant le bureau — ce qui signale à l'infirmière que le médecin est de nouveau libre pour le suivant.

Aucune inscription en ligne, aucun compte, aucune application à installer. Et le médecin n'a appuyé sur aucun bouton.

---

## 5. Les scénarios particuliers

### A. « Je n'ai pas de smartphone » (personne âgée, batterie vide…)
Pas de problème. Le patient garde son **ticket papier** et **surveille la TV**. La voix annonce chaque numéro appelé à l'accueil. Il attend dans la salle.
*Limite honnête :* sans téléphone, il ne peut pas s'éloigner — il doit rester à portée de la TV.

### B. « Je ne sais pas lire » ou « je vois mal »
En lui délivrant son ticket, l'infirmière ajoute discrètement **son prénom**. À son tour, l'annonce devient *« Numéro 142, Madame Fatima »*. Entendre son nom est plus sûr qu'un numéro. *(Le nom sert seulement à l'annonce, n'apparaît jamais sur la grande TV, et disparaît en fin de journée.)*

### C. « Je me sens vraiment très mal » (urgence)
L'infirmière pose le badge **Urgent** sur son ticket (ou le fait passer urgent **d'un tap sur son écran**, par son numéro, sans se lever). Il passera avant les patients normaux.
*(Les urgences vitales ne passent pas par la file : on va directement en salle de soins.)*

### D. « J'ai raté mon appel, mais je reviens »
Sami n'était pas là quand on l'a appelé à l'accueil. L'infirmière a cliqué **« Absent »** : il a **30 minutes** pour revenir. À son retour, l'infirmière le **réinsère** et il **reprend sa place naturelle** dans la file.

### E. « J'ai raté mon appel et je ne suis pas revenu »
Si les 30 minutes passent, son ticket est **automatiquement annulé**. La file ne reste pas bloquée.

### F. Le médecin a besoin de souffler (pause)
Le médecin vient de finir mais doit **rédiger une ordonnance** ou s'absenter 3 minutes. **L'infirmière attend simplement avant de cliquer « Suivant ».** Personne n'entre dans un bureau vide. Aucun bouton spécial : la pause, c'est juste un clic différé.

### G. « Le bruit et l'attente en salle me sont pénibles » (sensibilité sensorielle)
L'infirmière active le **mode silencieux** : pas d'annonce vocale ni d'affichage public pour ce patient. Il est prévenu **uniquement sur son téléphone** et peut attendre au calme.

### H. « Pourquoi mon rang a-t-il reculé ? »
Si une urgence passe devant, le compteur peut augmenter : **l'application est honnête** et prévient que l'estimation peut bouger. Et quand un patient « de retour » (réinséré) est appelé, un **symbole « ↩ retour »** explique pourquoi un ancien numéro réapparaît — pas de mystère, pas de soupçon de bug.

### I. « L'infirmière s'est absentée » (limite assumée)
Comme tout passe par elle, **quand elle quitte son bureau, le système se met en pause** : pas de nouveau ticket, la file n'avance pas. Dans un petit cabinet, c'est acceptable (le médecin aussi fait une pause). C'est un choix volontaire pour rester simple et économique.

### J. L'ouverture du matin (et la « liste sur la porte »)
Dans certains cabinets, des gens s'inscrivent sur une liste affichée à la porte avant l'ouverture. L'application ne reprend pas cette liste : elle reste un **arrangement entre les gens, sur le papier**. À 8h, le petit groupe présent se range dans l'ordre, et l'infirmière peut **délivrer plusieurs tickets d'un coup** (entre 2 et 10) pour aller vite — chacun repart avec son numéro et son QR, dans l'ordre. C'est une **commodité optionnelle**, pas la façon principale de faire.

Et les inscrits qui ne sont **pas là** à l'ouverture ? Ils prendront simplement un ticket **à leur arrivée réelle**, comme tout le monde. Ils perdent la position gagnée à l'aube — ce qui est juste, et décourage gentiment l'habitude de venir très tôt.

---

## 6. Qui parle à qui (les interactions)

```
   PATIENT
     │ se présente / ressort
     v
  INFIRMIERE  ───────────────►  CERVEAU  ───────────────►  ANNONCES
 (delivre ticket,             (chef d'              +-----------+-----------+
  "Suivant", "Absent",        orchestre)            v                       v
  reinsertion, enregistre)        |          TELEPHONE du patient       TV de la salle
                                  |          (position + temps)         (numero + voix)
   MEDECIN                        |
 (consulte, ne touche a rien) ----+ <- l'infirmiere VOIT la porte se liberer
```

En clair :
- **L'infirmière** dit au cerveau : « nouveau ticket », « au suivant », « celui-ci est absent », « urgent », « il revient ».
- **Le médecin** ne dit rien : c'est l'infirmière qui **voit** la fin de consultation (porte + patient qui ressort).
- **Le cerveau** décide qui passe et envoie l'info **au téléphone du patient et à la TV** en temps réel.

---

## 7. Ce que chacun voit / fait

| Acteur | Ce qu'il voit | Ce qu'il fait |
|---|---|---|
| **Patient (téléphone)** | Numéro, personnes devant, temps estimé, couleur qui change | Rien — il suit, puis se présente quand appelé |
| **Patient (sans téléphone)** | La TV : numéro en cours + prochains | Écoute la voix, regarde la TV |
| **Infirmière** | La file, qui enregistrer maintenant, le temps d'attente du jour | Délivre les tickets, clique « Suivant », enregistre, gère absents/urgences |
| **Médecin** | *(rien du système)* | Consulte |

---

## 8. Pourquoi c'est « zéro friction »

- **Pour le patient :** rien à installer, il peut s'éloigner, il sait combien de temps il en a.
- **Pour le médecin :** **aucune** manipulation — il consulte, point.
- **Pour l'infirmière :** un rythme simple (à chaque consultation, enregistrer le prochain) et **un seul bouton** pour faire avancer la file ; l'appli lui dit qui appeler.
- **Pour le cabinet :** moins de matériel (plus de borne), pas de double saisie, pas de données sensibles dans ce système (que des numéros).
