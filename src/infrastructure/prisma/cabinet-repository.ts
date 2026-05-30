import { db } from "./db";

export interface CabinetParams {
  duree_moyenne_min: number;
  delai_grace_min: number;
  decalage_reintegration: number;
  max_reintegrations: number;
  afficher_nom: boolean;
  annonce_vocale: boolean;
  ecran_salle: boolean;
  metriques: boolean;
}

const DEFAULT_PARAMS: CabinetParams = {
  duree_moyenne_min: 15,
  delai_grace_min: 30,
  decalage_reintegration: 2,
  max_reintegrations: 1,
  afficher_nom: true,
  annonce_vocale: false,
  ecran_salle: false,
  metriques: false,
};

export async function getCabinetNom(cabinetId: string): Promise<string> {
  const cabinet = await db.cabinet.findUnique({
    where: { id: cabinetId },
    select: { nom: true },
  });
  return cabinet?.nom ?? "Cabinet";
}

export async function getCabinetParams(cabinetId: string): Promise<CabinetParams> {
  const cabinet = await db.cabinet.findUnique({
    where: { id: cabinetId },
    select: { params: true },
  });
  if (!cabinet) return DEFAULT_PARAMS;
  return { ...DEFAULT_PARAMS, ...(cabinet.params as Partial<CabinetParams>) };
}
