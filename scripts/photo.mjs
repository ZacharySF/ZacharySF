// A photograph with parts marked on it, the annotation both header images use: everything outside the marks
// is shaded, and each mark is an outline that the text beside the photo refers to, either by a small tag
// (the die's block numbers) or by its colour (the board's tech stack). No leader lines.
import { escapeXml } from "./svg.mjs";
import { SANS } from "./style.mjs";

const SHADE = "#05070a";
const TAG = 13;

const r1 = (v) => Math.round(v * 10) / 10;

/**
 * `marks`: [{ rect: [x0, y0, x1, y1] as fractions of the photo, key, title?, label?, dim?, color? }].
 * `key` names the mark in the markup. `label` draws a tag with that text in the mark's top-left corner.
 * `dim` (0 to 1) shades the mark itself, for marks that carry a quantity. `color` draws a 2 px outline in
 * that colour instead of the thin white one. `shade` (0 to 1) is how dark everything unmarked goes.
 * `href` is the photo as a data URI (omitted in tests: the frame stays empty). The result is page-independent
 * markup; wrap it in fixed() so the light theme leaves it alone.
 */
export function markedPhoto({ id, href = "", x, y, w, h, marks, shade }) {
  const placed = marks.map((mark) => {
    const [fx0, fy0, fx1, fy1] = mark.rect;
    return { ...mark, bx: r1(x + fx0 * w), by: r1(y + fy0 * h), bw: r1((fx1 - fx0) * w), bh: r1((fy1 - fy0) * h) };
  });
  const holes = placed.map(({ bx, by, bw, bh }) => `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#000"/>`).join("");
  const drawn = placed
    .map(({ key, label, title, dim = 0, color, bx, by, bw, bh }) => {
      const inset = color ? 1 : 0.5;
      const outline = `<rect data-outline="${escapeXml(`${key}`)}" x="${r1(bx + inset)}" y="${r1(by + inset)}" width="${r1(bw - 2 * inset)}" height="${r1(bh - 2 * inset)}" fill="none" stroke="${color ?? "#f1f5ff"}"${color ? ' stroke-width="2"' : ' stroke-opacity="0.6"'}/>`;
      const tag = label === undefined ? "" : `<rect x="${bx}" y="${by}" width="${TAG}" height="${TAG}" fill="#0b0f15" fill-opacity="0.85"/><text x="${r1(bx + TAG / 2)}" y="${r1(by + 10)}" text-anchor="middle" font-size="10" fill="#f1f5ff" data-mark-label="${escapeXml(`${key}`)}">${escapeXml(label)}</text>`;
      return `<g data-mark="${escapeXml(`${key}`)}">${title ? `<title>${escapeXml(title)}</title>` : ""}<rect data-dim="${escapeXml(`${key}`)}" x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${SHADE}" fill-opacity="${dim}"/>${outline}${tag}</g>`;
    })
    .join("");
  return `<rect data-photo="1" x="${x}" y="${y}" width="${w}" height="${h}" fill="#15181f"/>${href ? `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>` : ""}
    <mask id="${id}-unmarked"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>${holes}</mask>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${SHADE}" fill-opacity="${shade}" mask="url(#${id}-unmarked)"/>
    <g font-family="${SANS}" font-weight="600">${drawn}</g>`;
}
