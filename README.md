# Kodelykta

Lim inn et GitHub-prosjekt og få det forklart på norsk: hva det er, et diagram over hvordan det henger sammen, mappeoversikt, deleliste og trinn for macOS, Windows og Linux.

Siden har ingen tjener. Brukeren legger inn sin egen nøkkel (Claude eller Gemini), og nettleseren snakker direkte med GitHub og KI-leverandøren. Nøkkelen lagres bare i nettleseren.

## Kjøre lokalt

```bash
npm install
npm run dev
```

## Bygge og publisere

```bash
npm run build
```

Innholdet i `dist/` er en statisk side som kan legges på GitHub Pages, Netlify eller Cloudflare Pages. Arbeidsflyten i `.github/workflows/pages.yml` bygger og publiserer siden på GitHub Pages ved hver push til `main`. Bygget har en streng innholdssikkerhetspolicy som bare tillater kall til GitHub, Anthropic og Google.

## Filer

- `src/github.ts`: henter metadata, filtre og utvalgte oppsettfiler
- `src/llm.ts`: instruksjonen til modellen og kall til Claude og Gemini
- `src/schema.ts`: JSON-skjemaet svaret må følge
- `src/render.ts`: tegner resultatsiden og Markdown-eksporten
- `src/main.ts`: skjema, innstillinger og lagring i nettleseren
