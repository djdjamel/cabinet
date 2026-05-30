/**
 * Tests unitaires — use-cases application/tickets/
 * Repositories mockés (interfaces), pas de base de données.
 */

import type { Ticket } from "../src/domain/queue";
import type { Clock, TicketRepository, TokenGenerator } from "../src/application/ports";
import { enregistrerPatient } from "../src/application/tickets/enregistrer-patient";
import { appelerTicket } from "../src/application/tickets/appeler-ticket";
import { marquerAbsent } from "../src/application/tickets/marquer-absent";
import { reintegrerPatient } from "../src/application/tickets/reintegrer-patient";
import { annulerTicket } from "../src/application/tickets/annuler-ticket";
import { expirerAbsents } from "../src/application/tickets/expirer-absents";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const NOW = new Date("2026-05-30T09:00:00Z");

const mockClock: Clock = { now: () => NOW };
const mockToken: TokenGenerator = { generate: () => "tok_abc123" };

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    cabinet_id: "cab1",
    date_file: new Date("2026-05-30"),
    numero: 1,
    type: "normal",
    etat: "en_attente",
    jeton_public: "tok_abc123",
    nom_prive: null,
    ordre: 1,
    grace_expire_le: null,
    nb_reintegrations: 0,
    cree_le: NOW,
    appele_le: null,
    absent_le: null,
    debut_consult_le: null,
    fin_le: null,
    ...overrides,
  };
}

function makeRepo(tickets: Ticket[] = [], created?: Ticket): TicketRepository {
  const store: Ticket[] = [...tickets];
  return {
    findById: jest.fn(async (id, cabinetId) =>
      store.find((t) => t.id === id && t.cabinet_id === cabinetId) ?? null
    ),
    findByJeton: jest.fn(async (jeton) =>
      store.find((t) => t.jeton_public === jeton) ?? null
    ),
    findTodayByCabinet: jest.fn(async () => store),
    getNextNumero: jest.fn(async () => store.length + 1),
    create: jest.fn(async (input) => created ?? makeTicket()),
    update: jest.fn(async (id, cabinetId, changes) => {
      const t = store.find((t) => t.id === id)!;
      return { ...t, ...changes };
    }),
    findAbsentsExpires: jest.fn(async () => []),
    findStaleTickets: jest.fn(async () => []),
    closeDay: jest.fn(async () => 0),
  };
}

// ─── enregistrerPatient ───────────────────────────────────────────────────────

describe("enregistrerPatient", () => {
  it("crée un ticket avec le bon type et le jeton", async () => {
    const repo = makeRepo();
    const result = await enregistrerPatient(
      { repo, clock: mockClock, token: mockToken },
      { cabinetId: "cab1", type: "normal", baseUrl: "http://localhost:3000" }
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "normal", jeton_public: "tok_abc123" })
    );
    expect(result.jetonUrl).toBe("http://localhost:3000/f/tok_abc123");
  });

  it("stocke le nom optionnel", async () => {
    const repo = makeRepo();
    await enregistrerPatient(
      { repo, clock: mockClock, token: mockToken },
      { cabinetId: "cab1", type: "normal", nom: "Ahmed", baseUrl: "http://localhost:3000" }
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ nom_prive: "Ahmed" })
    );
  });

  it("ticket urgent : ordre calculé via ordreUrgent", async () => {
    const enConsult = makeTicket({ id: "ec", ordre: 2, etat: "en_consultation" });
    const suivant = makeTicket({ id: "s", ordre: 4, etat: "en_attente" });
    const repo = makeRepo([enConsult, suivant]);

    await enregistrerPatient(
      { repo, clock: mockClock, token: mockToken },
      { cabinetId: "cab1", type: "urgent", baseUrl: "http://localhost:3000" }
    );

    const call = (repo.create as jest.Mock).mock.calls[0][0];
    expect(call.ordre).toBeGreaterThan(2);
    expect(call.ordre).toBeLessThan(4);
  });
});

// ─── appelerTicket ────────────────────────────────────────────────────────────

describe("appelerTicket", () => {
  it("passe en état 'appele' et enregistre l'horodatage", async () => {
    const ticket = makeTicket({ id: "t1", etat: "en_attente" });
    const repo = makeRepo([ticket]);

    await appelerTicket(repo, mockClock, "t1", "cab1");

    expect(repo.update).toHaveBeenCalledWith("t1", "cab1", {
      etat: "appele",
      appele_le: NOW,
    });
  });

  it("lève une erreur si le ticket n'est pas en_attente", async () => {
    const ticket = makeTicket({ id: "t1", etat: "en_consultation" });
    const repo = makeRepo([ticket]);

    await expect(appelerTicket(repo, mockClock, "t1", "cab1")).rejects.toThrow(
      "Transition invalide"
    );
  });
});

// ─── marquerAbsent ────────────────────────────────────────────────────────────

describe("marquerAbsent", () => {
  it("passe en 'absent' avec délai de grâce de 30 min", async () => {
    const ticket = makeTicket({ id: "t1", etat: "appele" });
    const repo = makeRepo([ticket]);

    await marquerAbsent(repo, mockClock, "t1", "cab1", 30);

    const updateCall = (repo.update as jest.Mock).mock.calls[0][2];
    expect(updateCall.etat).toBe("absent");
    const expectedExpire = new Date(NOW.getTime() + 30 * 60 * 1000);
    expect(updateCall.grace_expire_le).toEqual(expectedExpire);
  });
});

// ─── reintegrerPatient ────────────────────────────────────────────────────────

describe("reintegrerPatient", () => {
  it("réintègre un patient absent dans la file", async () => {
    const absent = makeTicket({ id: "ta", etat: "absent", nb_reintegrations: 0 });
    const t1 = makeTicket({ id: "t1", ordre: 1, etat: "en_attente" });
    const t2 = makeTicket({ id: "t2", ordre: 2, etat: "en_attente" });
    const t3 = makeTicket({ id: "t3", ordre: 3, etat: "en_attente" });
    const repo = makeRepo([absent, t1, t2, t3]);

    await reintegrerPatient(repo, mockClock, "ta", "cab1", 2, 1);

    const updateCall = (repo.update as jest.Mock).mock.calls[0][2];
    expect(updateCall.etat).toBe("en_attente");
    expect(updateCall.nb_reintegrations).toBe(1);
    expect(updateCall.grace_expire_le).toBeNull();
  });

  it("refuse si le garde-fou anti-abus est atteint", async () => {
    const absent = makeTicket({ id: "ta", etat: "absent", nb_reintegrations: 1 });
    const repo = makeRepo([absent]);

    await expect(
      reintegrerPatient(repo, mockClock, "ta", "cab1", 2, 1)
    ).rejects.toThrow("Nombre maximal de réintégrations atteint");
  });
});

// ─── expirerAbsents ───────────────────────────────────────────────────────────

describe("expirerAbsents", () => {
  it("expire les absents dont le délai est dépassé", async () => {
    const expiredAbsent = makeTicket({
      id: "ta",
      cabinet_id: "cab1",
      etat: "absent",
      grace_expire_le: new Date(NOW.getTime() - 1000), // expiré il y a 1s
    });
    const repo = makeRepo([expiredAbsent]);
    (repo.findAbsentsExpires as jest.Mock).mockResolvedValue([expiredAbsent]);

    const count = await expirerAbsents(repo, mockClock);

    expect(count).toBe(1);
    expect(repo.update).toHaveBeenCalledWith("ta", "cab1", {
      etat: "expire",
      fin_le: NOW,
    });
  });

  it("ne touche pas aux absents dont le délai n'est pas écoulé", async () => {
    const repo = makeRepo();
    // findAbsentsExpires retourne [] par défaut

    const count = await expirerAbsents(repo, mockClock);

    expect(count).toBe(0);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

// ─── annulerTicket ────────────────────────────────────────────────────────────

describe("annulerTicket", () => {
  it("annule un ticket en_attente", async () => {
    const ticket = makeTicket({ id: "t1", etat: "en_attente" });
    const repo = makeRepo([ticket]);

    await annulerTicket(repo, mockClock, "t1", "cab1");

    expect(repo.update).toHaveBeenCalledWith("t1", "cab1", {
      etat: "annule",
      fin_le: NOW,
    });
  });

  it("refuse d'annuler un ticket en_consultation", async () => {
    const ticket = makeTicket({ id: "t1", etat: "en_consultation" });
    const repo = makeRepo([ticket]);

    await expect(annulerTicket(repo, mockClock, "t1", "cab1")).rejects.toThrow(
      "Impossible d'annuler"
    );
  });
});
