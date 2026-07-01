export const metadata = { title: "Politica de confidențialitate | AlegoMind" };

export default function ConfidentialitatePage() {
  return (
    <div className="container-app py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Politica de confidențialitate</h1>
      <p className="text-sm text-text-muted mb-10">Ultima actualizare: Ianuarie 2026</p>

      <div className="space-y-8 text-text-secondary">
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">1. Ce date colectăm</h2>
          <p className="text-sm leading-relaxed">
            Colectăm informațiile pe care le furnizezi la înregistrare (email, nume),
            preferințele de matching, istoricul rezervărilor și conversațiile cu profesioniștii.
            Nu colectăm date sensibile medicale fără consimțământul tău explicit.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">2. Cum folosim datele</h2>
          <p className="text-sm leading-relaxed">
            Datele tale sunt folosite pentru a-ți oferi serviciile platformei: potrivire cu
            profesioniști, procesarea plăților și comunicare legată de servicii. Nu vindem
            datele tale personale unor terțe părți.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">3. Securitatea datelor</h2>
          <p className="text-sm leading-relaxed">
            Folosim criptare TLS pentru toate comunicațiile, parole stocate cu hash securizat
            și tokenuri JWT cu durată scurtă de viață. Plățile sunt procesate de Stripe,
            care deține certificare PCI DSS Level 1.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">4. Drepturile tale</h2>
          <p className="text-sm leading-relaxed">
            Conform GDPR, ai dreptul la acces, rectificare și ștergerea datelor personale.
            Poți solicita exportul sau ștergerea contului tău contactând{" "}
            <a href="mailto:privacy@alegomind.ro" className="text-brand-500 hover:underline">
              privacy@alegomind.ro
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">5. Cookie-uri</h2>
          <p className="text-sm leading-relaxed">
            Folosim cookie-uri esențiale pentru autentificare și funcționarea platformei.
            Nu folosim cookie-uri de tracking terță parte fără acordul tău. Vezi{" "}
            <a href="/cookie-uri" className="text-brand-500 hover:underline">
              politica de cookie-uri
            </a>{" "}
            pentru detalii.
          </p>
        </section>
      </div>
    </div>
  );
}
