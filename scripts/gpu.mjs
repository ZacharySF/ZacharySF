// The profile hero: a real die photo with my projects marked on it, beside my name and the project list.
// The photo is NVIDIA's GF110 (GeForce GTX 580) by Fritzchens Fritz, released CC0 on Wikimedia Commons:
// https://commons.wikimedia.org/wiki/File:NVIDIA@40nm@Fermi@GF110@GeForce_GTX_580@UA10B338_1041A1_N2Y540.000_GF110-375-A1_Stack-DSC06286-DSC06300_-_ZS-PMax_(27494257234).jpg
// GF110 has four clusters of four SMs; each SM pair (one row of a cluster) is one marked block, so the
// eight blocks are numbered down the left half, then down the right, in the README's project order.
// A block is dimmed less the more I contributed to its project (log scale, 1 to 128 contributions).
import { escapeXml } from "./svg.mjs";
import { fixed, MARGIN, PALETTE as p, README_W, SANS, TYPE } from "./style.mjs";

const STEPS = 12;

/** Contributions needed for each of the 12 steps of the activity scale: log-spaced from 1 to 128. */
export const SM_THRESHOLDS = Array.from({ length: STEPS }).reduce((acc, _, i) => {
  acc.push(Math.max((acc.at(-1) ?? 0) + 1, Math.round(128 ** (i / (STEPS - 1)))));
  return acc;
}, []);

/** How many of the 12 steps a project with `contributions` reaches. */
export const litSMs = (contributions) => SM_THRESHOLDS.filter((t) => contributions >= t).length;

// Steps climb the blue ramp along the scale.
const level = (s) => 1 + Math.floor((3 * s) / (STEPS - 1));
const MAX_DIM = 0.55;
const OUTSIDE_DIM = 0.35;
/** Opacity of the shade over a project's block: clear at the top of the scale, MAX_DIM with none. */
export const dimFor = (contributions) => Math.round(MAX_DIM * (1 - litSMs(contributions) / STEPS) * 100) / 100;

/**
 * The photo's place in the hero and its SM-pair blocks as fractions of the photo [x0, y0, x1, y1],
 * measured on the 1920 x 1898 Commons rendering.
 */
export const DIE = {
  file: "gf110-die.jpg",
  credit: "GF110 die photo by Fritzchens Fritz (CC0)",
  x: MARGIN,
  y: MARGIN,
  w: 276,
  h: 273,
  panelX: MARGIN + 276 + 32,
  blocks: [
    [0.0547, 0.059, 0.324, 0.2171],
    [0.0547, 0.3672, 0.324, 0.49],
    [0.0547, 0.5174, 0.324, 0.656],
    [0.0547, 0.7903, 0.324, 0.9368],
    [0.6755, 0.059, 0.9453, 0.2171],
    [0.6755, 0.3672, 0.9453, 0.49],
    [0.6755, 0.5174, 0.9453, 0.656],
    [0.6755, 0.7903, 0.9453, 0.9368],
  ],
};

const r1 = (v) => Math.round(v * 10) / 10;

/** The photo, a shade over everything but the marked blocks, and each block's shade, outline and number. */
function renderDie(data, photo) {
  const { x, y, w, h } = DIE;
  const marked = data.repos.slice(0, DIE.blocks.length).map((repo, g) => {
    const [fx0, fy0, fx1, fy1] = DIE.blocks[g];
    return { repo, g, bx: r1(x + fx0 * w), by: r1(y + fy0 * h), bw: r1((fx1 - fx0) * w), bh: r1((fy1 - fy0) * h) };
  });
  const holes = marked.map(({ bx, by, bw, bh }) => `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#000"/>`).join("");
  const blocks = marked
    .map(({ repo, g, bx, by, bw, bh }) => {
      const tag = `<rect x="${bx}" y="${by}" width="13" height="13" fill="#0b0f15" fill-opacity="0.85"/><text x="${r1(bx + 6.5)}" y="${r1(by + 10)}" text-anchor="middle" font-size="10" fill="#f1f5ff" data-block-label="${g}">${g + 1}</text>`;
      return `<g data-block="${g}"><title>${g + 1}. ${escapeXml(repo.title)}: ${repo.contributions} contributions</title><rect data-dim="${g}" x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#05070a" fill-opacity="${dimFor(repo.contributions)}"/><rect x="${r1(bx + 0.5)}" y="${r1(by + 0.5)}" width="${r1(bw - 1)}" height="${r1(bh - 1)}" fill="none" stroke="#f1f5ff" stroke-opacity="0.6"/>${tag}</g>`;
    })
    .join("");
  return `<rect data-photo="1" x="${x}" y="${y}" width="${w}" height="${h}" fill="#15181f"/>${photo ? `<image href="${photo}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>` : ""}
    <mask id="die-unmarked"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>${holes}</mask>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#05070a" fill-opacity="${OUTSIDE_DIM}" mask="url(#die-unmarked)"/>
    <g font-family="${SANS}" font-weight="600">${blocks}</g>`;
}

/** `photo` is the die photo as a data URI (omitted in tests: the frame stays empty). */
export function renderHero(data, { fonts = "", photo = "" } = {}) {
  const W = README_W;
  const H = DIE.y + DIE.h + 28;
  const px = DIE.panelX;
  const right = W - MARGIN;
  const rowY = (g) => 172 + g * 17;
  const total = data.repos.reduce((n, r) => n + r.contributions, 0);
  const rows = data.repos
    .map((repo, g) => {
      const y = rowY(g);
      const lit = litSMs(repo.contributions);
      const cells = SM_THRESHOLDS.map((_, s) => `<rect x="${px + 230 + s * 10}" y="${y - 8}" width="8" height="8" fill="${s < lit ? p.ramp[level(s) - 1] : p.well}"/>`).join("");
      return `<text x="${px}" y="${y}" font-size="${TYPE.label}" fill="${p.text3}" data-row="${g}">${g + 1}</text><text x="${px + 24}" y="${y}" font-size="${TYPE.body}" fill="${p.text}">${escapeXml(repo.title)}</text><g shape-rendering="crispEdges">${cells}</g><text x="${right}" y="${y}" text-anchor="end" font-size="${TYPE.body}" fill="${p.text2}" style="font-variant-numeric:tabular-nums">${repo.contributions}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Zachary Stubbs</title>
  <desc id="d">A photo of NVIDIA's GF110 GPU die with my ${data.repos.length} projects marked on it, numbered like the list beside it; a block is brighter the more of my ${total} contributions went to that project. ${DIE.credit}.</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}

  ${fixed(renderDie(data, photo))}

  <g font-family="${SANS}" font-weight="500">
    <text x="${DIE.x}" y="${H - 8}" font-size="${TYPE.label}" fill="${p.text3}">${DIE.credit}</text>
    <text x="${px - 2}" y="60" font-weight="600" font-size="${TYPE.display}" letter-spacing="-0.4" fill="${p.text}">Zachary Stubbs</text>
    <text x="${px}" y="86" font-size="${TYPE.body}" fill="${p.text2}">Electrical &amp; Computer Engineering at Texas A&amp;M</text>
    <text x="${px}" y="110" font-size="${TYPE.label}" fill="${p.text3}">${total} contributions to these ${data.repos.length} projects</text>
    <g font-size="${TYPE.label}" fill="${p.text3}">
      <text x="${px + 24}" y="148">Project</text><text x="${right}" y="148" text-anchor="end">Contributions</text>
    </g>
    ${rows}
  </g>
</svg>
`;
}
