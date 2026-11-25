// The tech stack as a teardown figure: Fritzchens Fritz's photo of the GTX 580 whose GF110 die is in the
// hero (CC0, Wikimedia Commons), cut out of its white studio background so it sits on either page colour:
// https://commons.wikimedia.org/wiki/File:NVIDIA@40nm@Fermi@GF110@GeForce_GTX_580@UA10B338_1041A1_N2Y540.000_GF110-375-A1_DSC04152_(27576804994).jpg
// Each tech stack row is a label beside the card with a leader to the part it goes with:
//   cooler shroud = systems, display outputs = apps, power input = embedded, the die = languages,
//   PCIe edge connector = networks.
// Labels sit in two columns (left of the card, right of it) on the hero's margins and type scale.
import { escapeXml } from "./svg.mjs";
import { fixed, MARGIN, PALETTE as p, README_W, SANS, TYPE } from "./style.mjs";

/** The cut-out's place in the 846 x 304 figure. */
export const CARD = { file: "gtx580-card.webp", x: 204, y: 32, w: 440, h: 242 };

/** Label columns: x of each, their width, and the longest line that fits (12 px Plex Sans, average advance). */
export const LABEL = { left: MARGIN, right: 656, width: 166, chars: 25, charWidth: 6.6, leading: 16 };

/** Per tech stack row: the part it points at, as a fraction of the cut-out, its column, and its rule's y. */
export const CALLOUTS = {
  Systems: { part: [0.1, 0.2], side: "left", y: 44 },
  Apps: { part: [0.245, 0.665], side: "left", y: 240 },
  Embedded: { part: [0.755, 0.175], side: "right", y: 44 },
  Languages: { part: [0.585, 0.515], side: "right", y: 156 },
  Networks: { part: [0.66, 0.625], side: "right", y: 240 },
};

/** Break a list into lines of at most `chars`, only between items; a line that continues ends in a comma. */
export function wrapItems(items, chars) {
  const lines = [];
  let line = "";
  items.forEach((item, i) => {
    const piece = i < items.length - 1 ? `${item},` : item;
    if (!line) line = piece;
    else if (line.length + 1 + piece.length <= chars) line += ` ${piece}`;
    else {
      lines.push(line);
      line = piece;
    }
  });
  if (line) lines.push(line);
  return lines;
}

const r1 = (v) => Math.round(v * 10) / 10;

/** `stack` is [label, items][] from projects.mjs; `photo` is the cut-out as a data URI (omitted in tests). */
export function renderCardRow(stack, { fonts = "", photo = "" } = {}) {
  const W = README_W;
  const H = 304;
  let leaders = "";
  let anchors = "";
  let labels = "";
  for (const [label, items] of stack) {
    const callout = CALLOUTS[label];
    if (!callout) throw new Error(`tech stack row "${label}" has no part on the card (see CALLOUTS)`);
    const { part, side, y } = callout;
    const x = side === "left" ? LABEL.left : LABEL.right;
    const [ax, ay] = [r1(CARD.x + part[0] * CARD.w), r1(CARD.y + part[1] * CARD.h)];
    const from = side === "left" ? x + LABEL.width : x; // the rule's end that faces the card
    leaders += `<path d="M${x} ${y + 0.5}H${x + LABEL.width}M${from} ${y + 0.5}L${ax} ${ay}" fill="none" stroke="${p.text3}"/>`;
    anchors += `<circle data-anchor="${escapeXml(label)}" cx="${ax}" cy="${ay}" r="3" fill="#ffffff" stroke="#0d1117"/>`;
    const lines = wrapItems(items, LABEL.chars)
      .map((line, i) => `<text x="${x}" y="${y + 18 + i * LABEL.leading}" font-size="${TYPE.label}" fill="${p.text2}">${escapeXml(line)}</text>`)
      .join("");
    labels += `<g data-callout="${escapeXml(label)}"><text x="${x}" y="${y - 8}" font-weight="600" font-size="${TYPE.body}" fill="${p.text}">${escapeXml(label)}</text>${lines}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Tech stack</title>
  <desc id="d">${escapeXml(`A photo of a GTX 580 graphics card with my tech stack labelled on its parts. ${stack.map(([label, items]) => `${label}: ${items.join(", ")}`).join(". ")}.`)}</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  ${fixed(photo ? `<image href="${photo}" x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}"/>` : `<rect x="${CARD.x}" y="${CARD.y}" width="${CARD.w}" height="${CARD.h}" fill="#15181f"/>`)}
  ${leaders}
  ${fixed(anchors)}
  <g font-family="${SANS}" font-weight="500">${labels}</g>
</svg>
`;
}
