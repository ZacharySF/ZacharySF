// Renders every generated image on the profile with the shared tokens in style.mjs:
// the GPU floorplan hero, the compact projects-by-layer panel and the graphics-card contribution calendar.
// Usage: node scripts/build-assets.mjs   (reads assets/gpu-data.json, writes assets/*.svg)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderCalendarCard } from "./card.mjs";
import { renderHero } from "./gpu.mjs";
import { layers, stack } from "./projects.mjs";
import { COND, fontCss, MARGIN, PALETTE as p, panel, README_W, SANS, TYPE } from "./style.mjs";
import { escapeXml } from "./svg.mjs";

/** A project slot in the panel: 275 px wide, two 12 px lines of summary. */
export const SLOT = { width: 275, charsPerLine: 43, maxLines: 2 };
const ROW_H = 76;
const TOP = 52;

/** Greedy word wrap to at most `width` characters per line. */
export function wrap(text, width) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** All projects in one panel: one row per layer (hardware first), two projects per row. */
export function renderProjects(layerList, { fonts = "" } = {}) {
  const W = README_W;
  const H = TOP + layerList.length * ROW_H + 4;
  const slotX = [256, 256 + SLOT.width + 16];
  const rows = layerList
    .map((layer, i) => {
      const y = TOP + i * ROW_H;
      const gauge = layerList
        .map((_, depth) => `<rect data-row="${i}" data-depth="${depth}" data-active="${depth === i}" x="${MARGIN}" y="${y + 2 + (layerList.length - 1 - depth) * 5}" width="${32 - depth * 6}" height="3" fill="${depth === i ? p.accent : p.structure}"/>`)
        .join("");
      const slots = layer.projects
        .map((project, k) => {
          const x = slotX[k];
          const summary = wrap(project.short, SLOT.charsPerLine)
            .map((line, l) => `<tspan x="${x}" dy="${l ? 16 : 0}">${escapeXml(line)}</tspan>`)
            .join("");
          return `<g data-project="${escapeXml(project.slug)}"><text x="${x}" y="${y + 14}" font-weight="600" font-size="${TYPE.body}" fill="${p.text}">${escapeXml(project.title)}</text><text x="${x + SLOT.width}" y="${y + 14}" text-anchor="end" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="0.3" fill="${p.accent}">${escapeXml(project.role.toUpperCase())}</text><text y="${y + 34}" font-size="${TYPE.label}" fill="${p.text2}">${summary}</text></g>`;
        })
        .join("");
      const rule = i < layerList.length - 1 ? `<rect x="${MARGIN}" y="${y + ROW_H - 12}" width="${W - 2 * MARGIN}" height="1" fill="${p.structure}"/>` : "";
      return `<g shape-rendering="crispEdges">${gauge}${rule}</g>
    <text x="64" y="${y + 14}" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="1" fill="${p.text3}">LAYER ${i + 1} · ${escapeXml(layer.level.toUpperCase())}</text>
    <text x="${MARGIN}" y="${y + 38}" font-weight="600" font-size="${TYPE.body}" fill="${p.text2}">${escapeXml(layer.title)}</text>
    ${slots}`;
    })
    .join("\n    ");
  const names = layerList.flatMap((l) => l.projects.map((pr) => pr.title)).join(", ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Projects by layer, hardware first</title>
  <desc id="d">${escapeXml(names)}</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  ${panel(W, H)}
  <g font-family="${SANS}" font-weight="500">
    <text x="${MARGIN}" y="${MARGIN + 9}" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="1.6" fill="${p.text3}">PROJECTS · BY LAYER, HARDWARE FIRST</text>
    ${rows}
  </g>
</svg>
`;
}

/** The tech stack, sized to sit beside the 440 x 232 graphics card (no panel, flush on the page). */
export const STACK = { width: 400, height: 232, charsPerLine: 44 };

export function renderStack(rows, { fonts = "" } = {}) {
  const { width: W, height: H } = STACK;
  const lines = rows
    .map(([label, items], i) => {
      const y = 76 + i * 34;
      return `<g data-stack-row="${i}"><text x="0" y="${y}" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="1" fill="${p.text3}">${escapeXml(label)}</text><text x="96" y="${y}" font-size="${TYPE.label}" fill="${p.text2}">${escapeXml(items)}</text></g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Tech stack</title>
  <desc id="d">${escapeXml(rows.map(([l, items]) => `${l}: ${items}`).join("; "))}</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  <g font-family="${SANS}" font-weight="500">
    <text x="0" y="40" font-weight="600" font-size="${TYPE.title}" fill="${p.text}">Tech stack</text>
    ${lines}
  </g>
</svg>
`;
}

/** The graphics card (left) and tech stack (right) as one 846 px row, so they never wrap apart. */
export function renderCardRow(cardSvg, stackSvg, { fonts = "" } = {}) {
  const H = STACK.height;
  const place = (svg, x) => svg.replace("<svg ", `<svg x="${x}" y="0" `);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${README_W}" height="${H}" viewBox="0 0 ${README_W} ${H}" role="img" aria-label="Contributions on a graphics card, and tech stack">
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  ${place(cardSvg, 0)}
  ${place(stackSvg, 384)}
</svg>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const write = (path, svg) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, svg);
  };
  const fonts = fontCss(root);
  const gpuData = JSON.parse(readFileSync(join(root, "assets/gpu-data.json"), "utf8"));
  write(join(root, "assets/chip.svg"), renderHero(gpuData, { fonts }));
  write(join(root, "assets/projects.svg"), renderProjects(layers, { fonts }));
  write(join(root, "assets/card-row.svg"), renderCardRow(renderCalendarCard(gpuData.calendar), renderStack(stack), { fonts }));
}
