/**
 * Test d'isolation multi-tenant (Lot 1.9)
 * Vérifie qu'un cabinet ne peut pas voir les tickets d'un autre cabinet.
 * Ces tests valident la règle critique : toujours filtrer par cabinet_id côté serveur.
 */

import { filterTicketsByCabinet } from "../src/domain/queue";

describe("Isolation multi-tenant", () => {
  const cabinetA = "cabinet-a-uuid";
  const cabinetB = "cabinet-b-uuid";

  const tickets = [
    { id: "1", cabinet_id: cabinetA, numero: 1 },
    { id: "2", cabinet_id: cabinetA, numero: 2 },
    { id: "3", cabinet_id: cabinetB, numero: 1 },
  ];

  it("filtre uniquement les tickets du cabinet A", () => {
    const result = filterTicketsByCabinet(tickets, cabinetA);
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.cabinet_id === cabinetA)).toBe(true);
  });

  it("filtre uniquement les tickets du cabinet B", () => {
    const result = filterTicketsByCabinet(tickets, cabinetB);
    expect(result).toHaveLength(1);
    expect(result[0].cabinet_id).toBe(cabinetB);
  });

  it("retourne une liste vide pour un cabinet inexistant", () => {
    const result = filterTicketsByCabinet(tickets, "cabinet-inconnu");
    expect(result).toHaveLength(0);
  });
});
