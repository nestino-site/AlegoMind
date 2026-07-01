export default function CumFunctioneazaPage() {
  const steps = [
    {
      number: "01",
      title: "Creează un cont",
      description:
        "Înregistrează-te gratuit ca utilizator sau profesionist. Contul de bază nu necesită card bancar.",
    },
    {
      number: "02",
      title: "Completează profilul",
      description:
        "Spune-ne despre preferințele și nevoile tale. Sistemul nostru de potrivire te va conecta cu cei mai potriviți profesioniști.",
    },
    {
      number: "03",
      title: "Alege un profesionist",
      description:
        "Explorează terapeuți, coaches și mentori verificați. Poți filtra după specialitate, format de sesiune și preț.",
    },
    {
      number: "04",
      title: "Începe o conversație",
      description:
        "Trimite un mesaj gratuit pentru a pune o întrebare despre o ședință rezervată, sau alege un subiect plătit pentru o consultație dedicată.",
    },
    {
      number: "05",
      title: "Rezervă o ședință",
      description:
        "Alege tipul de sesiune (video, vocal, text sau față în față), durata și data care ți se potrivește.",
    },
  ];

  return (
    <div className="container-app py-12 lg:py-20 max-w-3xl">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-3">Cum funcționează?</h1>
        <p className="text-text-secondary text-base max-w-xl mx-auto leading-relaxed">
          AlegoMind îți face accesul la suport psihologic simplu și fără bariere.
          Iată cum poți începe în câteva minute.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex gap-5 rounded-3xl border border-border bg-white p-6"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-2xl bg-brand-50 flex items-center justify-center">
              <span className="text-xs font-bold text-brand-600">{step.number}</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary mb-1">{step.title}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-3xl bg-brand-500 p-8 text-center text-white">
        <h2 className="text-xl font-bold mb-2">Gata să începi?</h2>
        <p className="text-sm opacity-80 mb-5">Înregistrarea este gratuită și durează 2 minute.</p>
        <a
          href="/inregistrare"
          className="inline-block rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
        >
          Creează cont gratuit
        </a>
      </div>
    </div>
  );
}
