-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('normal', 'urgent', 'acte_court');

-- CreateEnum
CREATE TYPE "TicketEtat" AS ENUM ('en_attente', 'appele', 'en_consultation', 'termine', 'absent', 'expire', 'annule');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('nurse', 'admin');

-- CreateTable
CREATE TABLE "cabinets" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "fuseau_horaire" TEXT NOT NULL DEFAULT 'Africa/Casablanca',
    "params" JSONB NOT NULL DEFAULT '{}',
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cabinets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "cabinet_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "identifiant" TEXT NOT NULL,
    "mot_de_passe_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'nurse',
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "cabinet_id" TEXT NOT NULL,
    "date_file" DATE NOT NULL,
    "numero" INTEGER NOT NULL,
    "type" "TicketType" NOT NULL DEFAULT 'normal',
    "etat" "TicketEtat" NOT NULL DEFAULT 'en_attente',
    "jeton_public" TEXT NOT NULL,
    "nom_prive" TEXT,
    "ordre" DECIMAL(10,4) NOT NULL,
    "grace_expire_le" TIMESTAMP(3),
    "nb_reintegrations" INTEGER NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appele_le" TIMESTAMP(3),
    "absent_le" TIMESTAMP(3),
    "debut_consult_le" TIMESTAMP(3),
    "fin_le" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_identifiant_key" ON "users"("identifiant");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_jeton_public_key" ON "tickets"("jeton_public");

-- CreateIndex
CREATE INDEX "tickets_cabinet_id_date_file_etat_ordre_idx" ON "tickets"("cabinet_id", "date_file", "etat", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_cabinet_id_date_file_numero_key" ON "tickets"("cabinet_id", "date_file", "numero");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_cabinet_id_fkey" FOREIGN KEY ("cabinet_id") REFERENCES "cabinets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_cabinet_id_fkey" FOREIGN KEY ("cabinet_id") REFERENCES "cabinets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
