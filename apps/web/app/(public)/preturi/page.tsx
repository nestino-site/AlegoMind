import Link from "next/link";

export default function PreturiPage() {
  const plans = [
    {
      name: "Gratuit",
      price: "0",
      period: "/ lună",
      description: "Pentru a începe și a explora platforma.",
      features: [
        "Explorarea tuturor profesioniștilor",
        "Mesaj gratuit legat de ședința rezervată",
        "Rezervare ședințe",
        "Asistent AI de bază",
      ],
      cta: "Începe gratuit",
      href: "/inregistrare",
      highlight: false,
    },
    {
      name: "Plus",
      price: "49",
      period: "/ lună",
      description: "Pentru cei care vor mai mult din fiecare conversație.",
      features: [
        "Tot ce include planul Gratuit",
        "Mesaj de bun venit personalizat AI de la profesionist",
        "Potrivire avansată cu profesioniști",
        "Prioritate în răspunsuri",
        "Suport prioritar",
      ],
      cta: "Încearcă Plus",
      href: "/inregistrare",
      highlight: true,
    },
  ];

  return (
    <div className="container-app py-12 lg:py-20 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-3">Prețuri simple și transparente</h1>
        <p className="text-text-secondary text-base max-w-xl mx-auto leading-relaxed">
          Fără costuri ascunse. Sesiunile cu profesioniștii se plătesc separat, la prețul stabilit de fiecare specialist.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border p-8 ${
              plan.highlight
                ? "border-brand-300 bg-brand-500 text-white"
                : "border-border bg-white"
            }`}
          >
            <div className="mb-6">
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${plan.highlight ? "text-brand-100" : "text-text-muted"}`}>
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className={`text-sm ${plan.highlight ? "text-brand-100" : "text-text-muted"}`}>RON{plan.period}</span>
              </div>
              <p className={`text-sm mt-2 ${plan.highlight ? "text-brand-100" : "text-text-secondary"}`}>
                {plan.description}
              </p>
            </div>
            <ul className="space-y-2.5 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <svg className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-brand-200" : "text-brand-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={plan.highlight ? "text-white" : "text-text-secondary"}>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`block w-full rounded-2xl py-3 text-center text-sm font-semibold transition-colors ${
                plan.highlight
                  ? "bg-white text-brand-600 hover:bg-brand-50"
                  : "bg-brand-500 text-white hover:bg-brand-600"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-text-muted">
        Prețurile ședințelor sunt stabilite de fiecare profesionist și plătite direct prin platformă.
      </p>
    </div>
  );
}
