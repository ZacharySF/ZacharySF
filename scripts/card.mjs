// The tech stack, on the hero's grid and in its annotation style: a top-down photo on the left with parts
// marked and lettered, and the list beside it repeating the letters (see photo.mjs).
// The photo is the front of an RTX 4090 board by Fritzchens Fritz, released CC0 on Wikimedia Commons:
// https://commons.wikimedia.org/wiki/File:Nvidia@5nm@AdaLovelace@AD102@GeForce_RTX_4090@S_TW_2324A1_U2F028.MOW_AD102-301-A1_DSCx3@VIS.jpg
// Each tech stack row is marked on the part it goes with:
//   the GPU = languages, the power input = embedded, memory = systems, the PCIe edge connector = networks,
//   the display outputs = apps.
import { DIE } from "./gpu.mjs";
import { markedPhoto } from "./photo.mjs";
import { escapeXml } from "./svg.mjs";
import { fixed, MARGIN, PALETTE as p, README_W, SANS, TYPE } from "./style.mjs";

/** The board photo: under the die photo, same left edge and width; 276 x 180 keeps the crop's proportions. */
export const BOARD = { file: "rtx4090-board.jpg", x: DIE.x, y: MARGIN, w: DIE.w, h: 180 };

/** The list beside it starts where the hero's project list starts; 14 px Plex Sans averages 7.1 px a character. */
export const LIST = { x: DIE.panelX, nameX: DIE.panelX + 24, itemsX: DIE.panelX + 120, pitch: 30, charWidth: 7.1 };

/** Per tech stack row: the part's outline as fractions of the photo [x0, y0, x1, y1], and where its letter sits. */
export const PARTS = {
  Languages: { part: "GPU", rect: [0.3573, 0.2975, 0.5812, 0.6452] },
  Embedded: { part: "power input", rect: [0.8677, 0.0522, 0.951, 0.1336], tag: "left" },
  Systems: { part: "memory", rect: [0.3958, 0.1702, 0.5583, 0.2735], tag: "left" },
  Networks: { part: "PCIe connector", rect: [0.2375, 0.9104, 0.6719, 0.9521], tag: "left" },
  Apps: { part: "display outputs", rect: [0.0292, 0.2923, 0.1, 0.8509], tag: "above" },
};

const LETTERS = "ABCDEFGH";

/** `stack` is [label, items][] from projects.mjs; `photo` is the board photo as a data URI (omitted in tests). */
export function renderCardRow(stack, { fonts = "", photo = "" } = {}) {
  const W = README_W;
  const H = BOARD.y + BOARD.h + MARGIN;
  const marks = stack.map(([label], i) => {
    const part = PARTS[label];
    if (!part) throw new Error(`tech stack row "${label}" has no part on the board (see PARTS)`);
    return { rect: part.rect, label: LETTERS[i], title: `${LETTERS[i]}. ${label}, marked on the ${part.part}`, tag: part.tag };
  });
  // Header on the photo's top edge, last row on its bottom edge, rows a fixed pitch apart.
  const lastY = BOARD.y + BOARD.h - 8;
  const rowY = (i) => lastY - (stack.length - 1 - i) * LIST.pitch;
  const rows = stack
    .map(([label, items], i) => {
      const y = rowY(i);
      return `<text x="${LIST.x}" y="${y}" font-size="${TYPE.label}" fill="${p.text3}" data-row="${i}">${LETTERS[i]}</text><text x="${LIST.nameX}" y="${y}" font-size="${TYPE.body}" fill="${p.text}">${escapeXml(label)}</text><text x="${LIST.itemsX}" y="${y}" font-size="${TYPE.body}" fill="${p.text2}">${escapeXml(items.join(", "))}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Tech stack</title>
  <desc id="d">${escapeXml(`A photo of an RTX 4090 graphics card's circuit board with five parts marked A to E, one for each row of my tech stack. ${stack.map(([label, items], i) => `${LETTERS[i]}, ${label} (${PARTS[label].part}): ${items.join(", ")}`).join(". ")}.`)}</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  ${fixed(markedPhoto({ id: "board", href: photo, ...BOARD, marks }))}
  <g font-family="${SANS}" font-weight="500">
    <text x="${LIST.nameX}" y="${BOARD.y + 9}" font-size="${TYPE.label}" fill="${p.text3}">Tech stack</text>
    ${rows}
  </g>
</svg>
`;
}
