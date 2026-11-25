// The contribution calendar on a graphics card seen straight on from the fan side, as on a spec sheet:
// a brushed-aluminium frame around a dark shroud plate, the axial fan by the I/O bracket, the louvred
// flow-through window at the far end, and the calendar as round LEDs behind dark glass, laid out like
// GitHub's graph (one column per week, Sunday on top, each LED lit on the blue ramp by its level).
// The printed line under the LEDs carries the real total; the PCIe x16 fingers show below the frame.
import { COND, fixed, PALETTE as p } from "./style.mjs";

/** Best streak, running streak, busiest day and mean contributions per day. */
export function calendarStats(days) {
  let best = 0;
  let run = 0;
  let maxDay = { date: days[0]?.date ?? "", count: 0 };
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    best = Math.max(best, run);
    if (d.count > maxDay.count) maxDay = { date: d.date, count: d.count };
  }
  const total = days.reduce((n, d) => n + d.count, 0);
  return { bestStreak: best, currentStreak: run, maxDay, average: days.length ? Math.round((total / days.length) * 100) / 100 : 0, total };
}

export const CARD_WEEKS = 18;

const r2 = (v) => Math.round(v * 100) / 100;
const rect = (x, y, w, h, fill, extra = "") => `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${fill}"${extra}/>`;
const circ = (cx, cy, r, fill, extra = "") => `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}"${extra}/>`;

// Layout in the 440 x 232 card slot; everything stays left of x 372 (the tech stack starts at 384).
const BODY = { x: 24, y: 40, w: 338, h: 128 };
const PLATE = { x: 32, y: 48, w: 322, h: 112 };
const FAN = { cx: 98, cy: 104, r: 48 };
const LED = { x: 166, y: 80, pitch: 7.4, r: 2.5 };
const GRILLE = { x: 318, y: 56, w: 30, h: 96 };
const PCIE = { y: BODY.y + BODY.h - 1, h: 14, short: [70, 104], long: [108, 330], pitch: 3, contact: 1.9 };

/** Fan blades: `n` swept blades between the hub and the rim, each a curved wedge. */
function blades(cx, cy, rHub, rTip, n) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const pt = (r, t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)];
    const [x0, y0] = pt(rHub, a);
    const [x1, y1] = pt(rTip, a + 0.55);
    const [x2, y2] = pt(rTip, a + 0.95);
    const [x3, y3] = pt(rHub, a + 0.42);
    const [c1x, c1y] = pt((rHub + rTip) / 2, a + 0.12);
    const [c2x, c2y] = pt((rHub + rTip) / 2, a + 0.62);
    d += `M${r2(x0)} ${r2(y0)}Q${r2(c1x)} ${r2(c1y)} ${r2(x1)} ${r2(y1)}L${r2(x2)} ${r2(y2)}Q${r2(c2x)} ${r2(c2y)} ${r2(x3)} ${r2(y3)}Z`;
  }
  return d;
}

export function renderCalendarCard(calendar, { fonts = "" } = {}) {
  const W0 = 440;
  const H0 = 232;
  const weeks = calendar.weeks.slice(-CARD_WEEKS);
  const stats = calendarStats(weeks.flat());

  const defs = `
    <linearGradient id="card-alu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4e8ed"/><stop offset="0.45" stop-color="#b9c0c9"/><stop offset="1" stop-color="#8a929d"/></linearGradient>
    <linearGradient id="card-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b313b"/><stop offset="1" stop-color="#1a1e25"/></linearGradient>
    <linearGradient id="card-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c848f"/><stop offset="0.5" stop-color="#c9ced5"/><stop offset="1" stop-color="#6d747e"/></linearGradient>
    <linearGradient id="card-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.1"/><stop offset="0.4" stop-color="#ffffff" stop-opacity="0.02"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
    <linearGradient id="card-fin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5b636e"/><stop offset="0.5" stop-color="#aeb5be"/><stop offset="1" stop-color="#4b525c"/></linearGradient>
    <radialGradient id="card-well" cx="0.5" cy="0.5" r="0.5"><stop offset="0.3" stop-color="#05070a"/><stop offset="1" stop-color="#151a21"/></radialGradient>
    <radialGradient id="card-hub" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#7a838f"/><stop offset="1" stop-color="#2a3039"/></radialGradient>
    <linearGradient id="card-blade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a525e"/><stop offset="1" stop-color="#252a32"/></linearGradient>
    <linearGradient id="card-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1d58a"/><stop offset="1" stop-color="#b8892f"/></linearGradient>
    <filter id="card-shadow" x="-10%" y="-80%" width="120%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="card-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="card-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.8" numOctaves="2" seed="11"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.22"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter>
    <clipPath id="card-fan"><circle cx="${FAN.cx}" cy="${FAN.cy}" r="${FAN.r}"/></clipPath>`;

  let s = "";
  // Soft contact shadow under the card.
  s += rect(BODY.x + 8, BODY.y + BODY.h - 10, BODY.w - 16, 20, "#000", ` rx="10" fill-opacity="0.55" filter="url(#card-shadow)"`);

  // I/O bracket seen edge-on: the steel plate along the end, with its screw tab and the tongue below.
  s += `<path d="M6 30H22V206H17V196H10V44H6Z" fill="url(#card-steel)"/>` + rect(6, 30, 16, 1, "#e6e9ee") + circ(13, 37, 2.2, "#3a4049") + circ(13, 37, 1, "#9aa2ad");

  // PCIe x16 fingers on the PCB below the frame: an 11-contact segment, the key notch, then 71 contacts.
  for (const [x0, x1] of [PCIE.short, PCIE.long]) {
    s += rect(x0, PCIE.y, x1 - x0, PCIE.h, "#17202b", ` data-edge="${x0}"`);
    const n = Math.floor((x1 - x0 - 1) / PCIE.pitch);
    for (let i = 0; i < n; i++) s += rect(x0 + 1.5 + i * PCIE.pitch, PCIE.y + 2.5, PCIE.contact, PCIE.h - 4, "url(#card-gold)", ` data-contact="1"`);
  }

  // Frame: brushed aluminium with a lit top chamfer and a shaded bottom edge.
  const frame = `x="${BODY.x}" y="${BODY.y}" width="${BODY.w}" height="${BODY.h}" rx="7"`;
  s += `<rect ${frame} fill="url(#card-alu)"/><rect ${frame} fill="#fff" filter="url(#card-grain)"/>`;
  s += rect(BODY.x + 6, BODY.y + 1, BODY.w - 12, 1, "#f7f9fb", ` fill-opacity="0.9"`) + rect(BODY.x + 6, BODY.y + BODY.h - 2, BODY.w - 12, 1, "#5d6570");

  // Shroud plate with corner screws.
  s += `<rect x="${PLATE.x}" y="${PLATE.y}" width="${PLATE.w}" height="${PLATE.h}" rx="4" fill="url(#card-plate)"/>`;
  s += rect(PLATE.x + 4, PLATE.y, PLATE.w - 8, 1, "#3c4450");
  for (const [sx, sy] of [[PLATE.x + 5, PLATE.y + 5], [PLATE.x + PLATE.w - 5, PLATE.y + 5], [PLATE.x + 5, PLATE.y + PLATE.h - 5], [PLATE.x + PLATE.w - 5, PLATE.y + PLATE.h - 5]]) {
    s += circ(sx, sy, 1.9, "#59616c") + circ(sx, sy, 0.8, "#1b1f26");
  }

  // Fan: aluminium ring, dark well, swept blades, hub.
  s += circ(FAN.cx, FAN.cy, FAN.r + 3, "url(#card-alu)") + circ(FAN.cx, FAN.cy, FAN.r + 3, "#fff", ` filter="url(#card-grain)"`);
  s += circ(FAN.cx, FAN.cy, FAN.r, "url(#card-well)");
  s += `<g clip-path="url(#card-fan)"><path d="${blades(FAN.cx, FAN.cy, 15, FAN.r + 2, 11)}" fill="url(#card-blade)" stroke="#5c6571" stroke-width="0.5"/></g>`;
  s += circ(FAN.cx, FAN.cy, 15, "url(#card-hub)") + circ(FAN.cx, FAN.cy, 15, "none", ` stroke="#141820" stroke-width="1"`) + circ(FAN.cx - 4, FAN.cy - 4, 4, "#ffffff", ` fill-opacity="0.08"`);

  // LED panel behind dark glass, one column per week (newest on the right), Sunday on top.
  const panel = { x: LED.x - 6, y: LED.y - 6, w: CARD_WEEKS * LED.pitch + 12 - (LED.pitch - 2 * LED.r), h: 7 * LED.pitch + 12 - (LED.pitch - 2 * LED.r) };
  s += `<rect x="${r2(panel.x)}" y="${r2(panel.y)}" width="${r2(panel.w)}" height="${r2(panel.h)}" rx="2.5" fill="#0c1016" stroke="#3a414c" stroke-width="1"/>`;
  let glow = "";
  const leds = weeks
    .flatMap((week, w) =>
      week.map(({ date, count, level }) => {
        const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
        const slot = CARD_WEEKS - weeks.length + w;
        const cx = r2(LED.x + LED.r + slot * LED.pitch);
        const cy = r2(LED.y + LED.r + dow * LED.pitch);
        const fill = level ? p.ramp[level - 1] : "#1a2130";
        if (level >= 3) glow += circ(cx, cy, LED.r + 0.8, fill, ` fill-opacity="0.7" filter="url(#card-glow)"`);
        return `<circle data-day="${date}" data-level="${level}" fill="${fill}" cx="${cx}" cy="${cy}" r="${LED.r}"><title>${date}: ${count} contributions</title></circle>`;
      }),
    )
    .join("");
  s += glow + leds;
  s += `<rect x="${r2(panel.x)}" y="${r2(panel.y)}" width="${r2(panel.w)}" height="${r2(panel.h)}" rx="2.5" fill="url(#card-glass)"/>`;

  // Printed under the LEDs, like the model name on a shroud.
  s += `<text x="${r2(panel.x)}" y="${r2(panel.y + panel.h + 13)}" font-family="${COND}" font-size="8" font-weight="500" letter-spacing="0.9" fill="#9aa3ae">${stats.total.toLocaleString("en-US")} CONTRIBUTIONS IN ${CARD_WEEKS} WEEKS</text>`;

  // Flow-through window: dark opening with louvred fins.
  s += `<rect x="${GRILLE.x}" y="${GRILLE.y}" width="${GRILLE.w}" height="${GRILLE.h}" rx="3" fill="#07090d"/>`;
  for (let fy = GRILLE.y + 3; fy < GRILLE.y + GRILLE.h - 2; fy += 4) s += rect(GRILLE.x + 2, fy, GRILLE.w - 4, 1.6, "url(#card-fin)");
  s += `<rect x="${GRILLE.x + 0.5}" y="${GRILLE.y + 0.5}" width="${GRILLE.w - 1}" height="${GRILLE.h - 1}" rx="2.5" fill="none" stroke="#9aa2ad" stroke-opacity="0.6"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W0}" height="${H0}" viewBox="0 0 ${W0} ${H0}" role="img" aria-labelledby="t d">
  <title id="t">Contribution calendar on a graphics card</title>
  <desc id="d">${stats.total} contributions in the last ${CARD_WEEKS} weeks. Best day ${stats.maxDay.count} on ${stats.maxDay.date}, best streak ${stats.bestStreak} days.</desc>
  <defs>${fonts ? `<style>${fonts}</style>` : ""}${defs}</defs>
  ${fixed(s)}
</svg>
`;
}
