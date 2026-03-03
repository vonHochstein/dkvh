(() => {
  const elH = document.getElementById("itHour");
  const elM = document.getElementById("itMinute");
  const elS = document.getElementById("itSecond");

  if (!elH || !elM || !elS) return;

  // ===== Feinjustage (in Zeit-Einheiten) =====
  // Diese Offsets ändern NICHT die Geschwindigkeit, nur die Stellung.
  // (Gut bei minimal schiefen Zuschnitten/Transform-Origin.)
  const OFFSET_SECONDS = -0;   // z.B. -3 = 3 Sekunden zurück
  const OFFSET_MINUTES = -0;   // z.B. -1 = 1 Minute zurück
  const OFFSET_HOUR_MINUTES = 0; // Minutenversatz am Stundenzeiger (z.B. -2)

  const setRot = (el, deg) => {
    // Wichtig: translate bleibt gleich, nur rotate ändert sich
    el.style.transform = `translate(-50%, -100%) rotate(${deg}deg)`;
  };

  const tick = () => {
    const now = new Date();
    const ms = now.getMilliseconds();
    const s  = now.getSeconds() + ms / 1000;
    const m  = now.getMinutes() + s / 60;
    const h  = (now.getHours() % 12) + m / 60;

    // Offsets werden in Zeit addiert und dann in Winkel umgerechnet
    const sAdj = s + OFFSET_SECONDS;
    const mAdj = m + OFFSET_MINUTES + (OFFSET_SECONDS / 60);
    const hAdj = h + (OFFSET_HOUR_MINUTES / 60);

    const degS = sAdj * 6;      // 360/60
    const degM = mAdj * 6;
    const degH = hAdj * 30;     // 360/12

    setRot(elS, degS);
    setRot(elM, degM);
    setRot(elH, degH);

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
})();