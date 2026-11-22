import "./style.css";
import { hentRepo, tolkLenke, type RepoPakke } from "./github";
import { anslagPris, anslagTokens, forklar, hentModeller, standardModeller, type Leverandor } from "./llm";
import { h, lasteLykt, tegnResultat } from "./render";
import type { Forklaring } from "./schema";
import { visOm } from "./om";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const skjema = $<HTMLFormElement>("skjema");
const lenke = $<HTMLInputElement>("lenke");
const aapne = $<HTMLButtonElement>("aapne");
const innstillinger = $<HTMLDetailsElement>("innstillinger");
const nokkel = $<HTMLInputElement>("nokkel");
const nokkeletikett = $("nokkeletikett");
const husk = $<HTMLInputElement>("husk");
const modell = $<HTMLSelectElement>("modell");
const hentmodeller = $<HTMLButtonElement>("hentmodeller");
const ghtoken = $<HTMLInputElement>("ghtoken");
const nokkelstatus = $("nokkelstatus");
const status = $("status");
const resultat = $("resultat");

// Lagring. Alt pakkes i try/catch fordi lagring kan være blokkert.
const lagre = {
  les(k: string): string | null {
    try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch { return null; }
  },
  skriv(k: string, v: string, varig: boolean) {
    try {
      (varig ? localStorage : sessionStorage).setItem(k, v);
      (varig ? sessionStorage : localStorage).removeItem(k);
    } catch { /* ignorer */ }
  },
  fjern(k: string) {
    try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch { /* ignorer */ }
  },
};

function leverandor(): Leverandor {
  return (document.querySelector<HTMLInputElement>('input[name="leverandor"]:checked')?.value as Leverandor) ?? "anthropic";
}

function fyllModeller(liste: { id: string; navn: string }[], valgt?: string | null) {
  modell.replaceChildren(...liste.map((m) => h("option", { value: m.id }, m.navn)));
  if (valgt && liste.some((m) => m.id === valgt)) modell.value = valgt;
}

function oppdaterLeverandor() {
  const lev = leverandor();
  nokkeletikett.textContent = lev === "anthropic" ? "Anthropic-nøkkel" : "Gemini-nøkkel";
  nokkel.placeholder = lev === "anthropic" ? "sk-ant-…" : "AIza…";
  nokkel.value = lagre.les(`nokkel:${lev}`) ?? "";
  husk.checked = !!(() => { try { return localStorage.getItem(`nokkel:${lev}`); } catch { return null; } })();
  let lagretListe: { id: string; navn: string }[] | null = null;
  try { lagretListe = JSON.parse(lagre.les(`modeller:${lev}`) ?? "null"); } catch { /* ignorer */ }
  fyllModeller(lagretListe?.length ? lagretListe : standardModeller[lev], lagre.les(`modell:${lev}`));
  oppdaterStatus();
}

function oppdaterStatus() {
  const har = nokkel.value.trim().length > 0;
  nokkelstatus.textContent = har ? `${leverandor() === "anthropic" ? "Claude" : "Gemini"} klar` : "ikke lagt inn";
  nokkelstatus.classList.toggle("ok", har);
}

function lagreNokkel() {
  const lev = leverandor();
  const v = nokkel.value.trim();
  if (v) lagre.skriv(`nokkel:${lev}`, v, husk.checked);
  else lagre.fjern(`nokkel:${lev}`);
  oppdaterStatus();
}

for (const r of document.querySelectorAll<HTMLInputElement>('input[name="leverandor"]')) {
  r.addEventListener("change", () => { lagre.skriv("leverandor", leverandor(), true); oppdaterLeverandor(); });
}
nokkel.addEventListener("input", lagreNokkel);
husk.addEventListener("change", lagreNokkel);
modell.addEventListener("change", () => lagre.skriv(`modell:${leverandor()}`, modell.value, true));
ghtoken.addEventListener("input", () => {
  const v = ghtoken.value.trim();
  if (v) lagre.skriv("ghtoken", v, husk.checked); else lagre.fjern("ghtoken");
});

hentmodeller.addEventListener("click", async () => {
  const lev = leverandor();
  if (!nokkel.value.trim()) { nokkel.focus(); return; }
  hentmodeller.disabled = true;
  hentmodeller.textContent = "Henter …";
  try {
    const liste = await hentModeller(lev, nokkel.value.trim());
    if (!liste.length) throw new Error("tom liste");
    lagre.skriv(`modeller:${lev}`, JSON.stringify(liste), true);
    fyllModeller(liste, modell.value);
    hentmodeller.textContent = `${liste.length} modeller`;
  } catch {
    hentmodeller.textContent = "Klarte ikke";
  } finally {
    hentmodeller.disabled = false;
    setTimeout(() => (hentmodeller.textContent = "Hent modeller"), 2500);
  }
});

// Ferdig eksempel som vises uten nøkkel og uten kall mot GitHub eller KI.
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-eksempel]")) {
  b.addEventListener("click", async () => {
    const { eksempelPakke, eksempelForklaring } = await import("./eksempel");
    lenke.value = "";
    history.replaceState(null, "", location.pathname);
    status.hidden = false;
    status.replaceChildren(
      h("div", { class: "boks statuskort" },
        h("h2", {}, "Dette er et ferdig eksempel"),
        h("p", {}, "Det viser hva du får, og er laget på forhånd. Det trengs ingen nøkkel. For å lyse opp et prosjekt du velger selv, legger du inn en KI-nøkkel under «Din KI-nøkkel»."),
      ),
    );
    tegnResultat(resultat, eksempelForklaring, eksempelPakke, "Claude (forhåndslaget eksempel)");
    resultat.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

$("om").addEventListener("click", visOm);

// Statusvisning
function visLaster(tekst: string) {
  status.hidden = false;
  status.replaceChildren(h("div", { class: "boks statuskort" }, h("div", { class: "laster" }, lasteLykt(), tekst)));
}
function visFeil(tekst: string) {
  status.hidden = false;
  status.replaceChildren(h("div", { class: "boks statuskort feil" }, h("h2", {}, "Oi, det stoppet opp"), h("p", {}, tekst)));
}

function hurtigNokkel(lev: Leverandor, pakke: RepoPakke, m: string) {
  return `forklaring:${lev}:${m}:${pakke.info.eier}/${pakke.info.navn}@${pakke.info.commit}`;
}

let aktivPakke: RepoPakke | null = null;

async function kjorForklaring(pakke: RepoPakke) {
  const lev = leverandor();
  const k = nokkel.value.trim();
  const m = modell.value;
  const modellNavn = modell.selectedOptions[0]?.textContent ?? m;
  if (!k) {
    innstillinger.open = true;
    nokkel.focus();
    visFeil("Legg inn en nøkkel først. Den brukes bare i nettleseren din.");
    return;
  }
  visLaster(`${modellNavn} leser filene og skriver forklaringen. Dette tar gjerne ett til to minutter …`);
  resultat.hidden = true;
  try {
    const f = await forklar(lev, k, m, pakke);
    try { localStorage.setItem(hurtigNokkel(lev, pakke, m), JSON.stringify(f)); } catch { /* full eller blokkert */ }
    status.hidden = true;
    tegnResultat(resultat, f, pakke, modellNavn);
    resultat.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    visFeil(e instanceof Error ? e.message : "Noe gikk galt.");
  }
}

function visAnslag(pakke: RepoPakke) {
  const lev = leverandor();
  const m = modell.value;
  const tokens = anslagTokens(pakke);
  const pris = anslagPris(m, tokens);
  const lagret = (() => { try { return localStorage.getItem(hurtigNokkel(lev, pakke, m)); } catch { return null; } })();

  const forklarKnapp = h("button", { type: "button", class: "knapp knapp-gul" }, lagret ? "Lag ny forklaring" : "Lys opp prosjektet");
  forklarKnapp.addEventListener("click", () => kjorForklaring(pakke));
  const knapper = h("div", { class: "verktoy" }, forklarKnapp);
  if (lagret) {
    const vis = h("button", { type: "button", class: "knapp knapp-mynte" }, "Vis lagret forklaring (gratis)");
    vis.addEventListener("click", () => {
      status.hidden = true;
      tegnResultat(resultat, JSON.parse(lagret) as Forklaring, pakke, modell.selectedOptions[0]?.textContent ?? m);
    });
    knapper.prepend(vis);
  }

  status.hidden = false;
  status.replaceChildren(
    h("div", { class: "boks statuskort" },
      h("h2", {}, `Lykta har sett på ${pakke.info.eier}/${pakke.info.navn}`),
      pakke.info.beskrivelse && h("p", {}, pakke.info.beskrivelse),
      h("div", { class: "anslag" },
        h("span", { class: "merke" }, `${pakke.filer.length} filer valgt av ${pakke.antallFiler}`),
        h("span", { class: "merke" }, `ca. ${tokens.toLocaleString("nb-NO")} tokens inn`),
        h("span", { class: "merke" }, pris ? `Anslått pris: ${pris}` : "Pris: se leverandøren din"),
      ),
      knapper,
    ),
  );
}

skjema.addEventListener("submit", async (e) => {
  e.preventDefault();
  const r = tolkLenke(lenke.value);
  if (!r) { visFeil("Det ser ikke ut som en GitHub-lenke. Skriv for eksempel github.com/eier/prosjekt."); return; }
  aapne.disabled = true;
  resultat.hidden = true;
  try {
    aktivPakke = await hentRepo(r.eier, r.navn, ghtoken.value.trim() || undefined, visLaster);
    history.replaceState(null, "", `#${r.eier}/${r.navn}`);
    visAnslag(aktivPakke);
  } catch (err) {
    visFeil(err instanceof TypeError ? "Fikk ikke kontakt med GitHub. Sjekk nettet." : (err as Error).message);
  } finally {
    aapne.disabled = false;
  }
});

// Ved oppstart
const lagretLev = lagre.les("leverandor");
if (lagretLev === "gemini") document.querySelector<HTMLInputElement>('input[value="gemini"]')!.checked = true;
ghtoken.value = lagre.les("ghtoken") ?? "";
oppdaterLeverandor();
modell.addEventListener("change", () => { if (aktivPakke && !status.hidden) visAnslag(aktivPakke); });
if (location.hash.length > 3) {
  lenke.value = decodeURIComponent(location.hash.slice(1));
  skjema.requestSubmit();
}
