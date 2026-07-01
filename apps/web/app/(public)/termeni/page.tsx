export const metadata = { title: "Termeni și condiții | AlegoMind" };

export default function TermeniPage() {
  return (
    <div className="container-app py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Termeni și condiții</h1>
      <p className="text-sm text-text-muted mb-10">Ultima actualizare: Ianuarie 2026</p>

      <div className="prose prose-sm max-w-none text-text-secondary space-y-8">
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">1. Acceptarea termenilor</h2>
          <p className="leading-relaxed">
            Prin utilizarea platformei AlegoMind, ești de acord cu prezentii termeni și condiții.
            Dacă nu ești de acord cu aceștia, te rugăm să nu utilizezi serviciile noastre.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">2. Descrierea serviciilor</h2>
          <p className="leading-relaxed">
            AlegoMind este o platformă care facilitează conexiunea dintre utilizatori și
            profesioniști din domeniul sănătății mintale (terapeuți, coaches, mentori).
            Platforma nu oferă servicii medicale sau terapeutice directe.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">3. Conturi și responsabilitate</h2>
          <p className="leading-relaxed">
            Ești responsabil pentru menținerea confidențialității contului tău și pentru
            toate activitățile desfășurate prin intermediul acestuia. Ne rezervăm dreptul
            de a suspenda conturile care încalcă termenii de utilizare.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">4. Plăți și rambursări</h2>
          <p className="leading-relaxed">
            Plățile pentru ședințe sunt procesate securizat prin Stripe. Politica de
            rambursare permite anularea cu cel puțin 24 de ore înainte de ședință.
            Abonamentele se pot anula oricând, efectul producându-se la sfârșitul perioadei curente.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">5. Contact</h2>
          <p className="leading-relaxed">
            Pentru orice întrebări legate de acești termeni, ne poți contacta la{" "}
            <a href="mailto:legal@alegomind.ro" className="text-brand-500 hover:underline">
              legal@alegomind.ro
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
