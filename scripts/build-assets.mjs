// Renders every generated image on the profile with the shared tokens in style.mjs:
// project cards, layer banners, the GPU floorplan hero and the graphics-card contribution calendar.
// Usage: node scripts/build-assets.mjs   (reads assets/gpu-data.json, writes assets/**/*.svg)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderCalendarCard } from "./card.mjs";
import { renderHero } from "./gpu.mjs";
import { layers } from "./projects.mjs";
import { COND, fontCss, MARGIN, PALETTE as p, panel, README_W, SANS, TYPE } from "./style.mjs";
import { escapeXml } from "./svg.mjs";

// Two cards per line in the 846 px column: 420 + 6 + 420.
export const CARD = { width: 420, height: 200, charsPerLine: 50, maxLines: 4 };
const LAYER = { width: README_W, height: 104 };

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

const defs = (fonts) => (fonts ? `<defs><style>${fonts}</style></defs>` : "");

export function renderCard(project, { fonts = "" } = {}) {
  const { width: w, height: h } = CARD;
  const description = wrap(project.description, CARD.charsPerLine)
    .map((line, i) => `<tspan x="${MARGIN}" dy="${i ? 20 : 0}">${escapeXml(line)}</tspan>`)
    .join("");
  const meta = [project.language, ...project.tags].map(escapeXml).join(" · ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
  <title id="t">${escapeXml(project.title)} (${escapeXml(project.repo)})</title>
  <desc id="d">${escapeXml(project.description)}</desc>
  ${defs(fonts)}
  ${panel(w, h)}
  <g font-family="${SANS}" font-weight="500">
    <text x="${MARGIN}" y="48" font-weight="600" font-size="${TYPE.title}" fill="${p.text}">${escapeXml(project.title)}</text>
    <text x="${w - MARGIN}" y="46" text-anchor="end" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="0.3" fill="${p.accent}">${escapeXml(project.role.toUpperCase())}</text>
    <text x="${MARGIN}" y="68" font-family="${COND}" font-size="${TYPE.label}" fill="${p.text3}">${escapeXml(project.repo)}</text>
    <text y="96" font-size="${TYPE.body}" fill="${p.text2}">${description}</text>
    <text x="${MARGIN}" y="${h - MARGIN}" font-family="${COND}" font-size="${TYPE.label}" fill="${p.text3}">${meta}</text>
  </g>
</svg>
`;
}

export function renderLayer(layer, index, count, { fonts = "" } = {}) {
  const { width: w, height: h } = LAYER;
  // Depth gauge: one bar per layer, the bottom bar is the hardware.
  const bars = Array.from({ length: count }, (_, depth) => {
    const active = depth === index;
    const y = MARGIN + (count - 1 - depth) * 8;
    return `<rect data-depth="${depth}" data-active="${active}" x="${MARGIN}" y="${y}" width="${48 - depth * 8}" height="4" fill="${active ? p.accent : p.structure}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t">
  <title id="t">Layer ${index + 1}, ${escapeXml(layer.level)}: ${escapeXml(layer.title)}</title>
  ${defs(fonts)}
  ${panel(w, h)}
  <g shape-rendering="crispEdges">${bars}</g>
  <g font-family="${SANS}" font-weight="500">
    <text x="96" y="${MARGIN + 9}" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="1.6" fill="${p.text3}">LAYER ${index + 1} · ${escapeXml(layer.level.toUpperCase())}</text>
    <text x="96" y="60" font-weight="600" font-size="${TYPE.title}" fill="${p.text}">${escapeXml(layer.title)}</text>
    <text x="96" y="82" font-size="${TYPE.body}" fill="${p.text2}">${escapeXml(layer.concepts)}</text>
  </g>
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
  layers.forEach((layer, index) => {
    write(join(root, "assets/layers", `${layer.slug}.svg`), renderLayer(layer, index, layers.length, { fonts }));
    for (const project of layer.projects) write(join(root, "assets/cards", `${project.slug}.svg`), renderCard(project, { fonts }));
  });
  const gpuData = JSON.parse(readFileSync(join(root, "assets/gpu-data.json"), "utf8"));
  write(join(root, "assets/hero.svg"), renderHero(gpuData, { fonts }));
  write(join(root, "assets/calendar.svg"), renderCalendarCard(gpuData.calendar, { fonts }));
}
