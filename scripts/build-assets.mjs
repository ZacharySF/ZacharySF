// Renders every generated image on the profile with the shared tokens in style.mjs:
// the GPU floorplan hero, one block of pictures per project and the graphics-card contribution calendar.
// Each image is written twice, for GitHub's dark and light pages (see retheme in style.mjs).
// Usage: node scripts/build-assets.mjs   (reads assets/gpu-data.json and assets/shots, writes assets/**/*.svg)
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderCalendarCard } from "./card.mjs";
import { DIAGRAMS } from "./diagrams.mjs";
import { renderHero } from "./gpu.mjs";
import { layers, stack } from "./projects.mjs";
import { COND, fixed, fontCss, MARGIN, PALETTE as p, RADIUS, README_W, retheme, SANS, TYPE } from "./style.mjs";
import { escapeXml } from "./svg.mjs";

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

/** A project block: name, GPC number and role, a summary of two or three lines, then a lead picture with two thumbnails, or one wide picture. */
export const BLOCK = {
  top: 92, // first picture row below a two-line summary
  lead: { w: 532, h: 332 },
  thumb: { w: 250, h: 148 },
  gap: 16,
  caption: 16, // baseline below a picture
  bottom: 32,
  summaryChars: 112, // one 14 px line across the column
  summaryLines: 3,
  summaryLeading: 20,
  outputLabel: 40, // "OUT 0" and the space after it
  captionCharWidth: 6.4, // 12 px Plex Sans, average advance
};

/** A layer heading above its projects: the depth gauge (hardware at the bottom), the layer number and its name. */
export function renderLayerStrip(layer, index, count, { fonts = "" } = {}) {
  const W = README_W;
  const gauge = Array.from({ length: count }, (_, depth) => `<rect data-depth="${depth}" data-active="${depth === index}" x="${MARGIN}" y="${18 + (count - 1 - depth) * 5}" width="${32 - depth * 6}" height="3" fill="${depth === index ? p.accent : p.structure}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="56" viewBox="0 0 ${W} 56" role="img" aria-labelledby="t">
  <title id="t">${escapeXml(`Layer ${index + 1} of ${count}, ${layer.level}: ${layer.title}`)}</title>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  <g font-family="${SANS}" font-weight="500">
    <g shape-rendering="crispEdges"><rect x="${MARGIN}" y="0" width="${W - 2 * MARGIN}" height="1" fill="${p.structure}"/>${gauge}</g>
    <text x="64" y="32" font-family="${COND}" font-size="${TYPE.label}" letter-spacing="1" fill="${p.text3}">LAYER ${index + 1} · ${escapeXml(layer.level.toUpperCase())}</text>
    <text x="${W - MARGIN}" y="32" text-anchor="end" font-weight="600" font-size="${TYPE.body}" fill="${p.text2}">${escapeXml(layer.title)}</text>
  </g>
</svg>
`;
}

/** Where each of a project's pictures goes, in order: [lead, upper thumbnail, lower thumbnail] or [wide]. */
export function slotsFor(project) {
  const { lead, thumb, gap } = BLOCK;
  const top = BLOCK.top + Math.max(0, wrap(project.short ?? "", BLOCK.summaryChars).length - 2) * BLOCK.summaryLeading;
  if (project.shots.length === 1) return [{ x: MARGIN, y: top, w: README_W - 2 * MARGIN, h: project.shots[0].height }];
  if (project.shots.length !== 3) throw new Error(`${project.slug}: a project shows one picture or three, not ${project.shots.length}`);
  const x = MARGIN + lead.w + gap;
  return [
    { x: MARGIN, y: top, ...lead },
    { x, y: top, ...thumb },
    { x, y: top + lead.h - thumb.h, ...thumb },
  ];
}

/**
 * One project. `gpc` is its cluster number on the hero die (omitted for a project that is not on the die);
 * `images` maps a shot's file name to a data URI (omitted in tests: the frame stays empty).
 * Pictures are numbered like the outputs of the graphics card further up the page.
 */
export function renderProject(project, { gpc, images = {}, fonts = "" } = {}) {
  const W = README_W;
  const slots = slotsFor(project);
  const H = Math.ceil((Math.max(...slots.map((s) => s.y + s.h)) + BLOCK.caption + BLOCK.bottom) / 8) * 8;
  const right = W - MARGIN;
  const designator = `font-family="${COND}" font-size="${TYPE.label}" letter-spacing="0.3" fill="${p.text3}"`;
  const badge = gpc === undefined ? "" : `<tspan ${designator}>GPC${gpc}</tspan>`;
  const summary = wrap(project.short, BLOCK.summaryChars)
    .map((line, i) => `<tspan x="${MARGIN}" dy="${i ? BLOCK.summaryLeading : 0}">${escapeXml(line)}</tspan>`)
    .join("");
  const pictures = project.shots
    .map((shot, i) => {
      const { x, y, w, h } = slots[i];
      const clip = `clip-path="url(#s${i})"`;
      const inside = shot.diagram
        ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS.panel}" fill="${p.surface}"/><g ${clip}><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DIAGRAMS[shot.diagram](w, h)}</svg></g>`
        : fixed(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS.panel}" fill="${p.surface}"/>${images[shot.file] ? `<image href="${images[shot.file]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" ${clip}/>` : ""}`);
      return `<clipPath id="s${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${RADIUS.panel}"/></clipPath>${inside}<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${RADIUS.panel - 0.5}" fill="none" stroke="${p.structure}"/><text x="${x}" y="${y + h + BLOCK.caption}" font-size="${TYPE.label}"><tspan ${designator}>OUT ${i}</tspan><tspan x="${x + BLOCK.outputLabel}" fill="${p.text2}">${escapeXml(shot.caption)}</tspan></text>`;
    })
    .join("\n    ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">${escapeXml(project.title)}</title>
  <desc id="d">${escapeXml(`${project.short} Pictures: ${project.shots.map((s) => s.caption).join("; ")}.`)}</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  <g font-family="${SANS}" font-weight="500">
    <text x="${MARGIN}" y="28" font-weight="600" font-size="${TYPE.title}" fill="${p.text}">${escapeXml(project.title)}</text>
    <text x="${right}" y="28" text-anchor="end" font-size="${TYPE.body}">${badge}<tspan${badge ? ' dx="12"' : ""} fill="${p.accent}">${escapeXml(project.role)}</tspan></text>
    <text y="52" font-size="${TYPE.body}" fill="${p.text2}">${summary}</text>
    ${pictures}
  </g>
</svg>
`;
}

/**
 * Languages and headline numbers in one row. The language shares are the hero's memory controllers
 * (same data, so the two never disagree); bar length is linear in share. Every number names its scope.
 */
export function renderStats(data, { fonts = "" } = {}) {
  const W = README_W;
  const bar = { x: 128, max: 240 };
  const top = Math.max(...data.languages.map((l) => l.share));
  const rows = data.languages
    .map((lang, i) => {
      const y = 60 + i * 20;
      return `<text x="${MARGIN}" y="${y}" font-size="${TYPE.label}" fill="${p.text2}">${escapeXml(lang.name)}</text><rect data-language="${i}" x="${bar.x}" y="${y - 9}" width="${Math.round((bar.max * lang.share) / top)}" height="8" fill="${p.accent}"/><text x="${bar.x + bar.max + 48}" y="${y}" text-anchor="end" font-size="${TYPE.label}" fill="${p.text2}" style="font-variant-numeric:tabular-nums">${Math.round(lang.share * 100)}%</text>`;
    })
    .join("");
  const figures = [
    [data.totals.commits, "Commits, all time"],
    [data.totals.pullRequests, "Pull requests, all time"],
    [data.calendar.total, "Contributions, last 12 months"],
    [data.totals.stars, "Stars on my repositories"],
  ]
    .map(([value, scope], i) => {
      const [x, y] = [456 + (i % 2) * 192, 72 + Math.floor(i / 2) * 76];
      return `<text x="${x}" y="${y}" font-weight="600" font-size="${TYPE.display}" fill="${p.text}" style="font-variant-numeric:tabular-nums">${value.toLocaleString("en-US")}</text><text x="${x}" y="${y + 20}" font-size="${TYPE.label}" fill="${p.text3}">${scope}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="184" viewBox="0 0 ${W} 184" role="img" aria-labelledby="t d">
  <title id="t">Languages and activity</title>
  <desc id="d">${escapeXml(`${data.languages.map((l) => `${l.name} ${Math.round(l.share * 100)}%`).join(", ")}. ${data.totals.commits} commits and ${data.totals.pullRequests} pull requests all time, ${data.calendar.total} contributions in the last 12 months, ${data.totals.stars} stars.`)}</desc>
  ${fonts ? `<defs><style>${fonts}</style></defs>` : ""}
  <g font-family="${SANS}" font-weight="500">
    <text x="${MARGIN}" y="28" font-weight="600" font-size="${TYPE.body}" fill="${p.text}">Languages</text>
    <text x="${bar.x + bar.max + 48}" y="28" text-anchor="end" font-size="${TYPE.label}" fill="${p.text3}">share of code in ${data.totals.hbmProjects} chip projects</text>
    <g shape-rendering="crispEdges">${rows}</g>
    ${figures}
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
  write("hero", renderHero(gpuData, { fonts }));
  write("card-row", renderCardRow(renderCalendarCard(gpuData.calendar), renderStack(stack), { fonts }));
  write("stats", renderStats(gpuData, { fonts: textFonts }));
  const onDie = new Map(gpuData.repos.map((repo, g) => [repo.title, g]));
  layers.forEach((layer, i) => {
    write(`layers/${layer.slug}`, renderLayerStrip(layer, i, layers.length, { fonts: textFonts }));
    for (const project of layer.projects) {
      const images = Object.fromEntries(project.shots.filter((s) => s.file).map((s) => [s.file, `data:image/jpeg;base64,${readFileSync(join(root, "assets/shots", s.file)).toString("base64")}`]));
      write(`projects/${project.slug}`, renderProject(project, { gpc: onDie.get(project.title), images, fonts: textFonts }));
    }
  });
  const readmePath = join(root, "README.md");
  const stamped = versionImages(readFileSync(readmePath, "utf8"), (path) => createHash("sha256").update(readFileSync(join(root, path))).digest("hex").slice(0, 8));
  writeFileSync(readmePath, stamped);
}
