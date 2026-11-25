// A photograph with parts marked on it, the one annotation style both header images use: everything
// outside the marks is shaded a little, each mark is a 1 px white outline with a small tag (a number or a
// letter) that the list beside the photo repeats. No leader lines; the tag is the link to the list.
import { escapeXml } from "./svg.mjs";
import { SANS } from "./style.mjs";

const SHADE = "#05070a";
export const OUTSIDE_DIM = 0.35;
const TAG = 13;

const r1 = (v) => Math.round(v * 10) / 10;

/**
 * `marks`: [{ rect: [x0, y0, x1, y1] as fractions of the photo, label, title, dim?, tag? }].
 * `dim` (0 to 1) shades the mark itself, for marks that carry a quantity. `tag` places the label box:
 * "inside" the top-left corner (default), or "left" of / "above" a part too small to hold it.
 * `href` is the photo as a data URI (omitted in tests: the frame stays empty). The result is page-independent
 * markup; wrap it in fixed() so the light theme leaves it alone.
 */
export function markedPhoto({ id, href = "", x, y, w, h, marks }) {
  const placed = marks.map((mark, i) => {
    const [fx0, fy0, fx1, fy1] = mark.rect;
    return { ...mark, i, bx: r1(x + fx0 * w), by: r1(y + fy0 * h), bw: r1((fx1 - fx0) * w), bh: r1((fy1 - fy0) * h) };
  });
  const holes = placed.map(({ bx, by, bw, bh }) => `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#000"/>`).join("");
  const drawn = placed
    .map(({ i, label, title, dim = 0, tag = "inside", bx, by, bw, bh }) => {
      const [tx, ty] = tag === "left" ? [bx - TAG, r1(by + (bh - TAG) / 2)] : tag === "above" ? [bx, by - TAG] : [bx, by];
      const tagBox = `<rect x="${tx}" y="${ty}" width="${TAG}" height="${TAG}" fill="#0b0f15" fill-opacity="0.85"/><text x="${r1(tx + TAG / 2)}" y="${r1(ty + 10)}" text-anchor="middle" font-size="10" fill="#f1f5ff" data-mark-label="${i}">${escapeXml(label)}</text>`;
      return `<g data-mark="${i}"><title>${escapeXml(title)}</title><rect data-dim="${i}" x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${SHADE}" fill-opacity="${dim}"/><rect x="${r1(bx + 0.5)}" y="${r1(by + 0.5)}" width="${r1(bw - 1)}" height="${r1(bh - 1)}" fill="none" stroke="#f1f5ff" stroke-opacity="0.6"/>${tagBox}</g>`;
    })
    .join("");
  return `<rect data-photo="1" x="${x}" y="${y}" width="${w}" height="${h}" fill="#15181f"/>${href ? `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>` : ""}
    <mask id="${id}-unmarked"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>${holes}</mask>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${SHADE}" fill-opacity="${OUTSIDE_DIM}" mask="url(#${id}-unmarked)"/>
    <g font-family="${SANS}" font-weight="600">${drawn}</g>`;
}
