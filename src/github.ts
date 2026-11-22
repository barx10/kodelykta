// Henter metadata, filtre og et utvalg filer fra GitHub, direkte fra nettleseren.
// Bare to kall går mot api.github.com (som har grense). Filinnholdet hentes
// fra raw.githubusercontent.com, som ikke teller mot grensen.

export type RepoInfo = {
  eier: string;
  navn: string;
  gren: string;
  commit: string;
  beskrivelse: string;
  lisens: string;
  stjerner: number;
  sistOppdatert: string;
  arkivert: boolean;
  spraak: string;
};

export type HentetFil = { sti: string; innhold: string; avkortet: boolean };

export type RepoPakke = {
  info: RepoInfo;
  antallFiler: number;
  mappeoversikt: string;
  filer: HentetFil[];
};

const MAKS_TEGN_PER_FIL = 25_000;
const MAKS_TEGN_TOTALT = 160_000;

export function tolkLenke(tekst: string): { eier: string; navn: string } | null {
  const t = tekst.trim().replace(/\.git$/, "").replace(/\/+$/, "");
  const m =
    t.match(/github\.com[/:]([\w.-]+)\/([\w.-]+)/i) ??
    t.match(/^([\w.-]+)\/([\w.-]+)$/);
  return m ? { eier: m[1], navn: m[2] } : null;
}

async function gh<T>(sti: string, token?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const svar = await fetch(`https://api.github.com${sti}`, { headers });
  if (svar.status === 404) throw new Error("Fant ikke prosjektet. Kodelykta virker bare på åpne prosjekter, så sjekk lenken og at prosjektet ikke er privat.");
  if (svar.status === 403 || svar.status === 429) {
    throw new Error("GitHub-grensen er nådd (60 kall i timen uten token). Legg inn et GitHub-token eller vent litt.");
  }
  if (!svar.ok) throw new Error(`GitHub svarte ${svar.status}.`);
  return svar.json() as Promise<T>;
}

// Filer som forteller mest om hva prosjektet er og hvordan det startes.
// Lavere tall betyr høyere prioritet.
function prioritet(sti: string): number | null {
  const s = sti.toLowerCase();
  const navn = s.split("/").pop()!;
  const dybde = s.split("/").length - 1;

  if (/^readme(\.(md|rst|txt))?$/.test(s)) return 0;
  if (dybde === 0) {
    if (/^(package\.json|pyproject\.toml|cargo\.toml|go\.mod|gemfile|composer\.json|pom\.xml|build\.gradle(\.kts)?|setup\.py|requirements\.txt|deno\.json|mix\.exs|pubspec\.yaml)$/.test(navn)) return 1;
    if (/^(dockerfile|docker-compose\.ya?ml|compose\.ya?ml)$/.test(navn)) return 2;
    if (/^(\.env\.example|\.env\.sample|makefile|justfile|\.nvmrc|\.python-version|\.tool-versions|rust-toolchain(\.toml)?)$/.test(navn)) return 3;
    if (/^(install|contributing|development|setup)(\.md)?$/.test(navn)) return 4;
  }
  if (/^docs?\/(install|getting[-_]started|setup|quickstart)[^/]*\.md$/.test(s)) return 4;
  if (/^\.github\/workflows\/[^/]+\.ya?ml$/.test(s)) return 5;
  if (dybde <= 2 && /^(main|index|app|server|cli|__main__)\.(ts|js|py|go|rs|rb|java|kt|php)$/.test(navn)) return 6;
  if (/^cmd\/[^/]+\/main\.go$/.test(s)) return 6;
  if (dybde === 1 && /^(package\.json|pyproject\.toml|cargo\.toml|go\.mod|dockerfile)$/.test(navn)) return 7;
  return null;
}

function lagMappeoversikt(stier: string[]): string {
  // Vis de to øverste nivåene, og hvor mange filer hver mappe har.
  const teller = new Map<string, number>();
  for (const sti of stier) {
    const deler = sti.split("/");
    const nøkkel = deler.length === 1 ? deler[0] : deler.slice(0, Math.min(2, deler.length - 1)).join("/") + "/";
    teller.set(nøkkel, (teller.get(nøkkel) ?? 0) + 1);
  }
  return [...teller.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 300)
    .map(([k, n]) => (k.endsWith("/") ? `${k} (${n} filer)` : k))
    .join("\n");
}

export async function hentRepo(
  eier: string,
  navn: string,
  token?: string,
  status?: (t: string) => void,
): Promise<RepoPakke> {
  status?.("Ser på prosjektet …");
  const repo = await gh<any>(`/repos/${eier}/${navn}`, token);
  const gren: string = repo.default_branch;

  status?.("Leser mappestrukturen …");
  const tre = await gh<any>(`/repos/${eier}/${navn}/git/trees/${encodeURIComponent(gren)}?recursive=1`, token);
  const stier: string[] = (tre.tree as any[]).filter((t) => t.type === "blob").map((t) => t.path);

  const valgt = stier
    .map((sti) => ({ sti, p: prioritet(sti) }))
    .filter((x): x is { sti: string; p: number } => x.p !== null)
    .sort((a, b) => a.p - b.p || a.sti.length - b.sti.length);

  // Maks tre arbeidsflyter og fire inngangspunkter, så de ikke fortrenger resten.
  const kvote: Record<number, number> = { 5: 3, 6: 4, 7: 4 };
  const utvalg = valgt.filter((x) => (kvote[x.p] === undefined ? true : kvote[x.p]-- > 0)).slice(0, 25);

  status?.(`Henter ${utvalg.length} filer …`);
  const filer: HentetFil[] = [];
  let totalt = 0;
  const hentet = await Promise.all(
    utvalg.map(async ({ sti }) => {
      const url = `https://raw.githubusercontent.com/${eier}/${navn}/${tre.sha}/${sti.split("/").map(encodeURIComponent).join("/")}`;
      const r = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      return r.ok ? { sti, tekst: await r.text() } : null;
    }),
  );
  for (const h of hentet) {
    if (!h || totalt >= MAKS_TEGN_TOTALT) continue;
    const plass = Math.min(MAKS_TEGN_PER_FIL, MAKS_TEGN_TOTALT - totalt);
    const avkortet = h.tekst.length > plass;
    const innhold = avkortet ? h.tekst.slice(0, plass) : h.tekst;
    totalt += innhold.length;
    filer.push({ sti: h.sti, innhold, avkortet });
  }

  return {
    info: {
      eier,
      navn: repo.name,
      gren,
      commit: tre.sha,
      beskrivelse: repo.description ?? "",
      lisens: repo.license?.spdx_id ?? "ukjent",
      stjerner: repo.stargazers_count,
      sistOppdatert: repo.pushed_at,
      arkivert: repo.archived,
      spraak: repo.language ?? "",
    },
    antallFiler: stier.length,
    mappeoversikt: lagMappeoversikt(stier) + (tre.truncated ? "\n(listen er avkortet av GitHub)" : ""),
    filer,
  };
}
