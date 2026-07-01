export const metadata = { title: "Politica de cookie-uri | AlegoMind" };

export default function CookieUriPage() {
  const cookies = [
    {
      name: "am_at",
      type: "Esențial",
      duration: "15 minute",
      purpose: "Token de acces JWT pentru autentificare. Necesar pentru a rămâne conectat.",
    },
    {
      name: "am_rt (localStorage)",
      type: "Esențial",
      duration: "30 zile",
      purpose: "Token de reînnoire pentru menținerea sesiunii fără a solicita autentificarea la fiecare vizită.",
    },
  ];

  return (
    <div className="container-app py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Politica de cookie-uri</h1>
      <p className="text-sm text-text-muted mb-10">Ultima actualizare: Ianuarie 2026</p>

      <div className="space-y-8 text-text-secondary">
        <section>
          <p className="text-sm leading-relaxed mb-6">
            AlegoMind folosește un număr minim de cookie-uri, strict necesare funcționării
            platformei. Nu folosim cookie-uri de tracking, publicitate sau analiză terță parte.
          </p>

          <h2 className="text-base font-semibold text-text-primary mb-4">Cookie-uri utilizate</h2>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Nume</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Tip</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Durată</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Scop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cookies.map((c) => (
                  <tr key={c.name}>
                    <td className="px-4 py-3 font-mono text-xs text-text-primary">{c.name}</td>
                    <td className="px-4 py-3 text-xs">{c.type}</td>
                    <td className="px-4 py-3 text-xs">{c.duration}</td>
                    <td className="px-4 py-3 text-xs leading-relaxed">{c.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">Controlul cookie-urilor</h2>
          <p className="text-sm leading-relaxed">
            Poți șterge cookie-urile din setările browserului oricând. Dezactivarea cookie-urilor
            esențiale va împiedica funcționarea autentificării pe platformă.
            Pentru mai multe informații, contactează-ne la{" "}
            <a href="mailto:privacy@alegomind.ro" className="text-brand-500 hover:underline">
              privacy@alegomind.ro
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
