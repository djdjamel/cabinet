import { NextResponse } from "next/server";
import { prismaTicketRepository } from "@infrastructure/prisma/ticket-repository";
import { generateQRSvg } from "@infrastructure/qr/qr-generator";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jeton: string }> }
) {
  const { jeton } = await params;
  const ticket = await prismaTicketRepository.findByJeton(jeton);
  if (!ticket) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  const baseUrl = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
  const url = `${baseUrl}/f/${jeton}`;
  const svg = await generateQRSvg(url);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export const dynamic = "force-dynamic";
