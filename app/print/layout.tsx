/**
 * Layout minimal pour les pages d'impression.
 * Pas de Tailwind, pas de fonts CDN — tout embarqué localement.
 * Fonctionne même sans connexion internet.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Ticket</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
