// Accordion: immer nur ein <details> pro Gruppe offen
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".serviceAcc").forEach((group) => {
    group.addEventListener("toggle", (e) => {
      const opened = e.target;
      if (!(opened instanceof HTMLDetailsElement)) return;
      if (!opened.open) return;

      group.querySelectorAll("details[open]").forEach((d) => {
        if (d !== opened) d.open = false;
      });
    }, true);
  });
});