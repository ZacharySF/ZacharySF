// Renders every generated image on the profile with the shared tokens in style.mjs:
// the GPU floorplan hero, the graphics-card contribution calendar beside the tech stack, and one block
// of pictures per project (the README carries each project's title and description).
// Each image is written twice, for GitHub's dark and light pages (see retheme in style.mjs).
// Usage: node scripts/build-assets.mjs   (reads assets/gpu-data.json and assets/shots, writes assets/**/*.svg)
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderCalendarCard } from "./card.mjs";
import { DIAGRAMS } from "./diagrams.mjs";
import { DIE, renderHero } from "./gpu.mjs";
import { categories, stack } from "./projects.mjs";
import { fixed, fontCss, MARGIN, PALETTE as p, RADIUS, README_W, retheme, SANS, TYPE } from "./style.mjs";
import { escapeXml } from "./svg.mjs";

/** A project block: a lead picture with two thumbnails, or one wide picture, each captioned underneath. */
export const BLOCK = {
  lead: { w: 532, h: 332 },
  thumb: { w: 250, h: 148 },
  gap: 16,
  caption: 16, // baseline below a picture
  bottom: 32,
  captionCharWidth: 6.4, // 12 px Plex Sans, average advance
};

/** Where each of a project's pictures goes, in order: [lead, upper thumbnail, lower thumbnail] or [wide]. */
export function slotsFor(project) {
  const { lead, thumb, gap } = BLOCK;
  if (project.shots.length === 1) return [{ x: MARGIN, y: 0, w: README_W - 2 * MARGIN, h: project.shots[0].height }];
  if (project.shots.length !== 3) throw new Error(`${project.slug}: a project shows one picture or three, not ${project.shots.length}`);
  const x = MARGIN + lead.w + gap;
  return [
    { x: MARGIN, y: 0, ...lead },
    { x, y: 0, ...thumb },
    { x, y: lead.h - thumb.h, ...thumb },
  ];
}

/** One project's pictures. `images` maps a shot's file name to a data URI (omitted in tests: the frame stays empty). */
export function renderProject(project, { images = {}, fonts = "" } = {}) {
  const W = README_W;
  const slots = slotsFor(project);
  const H = Math.ceil((Math.max(...slots.map((s) => s.y + s.h)) + BLOCK.caption + BLOCK.bottom) / 8) * 8;
  const pictures = project.shots
    .map((shot, i) => {
      const { x, y, w, h } = slots[i];
      const clip = `clip-path="url(#s${i})"`;
      const inside = shot.diagram
        ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS.panel}" fill="${p.surface}"/><g ${clip}><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DIAGRAMS[shot.diagram](w, h)}</svg></g>`
        : fixed(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS.panel}" fill="${p.surface}"/>${images[shot.file] ? `<image href="${images[shot.file]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" ${clip}/>` : ""}`);
      return `<clipPath id="s${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS.panel}"/></clipPath>${inside}<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${RADIUS.panel - 0.5}" fill="none" stroke="${p.structure}"/><text x="${x}" y="${y + h + BLOCK.caption}" font-size="${TYPE.label}" fill="${p.text2}">${escapeXml(shot.caption)}</text>`;
    })
    .join("\n    ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">${escapeXml(project.title)}</title>
  <desc id="d">${escapeXml(`Pictures: ${project.shots.map((s) => s.caption).join("; ")}.`)}</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  <g font-family="${SANS}" font-weight="500">
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
      return `<g data-stack-row="${i}"><text x="0" y="${y}" font-size="${TYPE.label}" fill="${p.text3}">${escapeXml(label)}</text><text x="96" y="${y}" font-size="${TYPE.label}" fill="${p.text2}">${escapeXml(items)}</text></g>`;
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

/**
 * Point every generated image link in the README at `path?v=<version>`. GitHub lets browsers keep an
 * image for five minutes under its URL, so a redrawn image under the same name shows stale until then.
 */
export function versionImages(readme, versionOf) {
  return readme.replace(/(assets\/[\w./-]+\.svg)(\?v=\w+)?/g, (_, path) => `${path}?v=${versionOf(path)}`);
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
  const photo = `data:image/jpeg;base64,${readFileSync(join(root, "assets/shots", DIE.file)).toString("base64")}`;
  write("hero", renderHero(gpuData, { fonts, photo }));
  write("card-row", renderCardRow(renderCalendarCard(gpuData.calendar), renderStack(stack), { fonts }));
  for (const project of categories.flatMap((c) => c.projects)) {
    const images = Object.fromEntries(project.shots.filter((s) => s.file).map((s) => [s.file, `data:image/jpeg;base64,${readFileSync(join(root, "assets/shots", s.file)).toString("base64")}`]));
    write(`projects/${project.slug}`, renderProject(project, { images, fonts: textFonts }));
  }
  const readmePath = join(root, "README.md");
  const stamped = versionImages(readFileSync(readmePath, "utf8"), (path) => createHash("sha256").update(readFileSync(join(root, path))).digest("hex").slice(0, 8));
  writeFileSync(readmePath, stamped);
}
