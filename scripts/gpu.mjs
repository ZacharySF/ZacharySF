// The profile hero: a GPU floorplan with real gaming-die counts (GA102-class: GPCs of 6 TPCs x 2 SMs,
// 12 x 32-bit GDDR PHYs paired into six 64-bit memory controllers = 384-bit, 48 L2 tiles),
// laid out like a TU102 die shot and wired to GitHub data (assets/gpu-data.json):
//   GPC = one featured repo           SM = one step on a log scale of my contributions to it
//   MC  = one memory controller per language, its PHY teeth lit by that language's share of bytes
// Drawn 1:1 for the 846 px README column with the shared tokens in style.mjs.
import { escapeXml } from "./svg.mjs";
import { COND, MARGIN, PALETTE as p, panel, README_W, SANS, TYPE } from "./style.mjs";

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

// Floorplan grid in px (about 8.8 px/mm on a ~31 x 26 mm die).
const SM = { w: 21, h: 10 }; // rectangular, in TPC pairs
const GPC = { w: 47, h: 88 }; // 6 TPC rows of 10 px (2 px apart) + a 14 px raster/ROP strip facing the die's centre line
const STRIP = 14;
const CENTER_W = 36;
const GAP = 4;

export function renderHero(data, { fonts = "" } = {}) {
  const W = README_W;
  const H = 308;
  const sideW = 2 * GPC.w + 2;
  const ring = { x: MARGIN, y: MARGIN, w: 304, h: 260 };
  const die = { x: ring.x + 16, y: ring.y + 16, w: 272, h: 228 }; // 1.19:1, like GA102's 1.14 and TU102's 1.25
  const core = { x: die.x + 28, y: die.y + 24, w: 2 * sideW + CENTER_W + 2 * GAP, h: 2 * GPC.h + GAP }; // 236 x 180
  const cx = core.x + sideW + GAP;

  // --- GPCs: mirrored about the horizontal centre line ---
  const gpcAt = (g) => ({ x: (g % 4 >= 2 ? cx + CENTER_W + GAP : core.x) + (g % 2) * (GPC.w + 2), y: core.y + (g < 4 ? 0 : GPC.h + GAP), top: g < 4 });
  const smAt = (gx, gy, top, s) => {
    const tpc = Math.floor(s / 2); // TPC 0 sits next to the raster strip
    const row = top ? 5 - tpc : tpc;
    return { x: gx + 2 + (s % 2) * (SM.w + 1), y: gy + (top ? 1 : STRIP + 3) + row * 12 };
  };
  const stripY = (gy, top) => (top ? gy + GPC.h - STRIP - 1 : gy + 1);
  const gpcs = data.repos.map((repo, g) => {
    const { x: gx, y: gy, top } = gpcAt(g);
    const lit = litSMs(repo.contributions);
    const sms = SM_THRESHOLDS.map((_, s) => {
      const { x, y } = smAt(gx, gy, top, s);
      const on = s < lit;
      // SM anatomy as on a die shot: logic fill, four register-file columns (one per processing
      // block) and an L1/shared SRAM macro. Lit SMs tint the same texture instead of hiding it.
      const anatomy = [1, 5, 9, 13].map((dx) => `<rect x="${x + dx}" y="${y + 1}" width="3" height="8" fill="url(#rf)"/>`).join("") + `<rect x="${x + 17}" y="${y + 1}" width="3" height="8" fill="url(#sram)"/>`;
      return `<rect x="${x}" y="${y}" width="${SM.w}" height="${SM.h}" fill="url(#logic)"/>${anatomy}<rect data-sm="${g}-${s}" data-lit="${on}" x="${x}" y="${y}" width="${SM.w}" height="${SM.h}" fill="${on ? p.ramp[smLevel(s) - 1] : "none"}"${on ? ' fill-opacity="0.7"' : ""}/>`;
    }).join("");
    return `<g data-gpc="${g}"><title>GPC${g} · ${escapeXml(repo.title)}: ${repo.contributions} contributions</title><rect x="${gx}" y="${gy}" width="${GPC.w}" height="${GPC.h}" fill="${p.bg}"/><rect x="${gx + 1}" y="${stripY(gy, top)}" width="${GPC.w - 2}" height="${STRIP}" fill="url(#logicDense)"/>${sms}</g>`;
  });
  // Unused slots are fused off, as on a harvested die: SM outlines stay visible under a hatch.
  for (let g = data.repos.length; g < GPC_SLOTS; g++) {
    const { x: gx, y: gy, top } = gpcAt(g);
    const outlines = SM_THRESHOLDS.map((_, s) => {
      const { x, y } = smAt(gx, gy, top, s);
      return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${SM.w - 1}" height="${SM.h - 1}" fill="none" stroke="${p.structure}"/>`;
    }).join("");
    gpcs.push(`<g data-fused="${g}"><rect x="${gx}" y="${gy}" width="${GPC.w}" height="${GPC.h}" fill="url(#fused)"/>${outlines}<rect x="${gx + 1}" y="${stripY(gy, top)}" width="${GPC.w - 2}" height="${STRIP}" fill="${p.structure}"/></g>`);
  }

  // --- Centre column: two L2 banks (48 tiles of 128 KB = 6 MB) around the crossbar and front end ---
  const bankH = 66;
  const bank = (y0) => {
    const tiles = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) tiles.push(`<rect x="${cx + c * 9}" y="${y0 + r * 11}" width="8" height="10" fill="url(#sram)"/>`);
    return tiles.join("");
  };
  const xbar = { y: core.y + bankH + GAP, h: core.h - 2 * bankH - 2 * GAP };

  // --- Memory: 12 x 32-bit PHYs on the top and bottom edges, paired into 6 MCs (one per language) ---
  const maxShare = Math.max(0.001, ...data.languages.map((l) => l.share));
  const phyW = 36;
  const phyX0 = die.x + Math.round((die.w - (6 * phyW + 5 * 2)) / 2);
  const mcs = data.languages.slice(0, 6).map((lang, i) => {
    const topEdge = i < 3;
    const y = topEdge ? die.y + 4 : die.y + die.h - 16;
    const x = phyX0 + (i % 3) * 2 * (phyW + 2);
    const teeth = 16;
    const lit = Math.max(1, Math.round(teeth * (lang.share / maxShare)));
    const phys = [0, 1].map((k) => `<rect x="${x + k * (phyW + 2)}" y="${y}" width="${phyW}" height="12" fill="${p.surface}"/>`).join("");
    const tooth = Array.from({ length: teeth }, (_, t) => {
      const tx = x + 2 + Math.floor(t / 8) * (phyW + 2) + (t % 8) * 4;
      return `<rect x="${tx}" y="${y + 3}" width="2" height="6" fill="${t < lit ? p.ramp[Math.min(3, Math.floor(t / 4))] : p.structure}"/>`;
    }).join("");
    return `<g data-mem="${i}"><title>MC${i} · ${escapeXml(lang.name)} ${Math.round(lang.share * 100)}%</title>${phys}${tooth}</g>`;
  });

  // --- Left I/O column: NVLink, PCIe x16, display and media blocks (unlabelled structure) ---
  const io = { x: die.x + 4, w: 20 };
  let iy = core.y;
  const ioBlocks = [36, 52, 44, core.h - 36 - 52 - 44 - 6].map((h) => {
    const block = `<rect x="${io.x}" y="${iy}" width="${io.w}" height="${h}" fill="url(#phy)"/>`;
    iy += h + 2;
    return block;
  });

  // --- Substrate with decoupling caps, then the die with its seal ring ---
  // Caps sit in small banks along each edge (as on a real package), not as a continuous dashed line.
  const caps = [];
  const capBank = (x, y, horizontal) => {
    for (let k = 0; k < 6; k++) caps.push(horizontal ? `<rect x="${x + k * 5}" y="${y}" width="3" height="5"/>` : `<rect x="${x}" y="${y + k * 5}" width="5" height="3"/>`);
  };
  for (const fx of [0.16, 0.5, 0.84]) {
    const x = Math.round(ring.x + fx * ring.w - 14);
    capBank(x, ring.y + 5, true);
    capBank(x, ring.y + ring.h - 10, true);
  }
  for (const fy of [0.2, 0.5, 0.8]) {
    const y = Math.round(ring.y + fy * ring.h - 14);
    capBank(ring.x + 5, y, false);
    capBank(ring.x + ring.w - 10, y, false);
  }

  // --- Side panel: one focal name, then the GPC map with the same log-scale SM strip the die uses ---
  const px = ring.x + ring.w + 32;
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
  <desc id="d">A GPU floorplan wired to GitHub: ${data.repos.length} clusters of ${SMS_PER_GPC} SMs are projects whose SMs light up on a log scale of my contributions; the six memory controllers are my main languages (${memory}).</desc>
  <defs>
    ${fonts ? `<style>${fonts}</style>` : ""}
    <pattern id="sram" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${p.surface}"/><rect width="1" height="1" fill="${p.structure}"/></pattern>
    <pattern id="rf" width="3" height="2" patternUnits="userSpaceOnUse"><rect width="3" height="2" fill="${p.surface}"/><rect width="3" height="1" fill="${p.well}"/></pattern>
    <pattern id="logic" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${p.surface}"/><rect x="0" y="0" width="2" height="1" fill="${p.well}"/><rect x="3" y="1" width="1" height="2" fill="${p.structure}"/><rect x="1" y="3" width="2" height="1" fill="${p.structure}"/><rect x="4" y="4" width="2" height="1" fill="${p.well}"/><rect x="0" y="5" width="1" height="1" fill="${p.well}"/></pattern>
    <pattern id="logicDense" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${p.well}"/><rect width="1" height="1" fill="${p.structure}"/><rect x="2" y="1" width="2" height="1" fill="${p.surface}"/><rect x="1" y="3" width="1" height="1" fill="${p.structure}"/></pattern>
    <pattern id="wires" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="${p.surface}"/><rect width="3" height="1" fill="${p.structure}"/></pattern>
    <pattern id="phy" width="20" height="4" patternUnits="userSpaceOnUse"><rect width="20" height="4" fill="${p.surface}"/><rect x="2" y="1" width="12" height="2" fill="${p.well}"/><rect x="16" y="1" width="2" height="2" fill="${p.structure}"/></pattern>
    <pattern id="fused" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${p.surface}"/><path d="M0 4 L4 0" stroke="${p.structure}"/></pattern>
  </defs>
  ${panel(W, H)}

  <g shape-rendering="crispEdges">
    <rect x="${ring.x}" y="${ring.y}" width="${ring.w}" height="${ring.h}" rx="2" fill="${p.surface}"/>
    <g fill="${p.cap}">${caps.join("")}</g>
    <rect x="${die.x - 2}" y="${die.y - 2}" width="${die.w + 4}" height="${die.h + 4}" fill="${p.silver}"/>
    <rect x="${die.x}" y="${die.y}" width="${die.w}" height="${die.h}" fill="${p.bg}"/>
    <rect x="${die.x + 1.5}" y="${die.y + 1.5}" width="${die.w - 3}" height="${die.h - 3}" fill="none" stroke="${p.structure}"/>
    ${ioBlocks.join("")}
    ${mcs.join("")}
    ${gpcs.join("")}
    ${bank(core.y)}${bank(core.y + core.h - bankH)}
    <rect x="${cx}" y="${xbar.y}" width="${CENTER_W}" height="${xbar.h}" fill="url(#wires)"/>
    <rect x="${cx + 6}" y="${xbar.y + 6}" width="${CENTER_W - 12}" height="${xbar.h - 12}" fill="url(#logicDense)"/>
  </g>
  <g font-family="${COND}" font-weight="500" font-size="${TYPE.label}" letter-spacing="0.3" fill="${p.text2}">
    ${Array.from({ length: GPC_SLOTS }, (_, g) => {
      const { x, y, top } = gpcAt(g);
      return `<text data-gpc-label="${g}" x="${x + 3}" y="${stripY(y, top) + 11}"${g < data.repos.length ? "" : ` fill="${p.text3}"`}>GPC${g}</text>`;
    }).join("")}
  </g>

  <g font-family="${SANS}" font-weight="500">
    <text x="${px}" y="${MARGIN + 9}" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="1.6" fill="${p.text3}">ZS-102 · ${data.repos.length} GPC · ${data.repos.length * SMS_PER_GPC} SM · 384-BIT</text>
    <text x="${px - 2}" y="72" font-weight="600" font-size="${TYPE.display}" letter-spacing="-0.4" fill="${p.text}">Zachary Stubbs</text>
    <text x="${px}" y="96" font-size="${TYPE.body}" fill="${p.text2}">Low-level systems · Computer architecture · Operating systems</text>
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
