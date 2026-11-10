import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Note Legali, Termini d'Uso e Licenze — Melissa Barbanti",
  description:
    "Diritto d'autore, termini d'uso di immagini e poesie, divieto di text & data mining e informativa privacy.",
};

const sections = [
  {
    id: "diritto-autore",
    title: "Tutela del Diritto d'Autore",
    body: [
      "Tutte le opere pittoriche, le fotografie, i testi e le poesie pubblicati su questo sito sono opera di Melissa Barbanti e sono protetti dalla Legge 22 aprile 1941, n. 633 sul diritto d'autore e dalle convenzioni internazionali in materia.",
      "I diritti morali e patrimoniali restano interamente in capo all'autrice. L'acquisto di un'opera fisica non comporta il trasferimento dei diritti di riproduzione o di sfruttamento economico della relativa immagine.",
    ],
  },
  {
    id: "termini-uso",
    title: "Termini d'Uso delle Immagini e delle Poesie",
    body: [
      "È consentita la consultazione del sito per uso personale e non commerciale. È vietata qualsiasi riproduzione, copia, distribuzione, modifica, pubblicazione o comunicazione al pubblico, anche parziale, di immagini e testi senza previa autorizzazione scritta dell'autrice.",
      "Per richieste di licenza, collaborazioni editoriali, utilizzi espositivi o giornalistici, è possibile scrivere all'indirizzo email indicato nella pagina Profilo & Contatti. In caso di autorizzazione, l'autrice dovrà sempre essere citata come «Melissa Barbanti», con l'indicazione del titolo dell'opera.",
      "La condivisione sui social network è gradita purché l'opera non venga ritagliata o alterata e ne sia sempre indicata la paternità.",
    ],
  },
  {
    id: "no-ai",
    title: "Divieto di Text & Data Mining e AI Training",
    body: [
      "Ai sensi dell'art. 70-quater della Legge 633/1941 e dell'art. 4 della Direttiva (UE) 2019/790, l'autrice si riserva espressamente ogni diritto di opt-out dalle attività di text e data mining.",
      "È vietato l'utilizzo di qualsiasi contenuto di questo sito (immagini, descrizioni, poesie, metadati) per l'addestramento, il fine-tuning, la valutazione o la validazione di sistemi di intelligenza artificiale e modelli generativi, nonché la raccolta automatizzata (scraping, crawling) a tali scopi, senza una licenza scritta e specifica.",
    ],
  },
  {
    id: "privacy",
    title: "Informativa Privacy",
    body: [
      "Questo sito non richiede registrazione e non raccoglie dati personali dei visitatori a fini di profilazione. Non vengono utilizzati cookie di marketing o di tracciamento di terze parti.",
      "Se scegli di scrivere via email o tramite i canali social indicati, i dati che comunichi (ad esempio nome e indirizzo email) saranno trattati dall'autrice, titolare del trattamento, esclusivamente per rispondere alla tua richiesta, ai sensi del Regolamento (UE) 2016/679 (GDPR). Puoi in ogni momento chiederne l'accesso, la rettifica o la cancellazione scrivendo all'indirizzo di contatto.",
    ],
  },
];

export default function NoteLegaliPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <p className="text-xs uppercase tracking-[0.25em] text-accent">Informazioni</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight text-fg md:text-5xl">
        Note Legali, Termini d&apos;Uso e Licenze
      </h1>

      <nav aria-label="Indice" className="mt-10 border-y border-border py-5">
        <ul className="space-y-2 text-sm text-muted">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="transition-colors hover:text-accent">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-12 space-y-14">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="font-serif text-3xl text-fg">{s.title}</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-muted">
              {s.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
