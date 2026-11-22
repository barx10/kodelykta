// Om-vinduet: om siden, hvordan den brukes, og KI-nøkkelen.

export type OmFane = "om" | "slik" | "nokkel";

const dialog = document.getElementById("om-vindu") as HTMLDialogElement;
const faner = [...dialog.querySelectorAll<HTMLButtonElement>("[data-fane]")];
let tilbakeFokus: HTMLElement | null = null;

function velgFane(navn: OmFane) {
  for (const f of faner) {
    const valgt = f.dataset.fane === navn;
    f.setAttribute("aria-selected", String(valgt));
    f.tabIndex = valgt ? 0 : -1;
    document.getElementById(`fane-${f.dataset.fane}`)!.hidden = !valgt;
  }
}

faner.forEach((f, i) => {
  f.addEventListener("click", () => velgFane(f.dataset.fane as OmFane));
  f.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const neste = faner[(i + (e.key === "ArrowRight" ? 1 : faner.length - 1)) % faner.length];
    velgFane(neste.dataset.fane as OmFane);
    neste.focus();
  });
});

// Lukk ved klikk utenfor vinduet.
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener("close", () => { if (tilbakeFokus?.isConnected) tilbakeFokus.focus(); });

export function visOm(fane: OmFane = "om", fokus?: HTMLElement) {
  velgFane(fane);
  if (!dialog.open) {
    tilbakeFokus = document.activeElement as HTMLElement | null;
    dialog.showModal();
  }
  (fokus ?? faner.find((f) => f.dataset.fane === fane))?.focus();
}
