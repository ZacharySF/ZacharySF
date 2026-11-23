// The contribution calendar drawn as a Founders-Edition style flow-through graphics card in isometric:
// an aluminium frame in three anodised tones (one light from the top left), fan 1 by the I/O bracket,
// fan 2 seen through the louvred flow-through window, and the calendar as a round-LED matrix behind
// dark glass (weeks along the card, days across it, each LED lit on the blue ramp by its level).
// The side engraving carries the real total; PCIe x16 fingers and the bracket make it read as a GPU.
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

// Card body in mm-ish local units: x across (W), y along (L), z up (T).
const L = 280;
const W = 94;
const T = 32;
const C = Math.sqrt(3) / 2;
const r2 = (v) => Math.round(v * 100) / 100;
const NS = ' vector-effect="non-scaling-stroke"';
// Three tones per material: [top (lit), +y face, +x face (shade)].
const ALU = [p.silverLight, p.silver, p.silverDark];
const PCB = ["#1d2533", "#161d29", "#10151e"];
const DARK = "#2a3343";
const VOID = "#0b0f15";
const HOLE = "#07090d";
const RIM = "#1b222e";
const GLASS = "#151b25";

function mkIso(ox, oy) {
  const P = (x, y, z = 0) => [r2(ox + C * (x - y)), r2(oy + (x + y) / 2 - z)];
  return {
    P,
    pts: (a) => a.map((q) => P(...q).join(",")).join(" "),
    top: (z) => `matrix(${r2(C)} .5 ${r2(-C)} .5 ${r2(ox)} ${r2(oy - z)})`, // local (x, y)
    sx: (x0) => `matrix(${r2(-C)} .5 0 -1 ${r2(ox + C * x0)} ${r2(oy + x0 / 2)})`, // +x face (u=y, v=z up)
    sy: (y0) => `matrix(${r2(C)} .5 0 -1 ${r2(ox - C * y0)} ${r2(oy + y0 / 2)})`, // +y face (u=x, v=z up)
    sxText: (x0) => `matrix(${r2(C)} -.5 0 1 ${r2(ox + C * x0)} ${r2(oy + x0 / 2)})`, // +x face text (u=-y, w=-z)
  };
}
/** Centre the card's extreme points inside x 4..368, y 4..228 (the tech stack starts at x 384). */
const iso = (() => {
  const t = mkIso(0, 0);
  const xs = [];
  const ys = [];
  for (const q of [[-7.5, L + 11, T], [W + 9, L + 1.5, 0], [0, 0, T], [W, 0, 0], [W + 7, L - 120, 0], [W, L, 0]]) {
    const [X, Y] = t.P(...q);
    xs.push(X);
    ys.push(Y);
  }
  return mkIso(Math.round(186 - (Math.min(...xs) + Math.max(...xs)) / 2), Math.round(116 - (Math.min(...ys) + Math.max(...ys)) / 2));
})();

const poly = (q, fill, extra = "") => `<polygon points="${iso.pts(q)}" fill="${fill}"${extra}/>`;
function box(x, y, z, dx, dy, dz, [t, l, r], extra = "") {
  const [X, Y, Z] = [x + dx, y + dy, z + dz];
  return (
    poly([[X, y, Z], [X, Y, Z], [X, Y, z], [X, y, z]], r) +
    poly([[x, Y, Z], [X, Y, Z], [X, Y, z], [x, Y, z]], l) +
    poly([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]], t, extra)
  );
}
const g = (tf, inner) => `<g transform="${tf}">${inner}</g>`;
const rect = (x, y, w, h, fill, extra = "") => `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${fill}"${extra}/>`;
const circ = (cx, cy, r, fill, extra = "") => `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}"${extra}/>`;

// Axial fan (top-local): hole with a visible inner wall, swept blades at depth, hub.
function bladePaths(cx, cy, R, hub, nb, sweep) {
  const pol = (r, a) => `${r2(cx + r * Math.cos(a))},${r2(cy + r * Math.sin(a))}`;
  const step = (2 * Math.PI) / nb;
  let d = "";
  for (let i = 0; i < nb; i++) {
    const a = i * step;
    const rt = R - 1.2;
    const rm = (hub + rt) / 2;
    d += `M${pol(hub - 0.5, a)}Q${pol(rm, a + sweep * 0.25)} ${pol(rt, a + sweep)}A${r2(rt)} ${r2(rt)} 0 0 0 ${pol(rt, a + sweep - step * 0.6)}Q${pol(rm, a + sweep * 0.25 - step * 0.55)} ${pol(hub - 0.5, a - step * 0.42)}Z`;
  }
  return d;
}
function fan(id, cx, cy, R, { nb, depth, wall, cavity, blade, bladeShade, hubFill, capFill }) {
  const hub = R * 0.33;
  const bp = bladePaths(cx, cy, R, hub, nb, 0.85);
  return {
    defs: `<clipPath id="${id}"><circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(R)}"/></clipPath>`,
    body:
      circ(cx, cy, R, wall) +
      `<g clip-path="url(#${id})"><g transform="translate(${depth},${depth})">${circ(cx, cy, R, cavity)}<path d="${bp}" fill="${bladeShade}" transform="translate(1.4,1.4)"/><path d="${bp}" fill="${blade}"/></g>` +
      `<g transform="translate(${depth - 2.5},${depth - 2.5})">${circ(cx, cy, hub + 0.6, bladeShade)}${circ(cx - 1.2, cy - 1.2, hub, hubFill)}${circ(cx - 1.2, cy - 1.2, hub * 0.52, capFill)}</g></g>`,
  };
}
// Rectangular opening (top-local) whose inner walls show; content is drawn at depth.
function opening(id, x, y, w, h, depth, wallFill, floorFill, inner = "", rx = 0) {
  const r = rx ? ` rx="${rx}"` : "";
  return {
    defs: `<clipPath id="${id}"><rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}"${r}/></clipPath>`,
    body: rect(x, y, w, h, wallFill, r) + `<g clip-path="url(#${id})">${g(`translate(${depth},${depth})`, rect(x, y, w, h, floorFill, r))}${inner}</g>`,
  };
}
// Louvre plates normal to y, seen from above (top-local).
function finsY(x0, x1, y0, y1, sp, d0, h, face, edge) {
  let s = "";
  for (let y = y0; y <= y1; y += sp) {
    s += `<polygon points="${r2(x0 + d0)},${r2(y + d0)} ${r2(x1 + d0)},${r2(y + d0)} ${r2(x1 + d0 + h)},${r2(y + d0 + h)} ${r2(x0 + d0 + h)},${r2(y + d0 + h)}" fill="${face}"/>`;
    s += `<line x1="${r2(x0 + d0)}" y1="${r2(y + d0)}" x2="${r2(x1 + d0)}" y2="${r2(y + d0)}" stroke="${edge}" stroke-width="1"${NS}/>`;
  }
  return s;
}
/** PCIe x16 edge connector: PCB tabs protruding +x from the frame, gold contacts on each tab's top. */
function pcie(X0, z0, yNear) {
  const t = 1.6;
  const ext = 7;
  const segs = [[yNear - 12, yNear], [yNear - 12 - 2.4 - 77, yNear - 12 - 2.4]]; // pins 1-11 by the bracket, key notch, long run
  let s = "";
  for (const [a, b] of segs) {
    s += box(X0, a, z0, ext, b - a, t, PCB, ` data-edge="1"`);
    for (let y = a + 1.2; y < b - 0.8; y += 2) {
      const [u0, u1, v0, v1] = [X0 + 1.6, X0 + ext - 0.2, y, y + 1.1];
      s += poly([[u0, v0, z0 + t], [u1, v0, z0 + t], [u1, v1, z0 + t], [u0, v1, z0 + t]], p.gold, ` data-contact="1"`);
    }
  }
  return s;
}
// I/O bracket on the +y end: screw tab, plate with tongue, DisplayPort/HDMI cutouts and vents.
function port(cid, u, kind, v0) {
  const h = kind === "hdmi" ? 5 : 5.4;
  const w = kind === "hdmi" ? 14 : 15.5;
  const d =
    kind === "dp"
      ? `M${u},${v0}H${u + w}V${v0 + h}H${u + 2.2}L${u},${v0 + h - 2.2}Z`
      : `M${u + 1.6},${v0}H${u + w - 1.6}L${u + w},${v0 + 1.8}V${v0 + h}H${u}V${v0 + 1.8}Z`;
  return `<clipPath id="${cid}"><path d="${d}"/></clipPath><path d="${d}" fill="#232a36"/><g clip-path="url(#${cid})"><path d="${d}" fill="${HOLE}" transform="translate(1.2,1.2)"/>${rect(u + 3, v0 + h * 0.5, w - 5.2, 1.4, "#3a4352")}</g>`;
}
function bracket(Y0, H) {
  const t = 1.5;
  const [bt, bl, br] = ALU;
  const [xa, xb] = [-6, W];
  const [ta, tb] = [2, 10];
  let s = "";
  s += poly([[xa - t, Y0 + t, H], [xa - t, Y0 + 11, H], [xa, Y0 + 11, H], [xa, Y0 + t, H]], bt);
  s += poly([[xa - t, Y0 + 11, H], [xa, Y0 + 11, H], [xa, Y0 + 11, 0], [xa - t, Y0 + 11, 0]], bl);
  s += poly([[xa, Y0 + t, H], [xa, Y0 + 11, H], [xa, Y0 + 11, 0], [xa, Y0 + t, 0]], br);
  s += g(iso.sx(xa), `<path d="M${r2(Y0 + 11)},${r2(H / 2 - 2)}H${r2(Y0 + 6)}a2 2 0 0 0 0 4H${r2(Y0 + 11)}Z" fill="${p.bg}"/>`);
  const face = `M${xa},0H${xb}L${xb},${ta}L${xb + 9},${ta + 1}L${xb + 9},${tb - 1}L${xb},${tb}L${xb},${H}H${xa}Z`;
  s += poly([[xa, Y0, H], [xb, Y0, H], [xb, Y0 + t, H], [xa, Y0 + t, H]], bt);
  s += poly([[xb, Y0, H], [xb, Y0 + t, H], [xb, Y0 + t, tb], [xb, Y0, tb]], br);
  s += poly([[xb, Y0, ta], [xb, Y0 + t, ta], [xb, Y0 + t, 0], [xb, Y0, 0]], br);
  s += poly([[xb, Y0, tb], [xb + 9, Y0, tb - 1], [xb + 9, Y0 + t, tb - 1], [xb, Y0 + t, tb]], bt);
  s += poly([[xb + 9, Y0, tb - 1], [xb + 9, Y0 + t, tb - 1], [xb + 9, Y0 + t, ta + 1], [xb + 9, Y0, ta + 1]], br);
  let inner = `<path d="${face}" fill="${bl}"/>`;
  const vh = (H - 3 - 13 - 1.8 * 3) / 4; // four horizontal exhaust slots
  for (let i = 0; i < 4; i++) inner += rect(-1, 13 + i * (vh + 1.8), W - 2, vh, HOLE, ' rx="0.8"');
  [[4, "dp"], [24, "dp"], [44, "dp"], [66, "hdmi"]].forEach(([u, kind], i) => (inner += port(`card-port${i}`, u, kind, 4)));
  return s + g(iso.sy(Y0 + t), inner);
}

export function renderCalendarCard(calendar, { fonts = "" } = {}) {
  const W0 = 440;
  const H0 = 232;
  const weeks = calendar.weeks.slice(-CARD_WEEKS);
  const days = weeks.flat();
  const stats = calendarStats(days);
  let defs = "";
  let s = box(0, 0, 0, W, L, T, ALU);

  // Top face: dark plate, flow-through window (fan 2 under louvres), LED matrix, power socket, fan 1.
  let top = rect(5, 61, W - 10, L - 66, DARK, ' rx="3"');
  const fan2 = fan("card-f2", W / 2, 30, 40, { nb: 9, depth: 0, wall: "#121821", cavity: VOID, blade: "#2e3747", bladeShade: "#141a23", hubFill: "#353f50", capFill: "#4a5568" });
  defs += fan2.defs;
  const win = opening("card-win", 8, 8, W - 16, 47, 16, RIM, VOID, g("translate(14,14)", fan2.body) + finsY(8, W - 8, 5, 52, 6, 1, 1.8, "#6b7686", p.silverLight), 3);
  defs += win.defs;
  top += win.body;

  // The calendar: one round LED per day, oldest week nearest the window, Sunday on the back edge.
  const pitch = 7;
  const led = 4.8;
  const px0 = W / 2 - (7 * pitch) / 2;
  const py0 = 72;
  const panel = opening("card-led", px0 - 4, py0 - 4, 7 * pitch + 8, CARD_WEEKS * pitch + 8, 1.6, GLASS, "#0f141c", "", 2.5);
  defs += panel.defs;
  top += panel.body;
  const leds = weeks
    .flatMap((week, w) =>
      week.map(({ date, count, level }) => {
        const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
        const slot = CARD_WEEKS - weeks.length + w; // newest week always sits by fan 1
        const cx = px0 + dow * pitch + pitch / 2;
        const cy = py0 + (CARD_WEEKS - 1 - slot) * pitch + pitch / 2;
        const fill = level ? p.ramp[level - 1] : "#1a2130";
        return `<circle data-day="${date}" data-level="${level}" fill="${fill}" cx="${r2(cx)}" cy="${r2(cy)}" r="${led / 2}"><title>${date}: ${count} contributions</title></circle>`;
      }),
    )
    .join("");
  top += g("translate(1.6,1.6)", leds);

  // 16-pin 12V-2x6 socket beside the matrix on the back edge.
  let sock = rect(8.5, 150, 8, 20, "#202733", ' rx="0.6"');
  for (let i = 0; i < 2; i++) for (let j = 0; j < 6; j++) sock += rect(9.5 + i * 3 + 0.35, 151 + j * 3 + 0.35, 2.3, 2.3, HOLE, ' rx="0.3"');
  for (let j = 0; j < 4; j++) sock += rect(6.9, 151.5 + j * 4.25, 1, 3.65, HOLE);
  const sk = opening("card-pw", 6.5, 148, 11.5, 22, 2, GLASS, VOID);
  defs += sk.defs;
  top += sk.body + g("translate(0.6,0.6)", sock);

  const fan1 = fan("card-f1", W / 2, L - 50, 41, { nb: 11, depth: 6, wall: RIM, cavity: "#0e131b", blade: "#465165", bladeShade: "#1c2330", hubFill: "#5a667a", capFill: p.silver });
  defs += fan1.defs;
  top += fan1.body + circ(W / 2, L - 50, 41.5, "none", ` stroke="${p.silverLight}" stroke-width="1"${NS}`);
  s += g(iso.top(T), top);

  // +x long side: chamfer grooves, flow-through side vent with fin edges, PCB exit slot, engraved total.
  let side = rect(0, T - 2.2, L, 1, "#5d6776") + rect(0, 3.2, L, 1, "#3c4452") + rect(9, 8, 46, T - 16, VOID, ' rx="1.5"');
  for (let y = 9.8; y < 55; y += 4.6) side += rect(y, 8, 1, T - 16, p.silver);
  side += rect(L - 140, 0.2, 110, 2, VOID);
  s += g(iso.sx(W), side);
  s += g(iso.sxText(W), `<text x="${-(L + 55) / 2}" y="${-(T / 2) + 4.5}" text-anchor="middle" font-family="${COND}" font-size="12" font-weight="500" fill="#2b323d" letter-spacing="1.5">${stats.total.toLocaleString("en-US")} CONTRIBUTIONS</text>`);

  s += pcie(W, 0.4, L - 40);
  s += bracket(L, T);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W0}" height="${H0}" viewBox="0 0 ${W0} ${H0}" role="img" aria-labelledby="t d">
  <title id="t">Contribution calendar on a graphics card</title>
  <desc id="d">${stats.total} contributions in the last ${CARD_WEEKS} weeks. Best day ${stats.maxDay.count} on ${stats.maxDay.date}, best streak ${stats.bestStreak} days.</desc>
  <defs>${fonts ? `<style>${fonts}</style>` : ""}${defs}</defs>
  ${fixed(s)}
</svg>
`;
}
