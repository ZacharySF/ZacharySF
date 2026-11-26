// The tech stack as a teardown figure, the way repair guides annotate a board: each row of the stack has one
// colour, which outlines its parts on the photo and marks its entry in the legend beside it. No leader lines,
// no letters; everything not outlined is shaded so the outlined parts carry the picture.
// The photo is the front of an RTX 4090 board by Fritzchens Fritz, released CC0 on Wikimedia Commons:
// https://commons.wikimedia.org/wiki/File:Nvidia@5nm@AdaLovelace@AD102@GeForce_RTX_4090@S_TW_2324A1_U2F028.MOW_AD102-301-A1_DSCx3@VIS.jpg
// Colours are five hues of the Okabe-Ito set, chosen to stay apart for colour-blind readers; its green is
// lightened so it holds against the black solder mask.
import { DIE } from "./gpu.mjs";
import { markedPhoto } from "./photo.mjs";
import { escapeXml } from "./svg.mjs";
import { fixed, MARGIN, PALETTE as p, README_W, SANS, TYPE } from "./style.mjs";

/** The board photo: on the die photo's left edge, 478 x 312 (the crop's proportions). */
export const BOARD = { file: "rtx4090-board.jpg", x: DIE.x, y: MARGIN, w: 478, h: 312 };

/**
 * Per tech stack row: the part it stands for, that part's pieces on the photo as fractions [x0, y0, x1, y1],
 * its colour, and which legend column it goes in.
 */
export const PARTS = {
  Languages: { part: "GPU", color: "#E69F00", column: 0, rects: [[0.3573, 0.2975, 0.5812, 0.6452]] },
  Systems: {
    part: "memory chips",
    color: "#2FBF8F",
    column: 0,
    rects: [
      [0.2781, 0.2944, 0.3542, 0.6389],
      [0.3958, 0.1702, 0.5583, 0.2735],
      [0.5854, 0.2944, 0.6615, 0.6389],
      [0.4812, 0.6525, 0.5521, 0.7433],
    ],
  },
  Embedded: { part: "power input", color: "#CC79A7", column: 1, rects: [[0.8677, 0.0522, 0.951, 0.1336]] },
  Networks: { part: "PCIe connector", color: "#F0E442", column: 1, rects: [[0.2375, 0.9104, 0.6719, 0.9521]] },
  Apps: { part: "display outputs", color: "#56B4E9", column: 1, rects: [[0.0292, 0.2923, 0.1, 0.8509]] },
};

// Legend: two columns right of the photo, their tops on the photo's top edge. An entry is a 10 px swatch,
// its name, then one item per line.
const LEGEND = { columns: [BOARD.x + BOARD.w + 32, BOARD.x + BOARD.w + 192], indent: 18, firstItem: 34, leading: 16, gap: 8 };

/** `stack` is [label, items][] from projects.mjs; `photo` is the board photo as a data URI (omitted in tests). */
export function renderCardRow(stack, { fonts = "", photo = "" } = {}) {
  const W = README_W;
  const H = BOARD.y + BOARD.h + MARGIN;
  const marks = [];
  const tops = LEGEND.columns.map(() => BOARD.y);
  let legend = "";
  for (const [label, items] of stack) {
    const part = PARTS[label];
    if (!part) throw new Error(`tech stack row "${label}" has no part on the board (see PARTS)`);
    for (const rect of part.rects) marks.push({ rect, key: label, color: part.color });
    const x = LEGEND.columns[part.column];
    const top = tops[part.column];
    const lines = items.map((item, i) => `<text x="${x + LEGEND.indent}" y="${top + LEGEND.firstItem + i * LEGEND.leading}" font-size="${TYPE.label}" fill="${p.text2}">${escapeXml(item)}</text>`).join("");
    legend += `${fixed(`<rect data-key="${escapeXml(label)}" x="${x}" y="${top + 2}" width="10" height="10" fill="${part.color}"/>`)}<text x="${x + LEGEND.indent}" y="${top + 12}" font-weight="600" font-size="${TYPE.body}" fill="${p.text}">${escapeXml(label)}</text>${lines}`;
    tops[part.column] = top + LEGEND.firstItem + items.length * LEGEND.leading + LEGEND.gap;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Tech stack</title>
  <desc id="d">${escapeXml(`A photo of an RTX 4090 graphics card's circuit board. Each part of my tech stack is outlined on it in its own colour. ${stack.map(([label, items]) => `${label} (the ${PARTS[label].part}): ${items.join(", ")}`).join(". ")}.`)}</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  ${fixed(markedPhoto({ id: "board", href: photo, x: BOARD.x, y: BOARD.y, w: BOARD.w, h: BOARD.h, marks, shade: 0.45 }))}
  <g font-family="${SANS}" font-weight="500">${legend}</g>
</svg>
`;
}
