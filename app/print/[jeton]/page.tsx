import { notFound } from "next/navigation";
import { prismaTicketRepository } from "@infrastructure/prisma/ticket-repository";
import { getCabinetNom } from "@infrastructure/prisma/cabinet-repository";
import { generateQRSvg } from "@infrastructure/qr/qr-generator";
import { TicketPrint } from "@ui/print/ticket-print";
import { AutoPrint } from "@ui/print/auto-print";

type Props = { params: Promise<{ jeton: string }> };

export default async function PrintPage({ params }: Props) {
  const { jeton } = await params;

  const ticket = await prismaTicketRepository.findByJeton(jeton);
  if (!ticket) notFound();

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const jetonUrl = `${baseUrl}/f/${jeton}`;

  const [qrSvg, cabinetNom] = await Promise.all([
    generateQRSvg(jetonUrl),
    getCabinetNom(ticket.cabinet_id),
  ]);

  const dateHeure = new Date(ticket.cree_le).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {/* CSS embarqué — pas de CDN, fonctionne hors-ligne */}
      <style>{`
        /* ── Reset ─────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Page 58 mm ────────────────────────────────────── */
        @page {
          size: 58mm auto;
          margin: 2mm;
        }

        html, body {
          width: 54mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 10pt;
          color: #000;
          background: #fff;
        }

        /* ── Ticket ────────────────────────────────────────── */
        .ticket {
          width: 54mm;
          text-align: center;
          padding: 2mm 0;
        }

        .cabinet-nom {
          font-size: 9pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
          margin-bottom: 2mm;
        }

        .divider {
          border: none;
          border-top: 1px dashed #000;
          margin: 2mm 0;
        }

        .label-bilingual {
          font-size: 8pt;
          color: #444;
          margin-bottom: 1mm;
        }

        .numero {
          font-size: 32pt;
          font-weight: bold;
          line-height: 1;
          margin: 2mm 0;
          letter-spacing: -1pt;
        }

        .qr-container {
          display: flex;
          justify-content: center;
          margin: 2mm auto;
          width: 40mm;
          height: 40mm;
        }

        .qr-container svg {
          width: 40mm;
          height: 40mm;
        }

        .instruction {
          font-size: 8pt;
          color: #333;
          margin: 1mm 0;
          line-height: 1.3;
        }

        .datetime {
          font-size: 8pt;
          color: #555;
          margin-top: 1mm;
        }

        /* ── Écran : preview du ticket ─────────────────────── */
        @media screen {
          body {
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            padding: 20px;
          }
          .ticket {
            background: #fff;
            border: 1px solid #ccc;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            padding: 4mm;
          }
        }
      `}</style>

      <AutoPrint />

      <TicketPrint
        cabinetNom={cabinetNom}
        numero={ticket.numero}
        qrSvg={qrSvg}
        dateHeure={dateHeure}
      />
    </>
  );
}

export const dynamic = "force-dynamic";
