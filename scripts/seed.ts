/**
 * Script de seed : crée un cabinet et un utilisateur infirmière par défaut.
 * Usage : npx tsx scripts/seed.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/infrastructure/prisma/client/client";
import { hash } from "argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  // Cabinet par défaut
  const cabinet = await db.cabinet.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      nom: "Cabinet Dr. Default",
      fuseau_horaire: "Africa/Casablanca",
      params: {},
    },
  });

  // Utilisateur infirmière par défaut
  const motDePasseHash = await hash("changeme123!");
  await db.user.upsert({
    where: { identifiant: "infirmiere" },
    update: {},
    create: {
      cabinet_id: cabinet.id,
      nom: "Infirmière",
      identifiant: "infirmiere",
      mot_de_passe_hash: motDePasseHash,
      role: "nurse",
    },
  });

  console.log("✅ Seed terminé");
  console.log("   Identifiant : infirmiere");
  console.log("   Mot de passe : changeme123!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
