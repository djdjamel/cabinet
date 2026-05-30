import QRCode from "qrcode";

/** Génère un QR code au format SVG string pour un URL donné. */
export async function generateQRSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

/** Génère un QR code au format data URL (PNG base64) pour affichage <img>. */
export async function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 300,
    errorCorrectionLevel: "M",
  });
}
