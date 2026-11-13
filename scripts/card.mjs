// The contribution calendar drawn as an isometric graphics card, in the spirit of the metrics
// "isocalendar": the card lies flat and its shroud top is the calendar grid (weeks along the card,
// days across it), each day a flat tile lit on the blue ramp by its contribution level.
// The fan, I/O bracket and PCIe edge connector make it read as a GPU.
import { COND, MARGIN, PALETTE as p, panel, SANS, TYPE } from "./style.mjs";
import { escapeXml } from "./svg.mjs";

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

const C = 9; // grid cell, px along each iso axis
const OX = 104;
const OY = 84;
const THICK = 12;
const r1 = (n) => Math.round(n * 10) / 10;
const iso = (i, j, h = 0) => [r1(OX + (i - j) * C * 0.866), r1(OY + (i + j) * C * 0.5 - h)];
const pts = (...ps) => ps.map(([x, y]) => `${x},${y}`).join(" ");

export function renderCalendarCard(calendar, { fonts = "", tools = [] } = {}) {
  const W = 360; // shown 1:1 beside the 480 px stats dashboard
  const H = 461; // same height as the dashboard so the row ends flush
  const weeks = calendar.weeks.slice(-CARD_WEEKS);
  const days = weeks.flat();
  const stats = calendarStats(days);

  // Card footprint in grid units: grid of weeks x 7 days, then the fan zone at the far end.
  const L = 1 + CARD_WEEKS + 1 + 8; // length (i axis)
  const S = 9; // width (j axis): 7 days + margins
  const top = [iso(0, 0, THICK), iso(L, 0, THICK), iso(L, S, THICK), iso(0, S, THICK)];
  const sideJ = pts(iso(0, S, THICK), iso(L, S, THICK), iso(L, S, 0), iso(0, S, 0)); // long face towards the viewer
  const sideI = pts(iso(L, 0, THICK), iso(L, S, THICK), iso(L, S, 0), iso(L, 0, 0)); // far end face

  // PCIe x16 fingers on the long face, under the first third of the card.
  const fingers = Array.from({ length: 22 }, (_, k) => {
    const i = 3 + k * 0.45 + (k >= 5 ? 0.4 : 0);
    return `<polygon points="${pts(iso(i, S, 2), iso(i + 0.28, S, 2), iso(i + 0.28, S, -5), iso(i, S, -5))}" fill="${p.text}"/>`;
  }).join("");

  // I/O bracket: a plate standing at the near end, taller than the card is thick.
  const bracket = `<polygon points="${pts(iso(-0.4, -0.6, THICK + 18), iso(-0.4, S + 0.4, THICK + 18), iso(-0.4, S + 0.4, -10), iso(-0.4, -0.6, -10))}" fill="${p.silver}"/>
  ${[1.5, 3.5, 5.5].map((j) => `<polygon points="${pts(iso(-0.4, j, THICK + 10), iso(-0.4, j + 1.4, THICK + 10), iso(-0.4, j + 1.4, THICK - 2), iso(-0.4, j, THICK - 2))}" fill="${p.bg}"/>`).join("")}`;

  // Fan: an iso circle on the shroud top, swept blades, hub.
  const fc = { i: 1 + CARD_WEEKS + 1 + 4, j: S / 2 };
  const ring = (r, h = THICK) => pts(...Array.from({ length: 48 }, (_, k) => iso(fc.i + r * Math.cos((k / 48) * 2 * Math.PI), fc.j + r * Math.sin((k / 48) * 2 * Math.PI), h)));
  const blades = Array.from({ length: 9 }, (_, b) => {
    const a = (b / 9) * 2 * Math.PI;
    const P = (r, t) => iso(fc.i + r * Math.cos(a + t), fc.j + r * Math.sin(a + t), THICK);
    return `<polygon points="${pts(P(0.9, 0), P(2.2, 0.25), P(3.3, 0.7), P(3.3, 1.05), P(2.2, 0.75), P(0.9, 0.55))}"/>`;
  }).join("");

  // Calendar bars, painted back to front.
  const cells = [];
  weeks.forEach((week, w) => {
    for (const d of week) cells.push({ ...d, i: 1 + w, j: 1 + new Date(`${d.date}T00:00:00Z`).getUTCDay() });
  });
  cells.sort((a, b) => a.i + a.j - (b.i + b.j) || a.i - b.i);
  const bars = cells
    .map(({ i, j, date, count, level }) => {
      const g = 0.12; // gap between bars, in cells
      const [a0, a1] = [i + g, i + 1 - g];
      const [b0, b1] = [j + g, j + 1 - g];
      const h = THICK;
      const fill = level ? p.ramp[level - 1] : p.well;
      const topFace = `<polygon data-day="${date}" data-level="${level}" fill="${fill}" points="${pts(iso(a0, b0, h), iso(a1, b0, h), iso(a1, b1, h), iso(a0, b1, h))}"><title>${date}: ${count} contributions</title></polygon>`;
      return topFace;
    })
    .join("");

  const statY = 296;
  const stat = (x, value, label) =>
    `<text x="${x}" y="${statY}" font-weight="600" font-size="${TYPE.title}" fill="${p.text}">${value}</text><text x="${x}" y="${statY + 16}" font-size="${TYPE.label}" fill="${p.text3}">${label}</text>`;
  const toolLines = tools.map((line, i) => `<text x="${MARGIN}" y="${372 + i * 18}" font-size="${TYPE.label}" fill="${p.text2}">${escapeXml(line)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Contribution calendar on a graphics card</title>
  <desc id="d">${stats.total} contributions in the last ${CARD_WEEKS} weeks. Best day ${stats.maxDay.count} on ${stats.maxDay.date}, best streak ${stats.bestStreak} days.</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  ${panel(W, H)}
  <g font-family="${SANS}" font-weight="500">
    <text x="${MARGIN}" y="${MARGIN + 9}" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="1.6" fill="${p.text3}">CONTRIBUTIONS · LAST ${CARD_WEEKS} WEEKS</text>
    ${stat(MARGIN, stats.total, "contributions")}${stat(136, stats.maxDay.count, "best day")}${stat(248, `${stats.bestStreak} days`, "best streak")}
    <rect x="${MARGIN}" y="332" width="${W - 2 * MARGIN}" height="1" fill="${p.structure}"/>
    <text x="${MARGIN}" y="354" font-weight="600" font-size="${TYPE.body}" fill="${p.text}">Tools</text>
    ${toolLines}
  </g>

  ${bracket}
  <polygon points="${sideJ}" fill="${p.well}"/>
  <polygon points="${sideI}" fill="${p.structure}"/>
  ${fingers}
  <polygon points="${pts(...top)}" fill="${p.surface}" stroke="${p.text}" stroke-linejoin="round"/>
  <polygon points="${pts(iso(1 + CARD_WEEKS + 0.6, 0, THICK), iso(1 + CARD_WEEKS + 1.2, 0, THICK), iso(1 + CARD_WEEKS + 1.2, S, THICK), iso(1 + CARD_WEEKS + 0.6, S, THICK))}" fill="${p.silver}"/>
  <polygon points="${ring(3.5)}" fill="${p.bg}" stroke="${p.silver}" stroke-width="2"/>
  <g fill="${p.structure}">${blades}</g>
  <polygon points="${ring(0.9)}" fill="${p.silverLight}" stroke="${p.silver}"/>
  ${bars}
</svg>
`;
}
