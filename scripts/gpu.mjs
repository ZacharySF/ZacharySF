// The profile hero: an annotated infrared die shot (Fritzchens Fritz photo, Locuza call-outs) of a
// GA102-class GPU (GPCs of 6 TPCs x 2 SMs, six memory controllers around an L2 band), wired to GitHub
// data (assets/gpu-data.json):
//   GPC = one featured repo           SM = one step on a log scale of my contributions to it
//   MC  = one memory controller per language, its 12 PHY slices lit by that language's share of bytes
// Drawn 1:1 for the 846 px README column with the shared tokens in style.mjs.
import { escapeXml } from "./svg.mjs";
import { COND, fixed, MARGIN, PALETTE as p, README_W, SANS, TYPE } from "./style.mjs";

const SMS_PER_GPC = 12;
const GPC_SLOTS = 8;

/** Contributions needed to light each of a GPC's 12 SMs: log-spaced from 1 to 128. */
export const SM_THRESHOLDS = Array.from({ length: SMS_PER_GPC }).reduce((acc, _, i) => {
  acc.push(Math.max((acc.at(-1) ?? 0) + 1, Math.round(128 ** (i / (SMS_PER_GPC - 1)))));
  return acc;
}, []);

/** How many SMs a repo with `contributions` lights. */
export const litSMs = (contributions) => SM_THRESHOLDS.filter((t) => contributions >= t).length;

// Lit SMs step up the ramp along the scale.
const smLevel = (s) => 1 + Math.floor((3 * s) / (SMS_PER_GPC - 1));

// The die fills a 304 x 260 region at the top-left margin; coordinates below are local to it.
const REGION = { w: 304, h: 260 };
const PHY_SLICES = 12;

const rect = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;
// 1 px stroke drawn inside the integer box [x, x + w] x [y, y + h]
const box = (x, y, w, h, stroke, extra = "") => `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" fill="none" stroke="${stroke}"${extra}/>`;
const label = (x, y, s, fill, extra = "") => `<text x="${x}" y="${y}" fill="${fill}"${extra}>${s}</text>`;

/** The die: seal ring, six PHY columns (one per language), the L2 band and eight GPCs of 6 x 2 SMs. */
function renderDie(data) {
  // Memory PHYs: MC0-2 down the left edge, MC3-5 down the right; slices lit by language share.
  const maxShare = Math.max(0.001, ...data.languages.map((l) => l.share));
  const mcs = data.languages.slice(0, 6).map((lang, m) => {
    const left = m < 3;
    const y = 12 + (m % 3) * 80;
    const h = 76;
    const tx = left ? 11 : 286;
    const lit = Math.max(1, Math.round((PHY_SLICES * lang.share) / maxShare));
    const slices = Array.from({ length: PHY_SLICES }, (_, t) => rect(tx, y + 3 + t * 6, 7, 4, t < lit ? p.accent : p.dieSram, ` data-mc="${m}" data-lit="${t < lit ? 1 : 0}"`)).join("");
    const cy = y + h / 2;
    const name = left ? label(30, cy, escapeXml(lang.name), p.text, ` text-anchor="middle" transform="rotate(-90 30 ${cy})"`) : label(274, cy, escapeXml(lang.name), p.text, ` text-anchor="middle" transform="rotate(90 274 ${cy})"`);
    return `<g data-mem="${m}"><title>MC${m} · ${escapeXml(lang.name)} ${Math.round(lang.share * 100)}%</title>${rect(left ? 11 : 270, y, 23, h, p.diePhy)}${slices}${box(left ? 10 : 269, y - 1, 25, h + 2, p.text3)}${name}</g>`;
  });

  // GPCs: GPC0-3 above the L2 band, GPC4-7 below; slots without a repo are fused off.
  const gpcs = Array.from({ length: GPC_SLOTS }, (_, g) => {
    const repo = data.repos[g];
    const fused = !repo;
    const lit = fused ? 0 : litSMs(repo.contributions);
    const gx = 36 + (g % 4) * 59;
    const gy = g < 4 ? 12 : 148;
    // SM anatomy as it shows in a die photo: register-file SRAM on top, datapath logic, L1 SRAM at the bottom.
    // Lit SMs get a false-colour tint on the ramp over that texture.
    let raw = "";
    let tint = "";
    for (let s = 0; s < SMS_PER_GPC; s++) {
      const c = s % 6;
      const x = gx + 2 + c * 8 + Math.floor(c / 2) * 3;
      const y = gy + 20 + Math.floor(s / 6) * 40;
      raw += rect(x, y, 7, 10, "url(#die-sram)") + rect(x, y + 11, 7, 16, "url(#die-logic)") + rect(x, y + 28, 7, 9, "url(#die-sramv)");
      if (fused) continue;
      if (s < lit) {
        const col = p.ramp[smLevel(s) - 1];
        tint += rect(x, y, 7, 37, col, ` fill-opacity="0.62" data-sm="${g}-${s}" data-lit="true"`) + box(x, y, 7, 37, col);
      } else raw += rect(x, y, 7, 37, "none", ` data-sm="${g}-${s}" data-lit="false"`);
    }
    const edge = fused ? p.text3 : p.silverLight;
    const tag = rect(gx, gy, 34, 16, p.bg) + box(gx, gy, 34, 16, edge) + label(gx + 4, gy + 12, `GPC${g}`, fused ? p.text3 : p.text, ` data-gpc-label="${g}"`);
    const body = rect(gx + 2, gy + 17, 50, 2, "url(#die-logic)") + raw + tint + box(gx, gy, 54, 100, edge, fused ? ` stroke-dasharray="3 2"` : "") + tag;
    if (fused) return `<g data-fused="${g}"><title>GPC${g} · fused off</title>${body}${rect(gx + 9, gy + 50, 36, 16, p.bg)}${box(gx + 9, gy + 50, 36, 16, p.text3)}${label(gx + 27, gy + 62, "FUSED", p.text3, ` text-anchor="middle"`)}</g>`;
    return `<g data-gpc="${g}"><title>GPC${g} · ${escapeXml(repo.title)}: ${repo.contributions} contributions · ${lit} of ${SMS_PER_GPC} SMs</title>${body}</g>`;
  });

  return `<g data-die="1" transform="translate(${MARGIN} ${MARGIN})" font-family="${COND}" font-weight="500" font-size="${TYPE.label}">
    ${rect(6, 6, 292, 248, p.die)}${rect(9, 9, 286, 242, "url(#die-logic)", ` fill-opacity="0.5"`)}
    ${box(6, 6, 292, 248, p.dieRing)}${box(8, 8, 288, 244, p.dieRing, ` stroke-opacity="0.6"`)}
    ${mcs.join("")}
    ${rect(37, 119, 229, 22, "url(#die-sram)")}${box(36, 118, 231, 24, p.text3)}
    ${rect(126, 122, 52, 16, p.bg)}${box(126, 122, 52, 16, p.text3)}${label(152, 134, "L2 CACHE", p.text2, ` text-anchor="middle"`)}
    ${gpcs.join("")}
  </g>`;
}

export function renderHero(data, { fonts = "" } = {}) {
  const W = README_W;
  const H = 308;
  // --- Side panel: one focal name, then the GPC map with the same log-scale SM strip the die uses ---
  const px = MARGIN + REGION.w + 32;
  const right = W - MARGIN;
  const rowY = (g) => 180 + g * 14;
  const gpcMap = data.repos
    .map((repo, g) => {
      const y = rowY(g);
      const lit = litSMs(repo.contributions);
      const cells = SM_THRESHOLDS.map((_, s) => `<rect x="${px + 216 + s * 10}" y="${y - 8}" width="8" height="8" fill="${s < lit ? p.ramp[smLevel(s) - 1] : p.well}"/>`).join("");
      return `<text x="${px}" y="${y}" font-family="${COND}" font-size="${TYPE.label}" fill="${p.text3}">GPC${g}</text><text x="${px + 48}" y="${y}" font-size="${TYPE.body}" fill="${p.text}">${escapeXml(repo.title)}</text><g shape-rendering="crispEdges">${cells}</g><text x="${right}" y="${y}" text-anchor="end" font-size="${TYPE.body}" fill="${p.text2}" style="font-variant-numeric:tabular-nums">${repo.contributions}</text>`;
    })
    .join("");
  const memory = data.languages
    .slice(0, 6)
    .map((l) => `${escapeXml(l.name)} ${Math.round(l.share * 100)}%`)
    .join(" · ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Zachary Stubbs</title>
  <desc id="d">An annotated GPU die shot wired to GitHub: ${data.repos.length} clusters of ${SMS_PER_GPC} SMs are projects whose SMs light up on a log scale of my contributions; the six memory controllers are my main languages (${memory}).</desc>
  <defs>
    ${fonts ? `<style>${fonts}</style>` : ""}
    ${fixed(`<pattern id="die-sram" width="3" height="2" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="${p.dieSram}"/></pattern>
    <pattern id="die-sramv" width="2" height="3" patternUnits="userSpaceOnUse"><rect width="1" height="3" fill="${p.dieSram}"/></pattern>
    <pattern id="die-logic" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="${p.dieGrain}"/><rect x="2" y="2" width="1" height="1" fill="${p.dieGrain}"/></pattern>`)}
  </defs>

  ${fixed(renderDie(data))}

  <g font-family="${SANS}" font-weight="500">
    <text x="${px}" y="${MARGIN + 9}" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="1.6" fill="${p.text3}">ZS-102 · ${data.repos.length} GPC · ${data.repos.length * SMS_PER_GPC} SM · 384-BIT</text>
    <text x="${px - 2}" y="72" font-weight="600" font-size="${TYPE.display}" letter-spacing="-0.4" fill="${p.text}">Zachary Stubbs</text>
    <text x="${px}" y="96" font-weight="700" font-size="${TYPE.body}" fill="${p.text}">Low-level systems · Computer architecture · Operating systems</text>
    <text x="${px}" y="116" font-size="${TYPE.body}" fill="${p.text2}">Electrical &amp; Computer Engineering at Texas A&amp;M</text>
    <text x="${px}" y="140" font-size="${TYPE.label}" fill="${p.text3}">${data.totals.contributions} contributions across ${data.repos.length} projects · GPC7 is fused off</text>
    <g font-family="${COND}" font-size="${TYPE.label}" letter-spacing="1" fill="${p.text3}">
      <text x="${px}" y="162">GPC</text><text x="${px + 48}" y="162">PROJECT</text><text x="${px + 216}" y="162">SMs LIT (LOG)</text><text x="${right}" y="162" text-anchor="end">CONTRIBUTIONS</text>
    </g>
    ${gpcMap}
    <text x="${px}" y="${H - MARGIN}" font-family="${COND}" font-size="${TYPE.label}" fill="${p.text3}">Memory: ${memory}</text>
  </g>
</svg>
`;
}
