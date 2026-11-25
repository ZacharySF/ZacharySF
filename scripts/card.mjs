// The graphics card beside the tech stack: Fritzchens Fritz's photo of the GTX 580 whose GF110 die is in
// the hero (CC0, Wikimedia Commons), opened up on a white studio sweep:
// https://commons.wikimedia.org/wiki/File:NVIDIA@40nm@Fermi@GF110@GeForce_GTX_580@UA10B338_1041A1_N2Y540.000_GF110-375-A1_DSC04152_(27576804994).jpg
// My last 18 weeks of contributions are drawn in the photo's empty white corner as GitHub draws them
// (one column per week, Sunday on top), with the total underneath.
import { escapeXml } from "./svg.mjs";
import { fixed, MARGIN, PALETTE as p, SANS, TYPE } from "./style.mjs";

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

/** GitHub's light-page graph colours in the profile's blue: empty, then levels 1 to 4. */
export const GRID_RAMP = ["#ebedf0", "#a9c9ef", "#5c9be0", "#2a6dbd", "#0f467f"];

/**
 * The photo's place in the card row (same left edge as the die photo) and the white corner, as fractions
 * of the photo [x0, y0], that is clear of the card all the way to the bottom-right edge.
 */
export const CARD_PHOTO = {
  file: "gtx580-card.jpg",
  x: MARGIN,
  y: 0,
  w: 404,
  h: 229,
  aspect: 808 / 458,
  clear: [0.594, 0.611],
  grid: { pitch: 8.4, size: 7, inset: 8 },
};

const r2 = (v) => Math.round(v * 100) / 100;

/** The photo with the graph on it, and the caption under it. `photo` is a data URI (omitted in tests). */
export function renderCardPhoto(calendar, { photo = "" } = {}) {
  const { x, y, w, h, grid } = CARD_PHOTO;
  const weeks = calendar.weeks.slice(-CARD_WEEKS);
  const stats = calendarStats(weeks.flat());
  const gx = x + w - grid.inset - CARD_WEEKS * grid.pitch + (grid.pitch - grid.size);
  const gy = y + h - grid.inset - 7 * grid.pitch + (grid.pitch - grid.size);
  const cells = weeks
    .flatMap((week, wi) =>
      week.map(({ date, count, level }) => {
        const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
        const slot = CARD_WEEKS - weeks.length + wi; // the newest week always sits at the right edge
        return `<rect data-day="${date}" data-level="${level}" x="${r2(gx + slot * grid.pitch)}" y="${r2(gy + dow * grid.pitch)}" width="${grid.size}" height="${grid.size}" rx="1.5" fill="${GRID_RAMP[level]}"><title>${date}: ${count} contributions</title></rect>`;
      }),
    )
    .join("");
  const frame = `x="${x}" y="${y}" width="${w}" height="${h}" rx="6"`;
  return `<clipPath id="card-photo"><rect ${frame}/></clipPath>
  ${fixed(`<rect data-photo="1" ${frame} fill="#f4f4f4"/>${photo ? `<image href="${photo}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" clip-path="url(#card-photo)"/>` : ""}<g>${cells}</g>`)}
  <text x="${x}" y="${y + h + 18}" font-family="${SANS}" font-weight="500" font-size="${TYPE.label}" fill="${p.text2}">${escapeXml(`${stats.total.toLocaleString("en-US")} contributions in the last ${CARD_WEEKS} weeks`)}</text>`;
}
