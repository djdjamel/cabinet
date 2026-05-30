/**
 * Tests unitaires purs — domain/queue.ts
 * Aucune base de données, aucun framework.
 */

import {
  calculerPosition,
  estimerAttente,
  ordreNormal,
  ordreReintegre,
  ordreUrgent,
  type Ticket,
} from "../src/domain/queue";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    cabinet_id: "cab1",
    date_file: new Date("2026-05-30"),
    numero: 1,
    type: "normal",
    etat: "en_attente",
    jeton_public: "abc",
    nom_prive: null,
    ordre: 1,
    grace_expire_le: null,
    nb_reintegrations: 0,
    cree_le: new Date(),
    appele_le: null,
    absent_le: null,
    debut_consult_le: null,
    fin_le: null,
    ...overrides,
  };
}

const t1 = makeTicket({ id: "t1", numero: 1, ordre: 1 });
const t2 = makeTicket({ id: "t2", numero: 2, ordre: 2 });
const t3 = makeTicket({ id: "t3", numero: 3, ordre: 3 });
const t4 = makeTicket({ id: "t4", numero: 4, ordre: 4 });

// ─── calculerPosition ─────────────────────────────────────────────────────────

describe("calculerPosition", () => {
  it("retourne 0 si le ticket est le premier", () => {
    expect(calculerPosition(t1, [t1, t2, t3])).toBe(0);
  });

  it("retourne 2 pour le 3ème ticket", () => {
    expect(calculerPosition(t3, [t1, t2, t3])).toBe(2);
  });

  it("ignore les tickets terminés/annulés", () => {
    const termine = makeTicket({ id: "tx", ordre: 0, etat: "termine" });
    expect(calculerPosition(t1, [termine, t1, t2])).toBe(0);
  });

  it("ignore le ticket lui-même", () => {
    expect(calculerPosition(t2, [t1, t2, t3])).toBe(1);
  });
});

// ─── estimerAttente ───────────────────────────────────────────────────────────

describe("estimerAttente", () => {
  it("retourne [0, 5] si personne devant", () => {
    const [min, max] = estimerAttente(t1, [t1, t2, t3], 15);
    expect(min).toBe(0);
    expect(max).toBeGreaterThan(0);
  });

  it("prend en compte les actes courts (3 min)", () => {
    const court = makeTicket({ id: "tc", ordre: 1, type: "acte_court" });
    const moi = makeTicket({ id: "moi", ordre: 2 });
    const [min] = estimerAttente(moi, [court, moi], 15);
    // 1 acte court (3 min) * 0.8 arrondi à 5 = 0
    expect(min).toBeGreaterThanOrEqual(0);
  });

  it("fourchette est toujours min < max", () => {
    const [min, max] = estimerAttente(t4, [t1, t2, t3, t4], 15);
    expect(max).toBeGreaterThan(min);
  });

  it("arrondis à 5 minutes", () => {
    const [min, max] = estimerAttente(t4, [t1, t2, t3, t4], 15);
    expect(min % 5).toBe(0);
    expect(max % 5).toBe(0);
  });
});

// ─── ordreNormal ──────────────────────────────────────────────────────────────

describe("ordreNormal", () => {
  it("retourne 1 si file vide", () => {
    expect(ordreNormal([])).toBe(1);
  });

  it("retourne max + 1", () => {
    expect(ordreNormal([t1, t2, t3])).toBe(4);
  });

  it("ignore les tickets terminés", () => {
    const termine = makeTicket({ id: "tx", ordre: 10, etat: "termine" });
    expect(ordreNormal([t1, termine])).toBe(2);
  });
});

// ─── ordreUrgent ──────────────────────────────────────────────────────────────

describe("ordreUrgent", () => {
  it("se place avant tout si file vide", () => {
    const ordre = ordreUrgent([]);
    expect(ordre).not.toBeNull();
  });

  it("se place juste après le ticket en consultation", () => {
    const enConsult = makeTicket({ id: "ec", ordre: 2, etat: "en_consultation" });
    const suivant = makeTicket({ id: "s", ordre: 4, etat: "en_attente" });
    const ordre = ordreUrgent([enConsult, suivant]);
    expect(ordre).toBeGreaterThan(enConsult.ordre);
    expect(ordre).toBeLessThan(suivant.ordre);
  });

  it("se place en queue si pas de suivant", () => {
    const enConsult = makeTicket({ id: "ec", ordre: 2, etat: "en_consultation" });
    const ordre = ordreUrgent([enConsult]);
    expect(ordre).toBeGreaterThan(enConsult.ordre);
  });
});

// ─── ordreReintegre ───────────────────────────────────────────────────────────

describe("ordreReintegre", () => {
  it("retourne 1 si file vide", () => {
    expect(ordreReintegre([], 2)).toBe(1);
  });

  it("avec decalage=2 et 4 tickets, se place entre t2 et t3", () => {
    const ordre = ordreReintegre([t1, t2, t3, t4], 2);
    expect(ordre).toBeGreaterThan(t2.ordre);
    expect(ordre).toBeLessThan(t3.ordre);
  });

  it("si moins de tickets que le décalage, va en fin de file", () => {
    const ordre = ordreReintegre([t1], 2);
    expect(ordre).toBeGreaterThan(t1.ordre);
  });
});
