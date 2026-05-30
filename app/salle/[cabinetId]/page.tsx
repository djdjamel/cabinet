import { SalleView } from "@ui/salle/salle-view";

type Props = { params: Promise<{ cabinetId: string }> };

export default async function SallePage({ params }: Props) {
  const { cabinetId } = await params;
  return <SalleView cabinetId={cabinetId} />;
}

export const dynamic = "force-dynamic";
