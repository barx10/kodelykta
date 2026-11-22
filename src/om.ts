// Om-vinduet: hva siden er, og hvem som har laget den.

export function visOm() {
  document.querySelector(".om")?.remove();
  const tilbakeFokus = document.activeElement as HTMLElement | null;
  const dialog = document.createElement("dialog");
  dialog.className = "dialog om";
  dialog.setAttribute("aria-labelledby", "om-tittel");
  dialog.innerHTML = `
    <h2 id="om-tittel">Om Kodelykta</h2>
    <p>Kodelykta lyser opp oppsettfilene i et GitHub-prosjekt og forklarer hva det er, hvordan det henger sammen,
      hva du trenger og hvordan du får det i gang. Den virker bare på åpne prosjekter. Siden har ingen tjener, og nøkkelen din sendes bare direkte fra nettleseren til Anthropic eller Google.
      Koden er åpen: <a href="https://github.com/barx10/kodelykta" target="_blank" rel="noopener">github.com/barx10/kodelykta</a>.</p>
    <div class="om-person">
      <img class="om-logo" src="./logo.png" alt="Lærerliv. Fra klasserom til storsamfunn." width="2560" height="1449" />
      <h3>Kenneth Bareksten</h3>
      <p>Lærer og hobbyprogrammerer som lager digitale verktøy for å gjøre hverdagen litt enklere og mer kreativ.</p>
      <p><a href="https://www.laererliv.no" target="_blank" rel="noopener">www.laererliv.no</a><br />
        <a href="mailto:kenneth@laererliv.no">kenneth@laererliv.no</a></p>
    </div>
    <form method="dialog" class="om-knapper">
      <button class="knapp knapp-gul">Lukk</button>
    </form>`;
  document.body.append(dialog);
  dialog.addEventListener("close", () => {
    dialog.remove();
    if (tilbakeFokus?.isConnected) tilbakeFokus.focus();
  });
  dialog.showModal();
  dialog.querySelector("button")?.focus();
}
