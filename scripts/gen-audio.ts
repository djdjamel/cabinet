/**
 * Génère les clips audio bilingues AR+FR pour les numéros 1–200.
 *
 * Prérequis : npm install --save-dev msedge-tts
 * Usage     : npm run gen:audio
 *
 * Sortie :
 *   public/audio/ar/1.mp3  … public/audio/ar/200.mp3
 *   public/audio/fr/1.mp3  … public/audio/fr/200.mp3
 *
 * Taille totale estimée : ~8 Mo (200 × 2 × ~20 Ko).
 */
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { createWriteStream, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import path from "path";

const VOICES: { lang: string; voice: string; text: (n: number) => string }[] = [
  {
    lang: "ar",
    voice: "ar-MA-JamalNeural",
    text: (n) => `رقم ${n}`,
  },
  {
    lang: "fr",
    voice: "fr-FR-HenriNeural",
    text: (n) => `Numéro ${n}`,
  },
];

async function main() {
  for (const { lang, voice, text } of VOICES) {
    const dir = path.join(process.cwd(), "public", "audio", lang);
    mkdirSync(dir, { recursive: true });

    console.log(`\nGénération voix ${lang} — ${voice}…`);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    for (let n = 1; n <= 200; n++) {
      const file = path.join(dir, `${n}.mp3`);
      const stream = tts.toStream(text(n));
      await pipeline(stream, createWriteStream(file));
      process.stdout.write(`\r  ${n}/200`);
    }

    console.log(`\n  ✓ 200 fichiers → public/audio/${lang}/`);
  }

  console.log("\n✓ Génération terminée.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
