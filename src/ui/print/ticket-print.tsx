interface TicketPrintProps {
  cabinetNom: string;
  numero: number;
  qrSvg: string;
  dateHeure: string; // "29/05/2026  14:32"
}

const TYPE_LABEL_FR: Record<string, string> = {
  normal: "",
  urgent: "URGENT",
  acte_court: "Acte court",
};

const TYPE_LABEL_AR: Record<string, string> = {
  normal: "",
  urgent: "عاجل",
  acte_court: "إجراء قصير",
};

export function TicketPrint({ cabinetNom, numero, qrSvg, dateHeure }: TicketPrintProps) {
  return (
    <div className="ticket">
      {/* Nom du cabinet */}
      <p className="cabinet-nom">{cabinetNom}</p>

      <hr className="divider" />

      {/* Ligne bilingue "Votre numéro / رقمك" */}
      <p className="label-bilingual">
        <span dir="ltr">Votre numéro</span>
        {" / "}
        <span dir="rtl">رقمك</span>
      </p>

      {/* Numéro — grand, centré */}
      <p className="numero">{numero}</p>

      {/* QR code */}
      <div
        className="qr-container"
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />

      {/* Instructions bilingues */}
      <p dir="ltr" className="instruction">Scannez pour suivre votre tour</p>
      <p dir="rtl" className="instruction">امسح لمتابعة دورك</p>

      <hr className="divider" />

      {/* Date/heure */}
      <p className="datetime">{dateHeure}</p>
    </div>
  );
}
