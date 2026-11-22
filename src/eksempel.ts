// Ferdig eksempel som vises uten API-nøkkel. Forklaringen er skrevet på forhånd
// ut fra filene i barx10/klassespillet (commit 093b189), i samme format som
// KI-svaret bruker. Lastes først når noen trykker «Prøv et eksempel».

import type { RepoPakke } from "./github";
import type { Forklaring } from "./schema";

export const eksempelPakke: RepoPakke = {
  info: {
    eier: "barx10",
    navn: "klassespillet",
    gren: "main",
    commit: "093b189b1fa77b1fa7af1ebe2fc85c50a5e51518",
    beskrivelse: "Good Behavior Game på tavla.",
    lisens: "MIT",
    stjerner: 0,
    sistOppdatert: "2026-11-17T09:30:36Z",
    arkivert: false,
    spraak: "JavaScript",
  },
  antallFiler: 43,
  mappeoversikt: "",
  filer: [
    { sti: "README.md", innhold: "", avkortet: false },
    { sti: "package.json", innhold: "", avkortet: false },
    { sti: "js/app.js", innhold: "", avkortet: true },
  ],
};

export const eksempelForklaring: Forklaring = {
  navn: "Klassespillet",
  oppsummering:
    "Klassespillet er en nettside som læreren viser på tavla mens klassen spiller Good Behavior Game. Klassen følger tre regler sammen gjennom en økt. Klarer de det, trekker læreren noe fra en liste elevene selv har foreslått.",
  for_hvem: "Lærere som vil bruke Good Behavior Game i klasserommet. Du trenger ikke kunne programmere.",
  enkelt: {
    forklaring:
      "Du åpner en nettside og velger en klasse og et regelsett. Så starter du en økt. Brettet viser et fjell, og brikken går ett felt for hvert minutt uten brudd. Registrerer du et brudd, teller det. Når økten er over, ser klassen om de nådde målet. Alt som lagres, blir liggende i nettleseren din. Ingenting sendes til noen tjener.",
    sammenligning: "Som en digital poengtavle for klassen, bare uten navn på elever.",
  },
  trenger_jeg: {
    svar:
      "Hvis du er lærer og vil prøve Good Behavior Game, skal du bare åpne den ferdige nettsiden. Det tar null minutter å sette opp. Du trenger bare å kjøre koden selv hvis du vil endre den eller bruke den uten internett fra egen maskin.",
    enklere_alternativ: "Den ferdige nettsiden: https://klassespillet.laererliv.no",
  },
  ordliste: [
    { ord: "Good Behavior Game", forklaring: "En metode der hele klassen jobber sammen om å følge noen få regler." },
    { ord: "Node.js", forklaring: "Et program som kan kjøre JavaScript utenfor nettleseren." },
    { ord: "npm", forklaring: "Et verktøy som følger med Node.js og kjører kommandoer for et prosjekt." },
    { ord: "localStorage", forklaring: "Plass i nettleseren der en nettside kan lagre små mengder data på din maskin." },
    { ord: "service worker", forklaring: "Et lite skript som lagrer siden i nettleseren, så den virker uten nett." },
    { ord: "GitHub Pages", forklaring: "En gratis tjeneste som viser filer fra GitHub som en vanlig nettside." },
    { ord: "CSV", forklaring: "En enkel tabellfil som du kan åpne i Excel eller Regneark." },
  ],
  vurdering: {
    lisens: "MIT for koden. Skrifter og musikk har egne lisenser.",
    vedlikehold: "Aktivt. Siste endring ble gjort 17. november 2026.",
    vanskelighetsgrad: "lett",
    tidsbruk: "0 minutter med nettsiden, ca. 5 minutter for å kjøre den lokalt",
  },
  diagram: {
    mermaid: [
      "flowchart LR",
      "  L[Læreren] --> N[Nettleseren]",
      "  N --> A[app.js: visninger]",
      "  A --> O[okt.js: tid og brudd]",
      "  A --> R[regler.js: regelsett]",
      "  A --> T[landskap.js: brettet på tavla]",
      "  A --> G[logg.js: logg og CSV]",
      "  O --> S[(lager.js: localStorage)]",
      "  G --> S",
      "  N --> W[sw.js: virker uten nett]",
    ].join("\n"),
    forklaring:
      "Alt skjer i nettleseren. app.js styrer hva som vises. okt.js holder styr på tid og brudd, og lager.js lagrer det på maskinen din. Det finnes ingen tjener.",
  },
  mapper: [
    { sti: "index.html", beskrivelse: "Siden appen starter fra." },
    { sti: "js/", beskrivelse: "All logikk: visninger, tidtaking, regler, landskap, logg og veiledning." },
    { sti: "css/stil.css", beskrivelse: "Utseendet." },
    { sti: "fonts/", beskrivelse: "Skriftene som følger med, så siden ikke henter dem fra nettet." },
    { sti: "lyd/", beskrivelse: "Musikken i animasjonen." },
    { sti: "sw.js", beskrivelse: "Gjør at appen virker uten nett etter første besøk." },
    { sti: "tests/", beskrivelse: "Automatiske tester av tidtaking, logg og lagring." },
    { sti: "forskningsgrunnlag.md", beskrivelse: "Hva forskningen sier, og hva den ikke sier." },
  ],
  deleliste: [
    { navn: "Nettleser", versjon: "en nyere versjon", brukes_til: "Viser og kjører appen.", sjekk_kommando: "" },
    { navn: "Node.js", versjon: "bare for å kjøre lokalt", brukes_til: "Starter en lokal webserver og kjører testene.", sjekk_kommando: "node --version" },
    { navn: "npm", versjon: "følger med Node.js", brukes_til: "Kjører kommandoene npm start og npm test.", sjekk_kommando: "npm --version" },
    { navn: "Git", versjon: "valgfritt", brukes_til: "Laster ned prosjektet. Du kan i stedet laste ned en ZIP-fil fra GitHub.", sjekk_kommando: "git --version" },
  ],
  kom_i_gang: {
    macos: {
      virker: "ja",
      merknad: "Enklest er å bruke den ferdige nettsiden. Trinnene under er for deg som vil kjøre den selv.",
      steg: [
        { tittel: "Bruk nettsiden", forklaring: "Åpne adressen i nettleseren. Da trenger du ikke gjøre mer.", kommando: "" },
        { tittel: "Last ned prosjektet", forklaring: "Henter alle filene til en ny mappe.", kommando: "git clone https://github.com/barx10/klassespillet.git" },
        { tittel: "Gå inn i mappen", forklaring: "", kommando: "cd klassespillet" },
        { tittel: "Start en lokal server", forklaring: "Appen lastes som moduler og trenger en server. Kommandoen starter den.", kommando: "npm start" },
        { tittel: "Åpne appen", forklaring: "Skriv http://localhost:5173 i nettleseren.", kommando: "" },
      ],
    },
    windows: {
      virker: "ja",
      merknad: "Bruk PowerShell. Kommandoene er de samme som på Mac.",
      steg: [
        { tittel: "Bruk nettsiden", forklaring: "Åpne adressen i nettleseren. Da trenger du ikke gjøre mer.", kommando: "" },
        { tittel: "Last ned prosjektet", forklaring: "Henter alle filene til en ny mappe.", kommando: "git clone https://github.com/barx10/klassespillet.git" },
        { tittel: "Gå inn i mappen", forklaring: "", kommando: "cd klassespillet" },
        { tittel: "Start en lokal server", forklaring: "Starter serveren på port 5173.", kommando: "npm start" },
        { tittel: "Åpne appen", forklaring: "Skriv http://localhost:5173 i nettleseren.", kommando: "" },
      ],
    },
    linux: {
      virker: "ja",
      merknad: "Kommandoene er de samme som på Mac.",
      steg: [
        { tittel: "Bruk nettsiden", forklaring: "Åpne adressen i nettleseren. Da trenger du ikke gjøre mer.", kommando: "" },
        { tittel: "Last ned prosjektet", forklaring: "Henter alle filene til en ny mappe.", kommando: "git clone https://github.com/barx10/klassespillet.git" },
        { tittel: "Gå inn i mappen", forklaring: "", kommando: "cd klassespillet" },
        { tittel: "Start en lokal server", forklaring: "Starter serveren på port 5173.", kommando: "npm start" },
        { tittel: "Åpne appen", forklaring: "Skriv http://localhost:5173 i nettleseren.", kommando: "" },
      ],
    },
  },
  begrensninger: [
    "Dataene lagres bare i nettleseren på maskinen du bruker. Bytter du maskin eller nettleser, følger de ikke med.",
    "Appen trenger en webserver. Å dobbeltklikke på index.html virker trolig ikke.",
    "Skriftene og musikken har egne lisenser som skiller seg fra MIT.",
  ],
};
