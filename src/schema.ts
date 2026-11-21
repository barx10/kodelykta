// JSON-skjemaet modellen må svare etter. Alle objekter har
// additionalProperties: false og alle felt er påkrevd, slik at
// strukturert utdata hos begge leverandørene godtar det.

const steg = {
  type: "object",
  additionalProperties: false,
  required: ["tittel", "forklaring", "kommando"],
  properties: {
    tittel: { type: "string" },
    forklaring: { type: "string" },
    kommando: { type: "string", description: "Tom streng hvis steget ikke har kommando" },
  },
};

const os = {
  type: "object",
  additionalProperties: false,
  required: ["virker", "merknad", "steg"],
  properties: {
    virker: { type: "string", enum: ["ja", "kanskje", "nei"] },
    merknad: { type: "string" },
    steg: { type: "array", items: steg },
  },
};

export const forklaringSkjema = {
  type: "object",
  additionalProperties: false,
  required: [
    "navn",
    "oppsummering",
    "for_hvem",
    "enkelt",
    "trenger_jeg",
    "ordliste",
    "vurdering",
    "diagram",
    "mapper",
    "deleliste",
    "kom_i_gang",
    "begrensninger",
  ],
  properties: {
    navn: { type: "string" },
    oppsummering: { type: "string", description: "2 til 4 setninger på enkel norsk" },
    for_hvem: { type: "string" },
    enkelt: {
      type: "object",
      additionalProperties: false,
      required: ["forklaring", "sammenligning"],
      properties: {
        forklaring: { type: "string", description: "3 til 5 setninger helt uten fagord" },
        sammenligning: { type: "string", description: "Ett bilde fra hverdagen, for eksempel «Som Ctrl+F, men for alle filene samtidig»" },
      },
    },
    trenger_jeg: {
      type: "object",
      additionalProperties: false,
      required: ["svar", "enklere_alternativ"],
      properties: {
        svar: { type: "string", description: "Hva en vanlig bruker får ut av dette, og når det ikke er verdt bryet" },
        enklere_alternativ: { type: "string", description: "En enklere ferdig app eller tjeneste, eller tom streng" },
      },
    },
    ordliste: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ord", "forklaring"],
        properties: {
          ord: { type: "string", description: "Fagordet slik det står i teksten" },
          forklaring: { type: "string", description: "Én enkel setning" },
        },
      },
    },
    vurdering: {
      type: "object",
      additionalProperties: false,
      required: ["lisens", "vedlikehold", "vanskelighetsgrad", "tidsbruk"],
      properties: {
        lisens: { type: "string" },
        vedlikehold: { type: "string" },
        vanskelighetsgrad: { type: "string", enum: ["lett", "middels", "vanskelig"] },
        tidsbruk: { type: "string" },
      },
    },
    diagram: {
      type: "object",
      additionalProperties: false,
      required: ["mermaid", "forklaring"],
      properties: {
        mermaid: { type: "string", description: "Gyldig Mermaid flowchart-kode" },
        forklaring: { type: "string" },
      },
    },
    mapper: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sti", "beskrivelse"],
        properties: { sti: { type: "string" }, beskrivelse: { type: "string" } },
      },
    },
    deleliste: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["navn", "versjon", "brukes_til", "sjekk_kommando"],
        properties: {
          navn: { type: "string" },
          versjon: { type: "string" },
          brukes_til: { type: "string" },
          sjekk_kommando: { type: "string" },
        },
      },
    },
    kom_i_gang: {
      type: "object",
      additionalProperties: false,
      required: ["macos", "windows", "linux"],
      properties: { macos: os, windows: os, linux: os },
    },
    begrensninger: { type: "array", items: { type: "string" } },
  },
} as const;

export type Steg = { tittel: string; forklaring: string; kommando: string };
export type OsDel = { virker: "ja" | "kanskje" | "nei"; merknad: string; steg: Steg[] };
export type Forklaring = {
  navn: string;
  oppsummering: string;
  for_hvem: string;
  enkelt: { forklaring: string; sammenligning: string };
  trenger_jeg: { svar: string; enklere_alternativ: string };
  ordliste: { ord: string; forklaring: string }[];
  vurdering: {
    lisens: string;
    vedlikehold: string;
    vanskelighetsgrad: "lett" | "middels" | "vanskelig";
    tidsbruk: string;
  };
  diagram: { mermaid: string; forklaring: string };
  mapper: { sti: string; beskrivelse: string }[];
  deleliste: { navn: string; versjon: string; brukes_til: string; sjekk_kommando: string }[];
  kom_i_gang: { macos: OsDel; windows: OsDel; linux: OsDel };
  begrensninger: string[];
};

/** Enkel kontroll av at svaret har formen vi trenger før vi tegner det. */
export function erForklaring(x: unknown): x is Forklaring {
  if (!x || typeof x !== "object") return false;
  const f = x as Record<string, any>;
  const osOk = (o: any) => o && typeof o.virker === "string" && Array.isArray(o.steg);
  return (
    typeof f.navn === "string" &&
    typeof f.oppsummering === "string" &&
    f.enkelt && typeof f.enkelt.forklaring === "string" &&
    f.trenger_jeg && typeof f.trenger_jeg.svar === "string" &&
    Array.isArray(f.ordliste) &&
    f.vurdering && typeof f.vurdering === "object" &&
    f.diagram && typeof f.diagram.mermaid === "string" &&
    Array.isArray(f.mapper) &&
    Array.isArray(f.deleliste) &&
    f.kom_i_gang && osOk(f.kom_i_gang.macos) && osOk(f.kom_i_gang.windows) && osOk(f.kom_i_gang.linux) &&
    Array.isArray(f.begrensninger)
  );
}
