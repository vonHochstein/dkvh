// --- Footer year ---
document.getElementById("year").textContent = String(new Date().getFullYear());

// --- Copy mail (Platzhalter) ---
document.getElementById("copyMail")?.addEventListener("click", async () => {
  const mail = "mail@dkvh.de"; // später ersetzen
  try{
    await navigator.clipboard.writeText(mail);
    const hint = document.getElementById("copyHint");
    if (hint) hint.textContent = "Kopiert: " + mail;
  }catch{
    const hint = document.getElementById("copyHint");
    if (hint) hint.textContent = "Kopieren nicht möglich – bitte manuell: " + mail;
  }
});

// --- Custom Feather Cursor ---
const feather = document.getElementById("featherCursor");

if (feather) {
  // Start hidden until we actually see the mouse inside the window
  let cursorVisible = false;
  feather.style.opacity = "0";

  function showCursor(){
    if (!cursorVisible) {
      feather.style.opacity = "1";
      cursorVisible = true;
    }
  }

  function hideCursor(){
    if (cursorVisible) {
      feather.style.opacity = "0";
      cursorVisible = false;
    }
  }

  const offsetX = 8;   // Hotspot horizontal
  const offsetY = 42;  // Hotspot vertical (Spitze unten links)

  let lastX = null;
  let lastY = null;

  // Position (direkt, ohne Lag)
  let posX = 0;
  let posY = 0;

  // Rotation smoothing to avoid jitter on slow movement
  let rotCurrent = 0;
  let rotTarget = 0;

  // Click impulse (scale)
  let scaleCurrent = 1;
  let scaleTarget = 1;

  // Tuning
  const rotStrength = 0.12;     // overall rotation amount
  const rotLerp = 0.18;         // rotation smoothing (0.1-0.25 is nice)
  const deadzonePx = 1.2;       // ignore tiny movements (prevents jitter)
  const maxRotDeg = 18;         // clamp rotation for a noble feel

  const scaleLerp = 0.22;       // scale smoothing
  const scaleDown = 0.92;       // click down scale

  function clamp(v, min, max){
    return Math.max(min, Math.min(max, v));
  }

  // Hover highlight (optional, if CSS class exists)
  const hoverTargets = document.querySelectorAll("a, button, .btn, .nav__link");
  hoverTargets.forEach(el => {
    el.addEventListener("mouseenter", () => feather.classList.add("cursor-hover"));
    el.addEventListener("mouseleave", () => feather.classList.remove("cursor-hover"));
  });

  document.addEventListener("mousemove", (e) => {
    showCursor();
    // Keep position direct
    posX = e.clientX - offsetX;
    posY = e.clientY - offsetY;

    // First move: initialize without rotation jump
    if (lastX === null || lastY === null) {
      lastX = e.clientX;
      lastY = e.clientY;
      return;
    }

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dist = Math.hypot(dx, dy);

    // Only update target angle when the mouse actually moved enough
    if (dist >= deadzonePx) {
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      rotTarget = clamp(angle * rotStrength, -maxRotDeg, maxRotDeg);
    }

    lastX = e.clientX;
    lastY = e.clientY;
  });

  // Click impulse
  document.addEventListener("mousedown", () => {
    scaleTarget = scaleDown;
  });

  document.addEventListener("mouseup", () => {
    scaleTarget = 1;
  });

  // Hide when the pointer leaves the window (Safari-safe)
  window.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget && !e.toElement) {
      hideCursor();
    }
  });

  // Show again when re-entering
  window.addEventListener("mouseover", () => {
    showCursor();
  });

  // Also hide when the tab becomes hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hideCursor();
  });

  // In case the user switches window / tab
  window.addEventListener("blur", () => {
    scaleTarget = 1;
    hideCursor();
  });

  // Render loop (position stays direct; rotation/scale get smoothed)
  function render(){
    rotCurrent += (rotTarget - rotCurrent) * rotLerp;
    scaleCurrent += (scaleTarget - scaleCurrent) * scaleLerp;

    feather.style.transform =
      `translate(${posX}px, ${posY}px) rotate(${rotCurrent}deg) scale(${scaleCurrent})`;

    requestAnimationFrame(render);
  }

  render();
}


// =========================================================
// Mobile Burger Menü (Drawer)
// =========================================================
(() => {
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('#mobileNav');
  if (!burger || !mobileNav) return;

  const closeEls = mobileNav.querySelectorAll('[data-nav-close]');

  const setOpen = (open) => {
    document.body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileNav.setAttribute('aria-hidden', open ? 'false' : 'true');
  };

  burger.addEventListener('click', () => {
    const isOpen = document.body.classList.contains('nav-open');
    setOpen(!isOpen);
  });

  closeEls.forEach((el) => el.addEventListener('click', () => setOpen(false)));

  // Close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  // Close after clicking a link
  mobileNav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });
})();