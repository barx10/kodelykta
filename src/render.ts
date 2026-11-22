import type { Forklaring, OsDel } from "./schema";
import type { RepoPakke } from "./github";

type Barn = Node | string | null | undefined | false;

const LYKT_SVG = `<svg class="lykt" viewBox="0 0 40 54" aria-hidden="true"><g class="lykt-kropp"><circle cx="20" cy="6" r="4" fill="none" stroke="#151515" stroke-width="3"/><path d="M9 18 L13 11 H27 L31 18 Z" fill="#ff6b5b" stroke="#151515" stroke-width="3" stroke-linejoin="round"/><rect x="9" y="18" width="22" height="24" rx="3" fill="#ffd23f" stroke="#151515" stroke-width="3"/><path d="M20 36 C15 32 18 27 20 23 C22 27 25 32 20 36 Z" fill="#ff6b5b" stroke="#151515" stroke-width="2"/><path d="M14 22 V38 M26 22 V38" stroke="#151515" stroke-width="2" opacity=".35"/><rect x="7" y="42" width="26" height="6" rx="2" fill="#151515"/></g></svg>`;

/** Lykt som svinger og lyser, brukt mens noe lastes. */
export function lasteLykt(): HTMLElement {
  const el = h("span", { class: "laste-lykt" });
  el.innerHTML = LYKT_SVG; // fast, egen SVG
  return el;
}

/** Liten hjelper som lager DOM-elementer. All tekst settes som tekst, aldri som HTML. */
export function h(tag: string, attr: Record<string, string> = {}, ...barn: Barn[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attr)) el.setAttribute(k, v);
  for (const b of barn) if (b) el.append(b);
  return el;
}

function kodeblokk(kommando: string): HTMLElement {
  const knapp = h("button", { type: "button", class: "kopier" }, "Kopier");
  knapp.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(kommando);
      knapp.textContent = "Kopiert!";
      knapp.classList.add("kopiert");
      setTimeout(() => { knapp.textContent = "Kopier"; knapp.classList.remove("kopiert"); }, 1500);
    } catch {
      knapp.textContent = "Marker og kopier";
    }
  });
  return h("div", { class: "kode" }, h("pre", {}, h("code", {}, kommando)), knapp);
}

function panel(tittel: string, ...innhold: Barn[]): HTMLElement {
  return h("section", { class: "boks panel" }, h("span", { class: "panel-nr" }), h("h2", {}, tittel), ...innhold);
}

/** Markerer første forekomst av hvert fagord i hvert panel, med forklaringen som hjelpetekst. */
function markerOrd(rot: HTMLElement, ordliste: { ord: string; forklaring: string }[]) {
  const liste = ordliste.filter((o) => o.ord.trim().length > 1).sort((a, b) => b.ord.length - a.ord.length);
  if (!liste.length) return;
  const forklaring = new Map(liste.map((o) => [o.ord.toLowerCase(), o.forklaring]));
  const alternativer = liste.map((o) => o.ord.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const mønster = new RegExp(`(?<![\\p{L}\\p{N}])(${alternativer})(?![\\p{L}\\p{N}])`, "giu");
  const hopp = "code, pre, svg, a, button, dfn, h2, .ordliste, .panel-nr";

  for (const seksjon of Array.from(rot.children)) {
    if (seksjon.matches(".ordliste-panel, .kilder")) continue;
    const sett = new Set<string>();
    const gåer = document.createTreeWalker(seksjon, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement?.closest(hopp) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const noder: Text[] = [];
    while (gåer.nextNode()) noder.push(gåer.currentNode as Text);
    for (const node of noder) {
      const tekst = node.data;
      mønster.lastIndex = 0;
      const deler: (string | Node)[] = [];
      let sist = 0;
      for (const m of tekst.matchAll(mønster)) {
        const nøkkel = m[1].toLowerCase();
        if (sett.has(nøkkel) || !forklaring.has(nøkkel)) continue;
        sett.add(nøkkel);
        deler.push(tekst.slice(sist, m.index));
        deler.push(h("dfn", { class: "ord", tabindex: "0", "data-forklaring": forklaring.get(nøkkel)! }, m[1]));
        sist = m.index! + m[1].length;
      }
      if (deler.length) {
        deler.push(tekst.slice(sist));
        node.replaceWith(...deler);
      }
    }
  }
}

const domTekst = { ja: ["✓", "Ja, dette skal virke"], kanskje: ["?", "Kanskje"], nei: ["✗", "Nei, ikke støttet"] } as const;

function osInnhold(os: OsDel): HTMLElement {
  const [ikon, tekst] = domTekst[os.virker] ?? domTekst.kanskje;
  const liste = h("ol", { class: "steg" });
  for (const s of os.steg) {
    liste.append(
      h("li", {}, h("div", { class: "steg-innhold" },
        h("h3", {}, s.tittel),
        s.forklaring && h("p", {}, s.forklaring),
        s.kommando.trim() && kodeblokk(s.kommando.trim()),
      )),
    );
  }
  return h("div", {},
    h("div", { class: `dom dom-${os.virker}` },
      h("span", { class: "dom-ikon", "aria-hidden": "true" }, ikon),
      h("div", {}, h("strong", {}, tekst), os.merknad && h("div", {}, os.merknad)),
    ),
    os.steg.length ? liste : h("p", {}, "Ingen steg for dette systemet."),
  );
}

function gjettOs(): "macos" | "windows" | "linux" {
  const p = (navigator.userAgent || "").toLowerCase();
  if (p.includes("win")) return "windows";
  if (p.includes("mac") || p.includes("iphone") || p.includes("ipad")) return "macos";
  return "linux";
}

async function tegnDiagram(boks: HTMLElement, kode: string) {
  try {
    const { default: mermaid } = await import("mermaid");
    // Skriften må være lastet før Mermaid måler teksten, ellers blir boksene feil.
    try { await document.fonts.load('700 20px "Caveat"'); } catch { /* bruk reserveskrift */ }
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      look: "handDrawn",
      handDrawnSeed: 7,
      theme: "base",
      fontFamily: "Caveat, cursive",
      themeVariables: {
        primaryColor: "#ffd23f",
        primaryTextColor: "#151515",
        primaryBorderColor: "#151515",
        secondaryColor: "#6ec5ff",
        tertiaryColor: "#3ddc97",
        lineColor: "#151515",
        background: "#fff8e7",
        fontSize: "21px",
      },
    });
    await mermaid.parse(kode);
    const { svg } = await mermaid.render(`diagram-${Date.now()}`, kode);
    boks.innerHTML = svg; // Mermaid renser SVG-en selv i strict-modus.
  } catch {
    boks.replaceChildren(
      h("p", {}, "Diagrammet kunne ikke tegnes. Her er beskrivelsen modellen laget:"),
      h("pre", {}, h("code", {}, kode)),
    );
  }
}

export function tegnResultat(mål: HTMLElement, f: Forklaring, pakke: RepoPakke, modellNavn: string) {
  const i = pakke.info;
  const v = f.vurdering;

  const tittel = h("section", { class: "boks tittelkort" },
    h("p", { class: "handskrift" }, "Dette fant lykta …"),
    h("h2", {}, h("a", { href: `https://github.com/${i.eier}/${i.navn}`, target: "_blank", rel: "noopener noreferrer" }, `${i.eier}/${i.navn}`)),
    h("p", {}, f.oppsummering),
    f.for_hvem && h("p", {}, h("strong", {}, "For hvem: "), f.for_hvem),
    h("div", { class: "merker" },
      h("span", { class: `merke ${v.vanskelighetsgrad}` }, `Vanskelighet: ${v.vanskelighetsgrad}`),
      h("span", { class: "merke" }, `⏱ ${v.tidsbruk}`),
      h("span", { class: "merke" }, `Lisens: ${v.lisens}`),
      i.stjerner > 0 && h("span", { class: "merke" }, `★ ${i.stjerner.toLocaleString("nb-NO")}`),
      i.arkivert && h("span", { class: "merke vanskelig" }, "Arkivert"),
    ),
    v.vedlikehold && h("p", { style: "margin-top:12px" }, h("strong", {}, "Vedlikehold: "), v.vedlikehold),
  );

  const diagramboks = h("div", { class: "diagram" }, h("div", { class: "laster" }, lasteLykt(), "Tegner …"));
  const enkelt = h("section", { class: "boks panel enkelt" },
    h("span", { class: "panel-merke" }, "Uten fagord"),
    h("h2", {}, "Forklart enkelt"),
    f.enkelt.sammenligning && h("p", { class: "sammenligning" }, f.enkelt.sammenligning),
    h("p", {}, f.enkelt.forklaring),
    h("div", { class: "trenger" },
      h("h3", {}, "Trenger jeg dette?"),
      h("p", {}, f.trenger_jeg.svar),
      f.trenger_jeg.enklere_alternativ && h("p", {}, h("strong", {}, "Enklere alternativ: "), f.trenger_jeg.enklere_alternativ),
    ),
  );

  const diagram = panel("Slik henger det sammen", diagramboks, f.diagram.forklaring && h("p", {}, f.diagram.forklaring));

  const mapper = panel("Hva ligger hvor",
    h("ul", { class: "mapper" }, ...f.mapper.map((m) => h("li", {}, h("code", {}, m.sti), h("span", {}, m.beskrivelse)))),
  );

  const deler = panel("Deleliste",
    f.deleliste.length
      ? h("div", { class: "deleliste" }, ...f.deleliste.map((d) =>
          h("div", { class: "del" },
            h("span", { class: "del-antall" }, "1×"),
            h("div", {}, h("span", { class: "del-navn" }, d.navn), d.versjon && h("span", { class: "del-versjon" }, d.versjon)),
            h("div", {}, d.brukes_til),
            d.sjekk_kommando.trim() && h("div", {}, h("small", {}, "Sjekk om du har det:"), kodeblokk(d.sjekk_kommando.trim())),
          )))
      : h("p", {}, "Ingen deler å installere først."),
  );

  const osNavn = { macos: "macOS", windows: "Windows", linux: "Linux" } as const;
  const faner = h("div", { class: "faner", role: "tablist" });
  const osFelt = h("div", { role: "tabpanel" });
  const velg = (os: keyof typeof osNavn) => {
    for (const b of faner.querySelectorAll("button")) b.setAttribute("aria-selected", String(b.dataset.os === os));
    osFelt.replaceChildren(osInnhold(f.kom_i_gang[os]));
  };
  for (const os of Object.keys(osNavn) as (keyof typeof osNavn)[]) {
    const b = h("button", { type: "button", class: "fane", role: "tab", "data-os": os }, osNavn[os]);
    b.addEventListener("click", () => velg(os));
    faner.append(b);
  }
  velg(gjettOs());
  const steg = panel("Sånn setter du det sammen", faner, osFelt);

  const begrensninger = f.begrensninger.length
    ? panel("Verdt å vite", h("ul", { class: "punkter" }, ...f.begrensninger.map((b) => h("li", {}, b))))
    : null;

  const ordliste = f.ordliste.length
    ? h("section", { class: "boks panel ordliste-panel" },
        h("h2", {}, "Ordliste"),
        h("dl", { class: "ordliste" }, ...f.ordliste.flatMap((o) => [h("dt", {}, o.ord), h("dd", {}, o.forklaring)])),
      )
    : null;

  const mdKnapp = h("button", { type: "button", class: "knapp knapp-liten" }, "Last ned som Markdown");
  mdKnapp.addEventListener("click", () => lastNedMarkdown(f, pakke));
  const kilder = h("section", { class: "boks panel kilder" },
    h("h3", {}, `Filer forklaringen bygger på (${pakke.filer.length} av ${pakke.antallFiler})`),
    h("ul", {}, ...pakke.filer.map((x) => h("li", {}, h("code", {}, x.sti + (x.avkortet ? " (avkortet)" : ""))))),
    h("p", { class: "liten", style: "margin-top:12px" },
      `Laget med ${modellNavn} fra commit ${i.commit.slice(0, 7)}. Ikke testet: les hver kommando før du kjører den.`),
    h("div", { class: "verktoy" }, mdKnapp),
  );

  mål.replaceChildren(tittel, enkelt, diagram, mapper, deler, steg, ...(begrensninger ? [begrensninger] : []), ...(ordliste ? [ordliste] : []), kilder);
  mål.querySelectorAll(".panel-nr").forEach((el, n) => (el.textContent = String(n + 1)));
  markerOrd(mål, f.ordliste);
  mål.hidden = false;
  void tegnDiagram(diagramboks, f.diagram.mermaid);
}

function lastNedMarkdown(f: Forklaring, pakke: RepoPakke) {
  const i = pakke.info;
  const l: string[] = [];
  l.push(`# ${i.eier}/${i.navn}`, "", f.oppsummering, "");
  if (f.for_hvem) l.push(`**For hvem:** ${f.for_hvem}`, "");
  l.push("## Forklart enkelt", "", f.enkelt.sammenligning, "", f.enkelt.forklaring, "");
  l.push("### Trenger jeg dette?", "", f.trenger_jeg.svar, "");
  if (f.trenger_jeg.enklere_alternativ) l.push(`**Enklere alternativ:** ${f.trenger_jeg.enklere_alternativ}`, "");
  const v = f.vurdering;
  l.push(`- Vanskelighet: ${v.vanskelighetsgrad}`, `- Tidsbruk: ${v.tidsbruk}`, `- Lisens: ${v.lisens}`, `- Vedlikehold: ${v.vedlikehold}`, "");
  l.push("## Slik henger det sammen", "", "```mermaid", f.diagram.mermaid, "```", "", f.diagram.forklaring, "");
  l.push("## Hva ligger hvor", "", ...f.mapper.map((m) => `- \`${m.sti}\`: ${m.beskrivelse}`), "");
  l.push("## Deleliste", "", ...f.deleliste.map((d) => `- 1× **${d.navn}**${d.versjon ? ` (${d.versjon})` : ""}: ${d.brukes_til}${d.sjekk_kommando ? ` Sjekk: \`${d.sjekk_kommando}\`` : ""}`), "");
  for (const [os, navn] of [["macos", "macOS"], ["windows", "Windows"], ["linux", "Linux"]] as const) {
    const d = f.kom_i_gang[os];
    l.push(`## Kom i gang på ${navn}`, "", `Virker: ${d.virker}. ${d.merknad}`, "");
    d.steg.forEach((s, n) => {
      l.push(`${n + 1}. **${s.tittel}** ${s.forklaring}`);
      if (s.kommando.trim()) l.push("", "   ```", ...s.kommando.trim().split("\n").map((x) => "   " + x), "   ```");
    });
    l.push("");
  }
  if (f.begrensninger.length) l.push("## Verdt å vite", "", ...f.begrensninger.map((b) => `- ${b}`), "");
  if (f.ordliste.length) l.push("## Ordliste", "", ...f.ordliste.map((o) => `- **${o.ord}**: ${o.forklaring}`), "");
  l.push("---", `Laget av Kodelykta fra commit ${i.commit.slice(0, 7)}. Kommandoene er ikke testet.`);

  const blob = new Blob([l.join("\n")], { type: "text/markdown;charset=utf-8" });
  const a = h("a", { href: URL.createObjectURL(blob), download: `${i.navn}-forklart.md` }) as HTMLAnchorElement;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
