// The tech stack, set as type on the header's grid: one line per area, the area's name on the die photo's left
// edge and its tools in the project list's column, under a rule that spans the header's margins.
import { DIE } from "./gpu.mjs";
import { escapeXml } from "./svg.mjs";
import { MARGIN, PALETTE as p, README_W, SANS, TYPE } from "./style.mjs";

const PITCH = 24;
const FIRST = 40;

/** `stack` is [area, items][] from projects.mjs. */
export function renderStack(stack, { fonts = "" } = {}) {
  const W = README_W;
  const H = FIRST + (stack.length - 1) * PITCH + 24;
  const lines = stack
    .map(([area, items], i) => {
      const y = FIRST + i * PITCH;
      const name = escapeXml(area);
      return `<text data-area="${name}" x="${DIE.x}" y="${y}" font-weight="600" fill="${p.text}">${name}</text><text data-tools="${name}" x="${DIE.panelX}" y="${y}" fill="${p.text2}">${escapeXml(items.join(", "))}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Tech stack</title>
  <desc id="d">${escapeXml(stack.map(([area, items]) => `${area}: ${items.join(", ")}`).join(". "))}.</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  <rect x="${MARGIN}" y="0" width="${W - 2 * MARGIN}" height="1" fill="${p.structure}"/>
  <g font-family="${SANS}" font-weight="500" font-size="${TYPE.body}">${lines}</g>
</svg>
`;
}
