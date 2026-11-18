// Renders every generated image on the profile with the shared tokens in style.mjs:
// the GPU floorplan hero, one block of pictures per project and the graphics-card contribution calendar.
// Each image is written twice, for GitHub's dark and light pages (see retheme in style.mjs).
// Usage: node scripts/build-assets.mjs   (reads assets/gpu-data.json and assets/shots, writes assets/**/*.svg)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderCalendarCard } from "./card.mjs";
import { DIAGRAMS } from "./diagrams.mjs";
import { renderHero } from "./gpu.mjs";
import { layers, stack } from "./projects.mjs";
import { COND, fixed, fontCss, MARGIN, PALETTE as p, RADIUS, README_W, retheme, SANS, TYPE } from "./style.mjs";
import { escapeXml } from "./svg.mjs";

/** A project block: header (layer, name, role, summary), then a lead picture with two thumbnails, or one wide picture. */
export const BLOCK = {
  top: 108, // first picture row, below the header
  lead: { w: 532, h: 332 },
  thumb: { w: 250, h: 148 },
  gap: 16,
  caption: 16, // baseline below a picture
  bottom: 32,
  summaryChars: 110, // one 14 px line across the column
  captionCharWidth: 6.4, // 12 px Plex Sans, average advance
};

/** Where each of a project's pictures goes, in order: [lead, upper thumbnail, lower thumbnail] or [wide]. */
export function slotsFor(project) {
  const { top, lead, thumb, gap } = BLOCK;
  if (project.shots.length === 1) return [{ x: MARGIN, y: top, w: README_W - 2 * MARGIN, h: project.shots[0].height }];
  if (project.shots.length !== 3) throw new Error(`${project.slug}: a project shows one picture or three, not ${project.shots.length}`);
  const x = MARGIN + lead.w + gap;
  return [
    { x: MARGIN, y: top, ...lead },
    { x, y: top, ...thumb },
    { x, y: top + lead.h - thumb.h, ...thumb },
  ];
}

/** One project: `images` maps a shot's file name to a data URI (omitted in tests: the frame stays empty). */
export function renderProject(project, layer, layerIndex, layerCount, { images = {}, fonts = "" } = {}) {
  const W = README_W;
  const slots = slotsFor(project);
  const H = Math.ceil((Math.max(...slots.map((s) => s.y + s.h)) + BLOCK.caption + BLOCK.bottom) / 8) * 8;
  const right = W - MARGIN;
  const gauge = Array.from({ length: layerCount }, (_, depth) => `<rect data-depth="${depth}" data-active="${depth === layerIndex}" x="${MARGIN}" y="${18 + (layerCount - 1 - depth) * 5}" width="${32 - depth * 6}" height="3" fill="${depth === layerIndex ? p.accent : p.structure}"/>`).join("");
  const pictures = project.shots
    .map((shot, i) => {
      const { x, y, w, h } = slots[i];
      const clip = `clip-path="url(#s${i})"`;
      const inside = shot.diagram
        ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS.panel}" fill="${p.surface}"/><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DIAGRAMS[shot.diagram](w, h)}</svg>`
        : fixed(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS.panel}" fill="${p.surface}"/>${images[shot.file] ? `<image href="${images[shot.file]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" ${clip}/>` : ""}`);
      return `<clipPath id="s${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS.panel}"/></clipPath>${inside}<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${RADIUS.panel - 0.5}" fill="none" stroke="${p.structure}"/><text x="${x}" y="${y + h + BLOCK.caption}" font-size="${TYPE.label}" fill="${p.text3}">${escapeXml(shot.caption)}</text>`;
    })
    .join("\n    ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">${escapeXml(project.title)}</title>
  <desc id="d">${escapeXml(`${project.short} Pictures: ${project.shots.map((s) => s.caption).join("; ")}.`)}</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  <g font-family="${SANS}" font-weight="500">
    <g shape-rendering="crispEdges"><rect x="${MARGIN}" y="0" width="${W - 2 * MARGIN}" height="1" fill="${p.structure}"/>${gauge}</g>
    <text x="64" y="32" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="1" fill="${p.text3}">LAYER ${layerIndex + 1} · ${escapeXml(layer.level.toUpperCase())}</text>
    <text x="${right}" y="32" text-anchor="end" font-size="${TYPE.label}" fill="${p.text3}">${escapeXml(layer.title)}</text>
    <text x="${MARGIN}" y="68" font-weight="600" font-size="${TYPE.title}" fill="${p.text}">${escapeXml(project.title)}</text>
    <text x="${right}" y="68" text-anchor="end" font-size="${TYPE.body}" fill="${p.accent}">${escapeXml(project.role)}</text>
    <text x="${MARGIN}" y="92" font-size="${TYPE.body}" fill="${p.text2}">${escapeXml(project.short)}</text>
    ${pictures}
  </g>
</svg>
`;
}

/** The tech stack, sized to sit beside the 440 x 232 graphics card (no flush on the page). */
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
  // Every image is drawn once for the dark page, then recoloured for the light one.
  const write = (name, svg) => {
    for (const [theme, out] of [["dark", svg], ["light", retheme(svg)]]) {
      const path = join(root, "assets", `${name}-${theme}.svg`);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, out);
    }
  };
  const fonts = fontCss(root);
  const textFonts = fontCss(root, ["sans500", "sans600", "cond500"]);
  const gpuData = JSON.parse(readFileSync(join(root, "assets/gpu-data.json"), "utf8"));
  write("hero", renderHero(gpuData, { fonts }));
  write("card-row", renderCardRow(renderCalendarCard(gpuData.calendar), renderStack(stack), { fonts }));
  layers.forEach((layer, i) => {
    for (const project of layer.projects) {
      const images = Object.fromEntries(project.shots.filter((s) => s.file).map((s) => [s.file, `data:image/jpeg;base64,${readFileSync(join(root, "assets/shots", s.file)).toString("base64")}`]));
      write(`projects/${project.slug}`, renderProject(project, layer, i, layers.length, { images, fonts: textFonts }));
    }
  });
}
