import { db } from "./index";
import {
  events,
  homeSettings,
  paintings,
  paintingsToEvents,
  profileSettings,
  type ManualSlot,
} from "./schema";

const img = (seed: string, w = 1200, h = 1500) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const paintingRows = [
  {
    title: "Il silenzio delle forme",
    slug: "il-silenzio-delle-forme",
    mainImageUrl: img("silenzio"),
    detailImagesJson: JSON.stringify([img("silenzio-d1", 800, 800), img("silenzio-d2", 800, 800)]),
    description:
      "Un dialogo sospeso tra ombra e luce, dove le forme emergono lentamente dal fondo scuro della tela. Le stesure di colore sono sottili e stratificate, quasi a cercare il respiro della materia.",
    poem: "Nel silenzio delle forme\nla luce impara a restare,\ne l'ombra, paziente,\nle insegna ad ascoltare.",
    date: "2024-03-15",
    dimensions: "80x100 cm",
    technique: "Olio su tela",
    availability: "available" as const,
  },
  {
    title: "Affioramenti",
    slug: "affioramenti",
    mainImageUrl: img("affioramenti", 1500, 1100),
    detailImagesJson: JSON.stringify([img("affioramenti-d1", 800, 800)]),
    description:
      "Memorie che risalgono in superficie come pigmenti nell'acqua. Il gesto è lento, la materia è lasciata libera di depositarsi e di raccontare il proprio tempo.",
    poem: "Ciò che dorme in profondità\nsale piano, senza nome,\ne diventa colore.",
    date: "2023-09-02",
    dimensions: "120x90 cm",
    technique: "Olio e cera su tela",
    availability: "private_collection" as const,
  },
  {
    title: "Lungo il crepuscolo",
    slug: "lungo-il-crepuscolo",
    mainImageUrl: img("crepuscolo", 1000, 1400),
    detailImagesJson: JSON.stringify([]),
    description:
      "Le ultime ore del giorno sulla campagna toscana, rese con ocra, terre bruciate e un filo d'oro. Un paesaggio più interiore che reale.",
    poem: null,
    date: "2022-06-20",
    dimensions: "60x80 cm",
    technique: "Olio su tavola",
    availability: "available" as const,
  },
  {
    title: "Autoritratto in blu",
    slug: "autoritratto-in-blu",
    mainImageUrl: img("blu", 1100, 1100),
    detailImagesJson: JSON.stringify([img("blu-d1", 800, 800), img("blu-d2", 800, 800)]),
    description:
      "Uno sguardo che attraversa il colore. Il blu oltremare costruisce un volto fatto di assenze e di presenze, tra riconoscimento e distanza.",
    poem: "Mi guardo e non mi trovo,\npoi il blu mi restituisce\nun nome più sottile.",
    date: "2021-11-08",
    dimensions: "70x70 cm",
    technique: "Acrilico e olio su tela",
    availability: "private_collection" as const,
  },
];

const eventRows = [
  {
    title: "Affioramenti — Mostra personale",
    slug: "affioramenti-mostra-personale",
    summary: "Prima personale di Melissa Barbanti: venti opere recenti tra olio e cera.",
    description:
      "La mostra raccoglie venti opere realizzate negli ultimi tre anni, un percorso sulla memoria e sulla materia pittorica.\n\nLe tele sono state concepite come un'unica narrazione, dove ogni quadro risponde al precedente in un gioco di echi cromatici.\n\nIn occasione dell'inaugurazione l'artista ha letto alcune delle poesie che accompagnano le opere.\n\nL'esposizione è stata accolta con grande partecipazione dal pubblico e dalla critica locale.",
    startDate: "2024-05-10",
    endDate: "2024-06-09",
    location: "Galleria Il Chiaroscuro, Firenze",
    coverImageUrl: img("evento1", 1600, 1000),
    eventImagesJson: JSON.stringify([
      img("evento1-a", 1200, 800),
      img("evento1-b", 800, 1200),
      img("evento1-c", 1200, 800),
      img("evento1-d", 1000, 1000),
      img("evento1-e", 800, 1200),
    ]),
  },
  {
    title: "Forme del silenzio — Collettiva",
    slug: "forme-del-silenzio-collettiva",
    summary: "Mostra collettiva dedicata alla pittura contemporanea italiana.",
    description:
      "Una collettiva con otto artisti italiani che indagano il tema del silenzio nella pittura contemporanea.\n\nMelissa Barbanti partecipa con tre opere, tra cui «Il silenzio delle forme», scelta come immagine simbolo della rassegna.",
    startDate: "2025-02-14",
    endDate: null,
    location: "Palazzo delle Arti, Lucca",
    coverImageUrl: img("evento2", 1600, 1000),
    eventImagesJson: JSON.stringify([img("evento2-a", 1200, 800), img("evento2-b", 800, 1200)]),
  },
];

async function main() {
  await db.delete(paintingsToEvents);
  await db.delete(paintings);
  await db.delete(events);
  await db.delete(homeSettings);
  await db.delete(profileSettings);

  const insertedPaintings = await db.insert(paintings).values(paintingRows).returning();
  const insertedEvents = await db.insert(events).values(eventRows).returning();
  const p = Object.fromEntries(insertedPaintings.map((r) => [r.slug, r.id]));
  const e = Object.fromEntries(insertedEvents.map((r) => [r.slug, r.id]));

  await db.insert(paintingsToEvents).values([
    { paintingId: p["il-silenzio-delle-forme"], eventId: e["affioramenti-mostra-personale"] },
    { paintingId: p["affioramenti"], eventId: e["affioramenti-mostra-personale"] },
    { paintingId: p["lungo-il-crepuscolo"], eventId: e["affioramenti-mostra-personale"] },
    { paintingId: p["il-silenzio-delle-forme"], eventId: e["forme-del-silenzio-collettiva"] },
    { paintingId: p["autoritratto-in-blu"], eventId: e["forme-del-silenzio-collettiva"] },
  ]);

  const manualSlots: ManualSlot[] = [
    { slot: 1, type: "painting", id: p["il-silenzio-delle-forme"] },
    { slot: 2, type: "event", id: e["affioramenti-mostra-personale"] },
    { slot: 3, type: "painting", id: p["affioramenti"] },
    { slot: 4, type: "painting", id: p["lungo-il-crepuscolo"] },
    { slot: 5, type: "event", id: e["forme-del-silenzio-collettiva"] },
    { slot: 6, type: "painting", id: p["autoritratto-in-blu"] },
  ];
  await db.insert(homeSettings).values({
    id: 1,
    mode: "auto",
    heroItemType: "painting",
    heroItemId: p["il-silenzio-delle-forme"],
    manualSlotsJson: JSON.stringify(manualSlots),
  });

  await db.insert(profileSettings).values({
    id: 1,
    avatarUrl: img("ritratto", 800, 1000),
    bioDescription:
      "Melissa Barbanti è una pittrice toscana. Il suo lavoro nasce dall'ascolto del silenzio e dalla lenta stratificazione del colore.\n\nSi è formata all'Accademia di Belle Arti di Firenze, dove ha approfondito la tecnica dell'olio e lo studio della luce nel Seicento.\n\nAccanto alla pittura scrive brevi poesie, che accompagnano le opere come una seconda voce.\n\nHa esposto in gallerie e spazi pubblici in Toscana e le sue opere fanno parte di collezioni private.",
    profileImagesJson: JSON.stringify([img("studio1", 1200, 800), img("studio2", 800, 1200)]),
    instagramUrl: "https://www.instagram.com/melissartbarbanti",
    email: "info@melissabarbanti.it",
  });

  console.log(
    `Seeded ${insertedPaintings.length} paintings, ${insertedEvents.length} events, 5 links.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
