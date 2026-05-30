import { notFound } from "next/navigation";
import { PatientView } from "@ui/patient/patient-view";
import { prismaTicketRepository } from "@infrastructure/prisma/ticket-repository";

type Props = { params: Promise<{ jeton: string }> };

export default async function PagePatient({ params }: Props) {
  const { jeton } = await params;

  // Vérification rapide côté serveur (le composant client re-vérifie via l'API)
  const ticket = await prismaTicketRepository.findByJeton(jeton);
  if (!ticket) notFound();

  return <PatientView jeton={jeton} />;
}

export const dynamic = "force-dynamic";
