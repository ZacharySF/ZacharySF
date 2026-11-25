import { test } from "node:test";
import assert from "node:assert/strict";
import { BLOCK, renderProject, slotsFor, versionImages } from "./build-assets.mjs";
import { DIE, dimFor, litSMs, renderHero, SM_THRESHOLDS } from "./gpu.mjs";
import { countByRepo } from "./fetch-github.mjs";
import { categories, stack } from "./projects.mjs";
import { CALLOUTS, CARD, LABEL, renderCardRow, wrapItems } from "./card.mjs";
import { fixed, LIGHT, PALETTE, README_W, retheme } from "./style.mjs";

const allProjects = categories.flatMap((c) => c.projects);

// GitHub's image proxy refuses an SVG that is not well-formed XML and shows its alt text instead,
// so every attribute in every start tag must be name="value". Returns the offending tags.
const malformedTags = (svg) =>
  [...svg.replace(/<!--[\s\S]*?-->/g, "").replace(/<style>[\s\S]*?<\/style>/g, "").matchAll(/<([a-zA-Z][\w:-]*)([^>]*)>/g)]
    .filter(([, , attrs]) => attrs.replace(/\s+[\w:-]+="[^"]*"/g, "").replace(/\s*\/$/, "").trim() !== "")
    .map(([tag]) => tag.slice(0, 120));

test("every generated image is well-formed: no attribute without a quoted value", async () => {
  const images = {
    hero: renderHero(gpuData),
    cardRow: renderCardRow(stack),
    ...Object.fromEntries(allProjects.map((pr) => [pr.slug, renderProject(pr)])),
  };
  for (const [name, svg] of Object.entries(images)) assert.deepEqual(malformedTags(svg), [], name);
});

const sampleStack = [
  ["Systems", ["Linux", "R&D <kernel>"]],
  ["Apps", ["Svelte"]],
];

test("every tech stack row is one callout on the card: its name, its items, and a leader that ends on the photo", () => {
  const svg = renderCardRow(stack);
  assert.equal((svg.match(/data-callout=/g) ?? []).length, stack.length);
  for (const [label, items] of stack) {
    assert.ok(CALLOUTS[label], `${label} has no part on the card to point at`);
    assert.ok(svg.includes(`>${label}</text>`), label);
    for (const item of items) assert.ok(svg.includes(item), `${label}: ${item}`);
    const [, x, y] = svg.match(new RegExp(`<circle data-anchor="${label}" cx="([\\d.]+)" cy="([\\d.]+)"`)).map(Number);
    assert.ok(x > CARD.x && x < CARD.x + CARD.w && y > CARD.y && y < CARD.y + CARD.h, `${label} points off the card`);
  }
});

test("labels keep to their column beside the card: every line fits, none runs under the photo or off the image", () => {
  for (const [label, items] of stack) {
    for (const line of [label, ...wrapItems(items, LABEL.chars)]) assert.ok(line.length <= LABEL.chars, `${label}: "${line}"`);
  }
  const column = LABEL.chars * LABEL.charWidth;
  assert.ok(LABEL.left + column <= CARD.x - 8, "left labels end before the card");
  assert.ok(LABEL.right >= CARD.x + CARD.w + 8 && LABEL.right + column <= README_W - LABEL.left + 4, "right labels sit between the card and the margin");
});

test("wrapItems breaks a list between items, keeps their order and their commas", () => {
  assert.deepEqual(wrapItems(["C++", "C", "Rust", "Python", "TypeScript", "Swift"], 22), ["C++, C, Rust, Python,", "TypeScript, Swift"]);
  assert.deepEqual(wrapItems(["Linux"], 22), ["Linux"]);
});

test("markup characters in the tech stack are escaped", () => {
  const svg = renderCardRow(sampleStack);
  assert.ok(svg.includes("R&amp;D &lt;kernel&gt;") && !svg.includes("<kernel>"));
});

test("the card figure's text follows the page theme; the photo and its markers stay as they are", () => {
  const light = retheme(renderCardRow(stack));
  const page = light.replace(/<!--fixed-->[\s\S]*?<!--\/fixed-->/g, "");
  assert.notEqual(page, light, "the photo is marked as fixed");
  for (const role of ["text", "text2", "text3"]) assert.ok(!page.includes(PALETTE[role]), `${role} would be unreadable on white`);
});

test("each project marks one block on the die photo, numbered like its row; spare blocks stay unmarked", () => {
  const svg = renderHero(gpuData);
  assert.equal((svg.match(/data-block=/g) ?? []).length, gpuData.repos.length);
  for (let g = 0; g < gpuData.repos.length; g++) {
    assert.ok(svg.includes(`data-block-label="${g}">${g + 1}<`), `block ${g + 1}`);
    assert.ok(svg.includes(`data-row="${g}">${g + 1}<`), `row ${g + 1}`);
  }
  assert.ok(svg.includes(">Project<") && svg.includes(">Contributions<"), "list columns are headed");
});

test("a block is dimmed less the more I contributed: the top of the scale is clear, nothing is darkest", () => {
  assert.equal(dimFor(5000), 0);
  assert.equal(dimFor(SM_THRESHOLDS.at(-1)), 0);
  assert.ok(dimFor(0) > dimFor(1) && dimFor(1) > dimFor(6) && dimFor(6) > dimFor(100));
  const svg = renderHero(gpuData);
  const dim = (g) => Number(svg.match(new RegExp(`data-dim="${g}"[^>]*fill-opacity="([\\d.]+)"`))[1]);
  assert.equal(dim(0), dimFor(128));
  assert.equal(dim(1), dimFor(0));
});

test("every marked block lies on the die photo, which stays left of the side panel", () => {
  const svg = renderHero(gpuData);
  const photo = svg.match(/<rect data-photo="1" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/).slice(1).map(Number);
  const [px, py, pw, ph] = photo;
  assert.ok(px + pw <= DIE.panelX - 16, "a gutter between photo and name");
  for (const m of svg.matchAll(/<rect data-dim="\d" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
    const [x, y, w, h] = m.slice(1).map(Number);
    assert.ok(x >= px && y >= py && x + w <= px + pw && y + h <= py + ph, `block at ${x},${y} off the photo`);
  }
});

const sampleProject = {
  slug: "x",
  title: "Ampersand & co",
  shots: [{ file: "a.jpg", caption: "Sealed & <signed>" }, { file: "b.jpg", caption: "Two" }, { file: "c.jpg", caption: "Three" }],
};

test("markup characters in captions are escaped, not emitted raw", () => {
  const svg = renderProject(sampleProject);
  assert.ok(!svg.includes("& "), "raw ampersand would make the SVG invalid");
  assert.ok(!svg.includes("<signed>"));
  assert.ok(svg.includes("Sealed &amp; &lt;signed&gt;"));
});

test("a project image is only its pictures: they start at the top and no title is drawn over them", () => {
  for (const project of [sampleProject, ...allProjects]) {
    assert.equal(Math.min(...slotsFor(project).map((s) => s.y)), 0, project.slug);
    const visible = renderProject(project).replace(/<title[\s\S]*?<\/title>|<desc[\s\S]*?<\/desc>/g, "");
    assert.ok(!visible.includes(`>${project.title.replace("&", "&amp;")}<`), `${project.slug} title is in the README, not the image`);
  }
});

test("every caption fits under its picture", () => {
  for (const project of allProjects) {
    slotsFor(project).forEach((slot, i) => {
      const room = Math.floor(slot.w / BLOCK.captionCharWidth);
      assert.ok(project.shots[i].caption.length <= room, `${project.slug} caption ${i}: ${project.shots[i].caption.length} > ${room}`);
    });
  }
});

test("pictures line up with the hero's margins, and stacked thumbnails end level with the lead", () => {
  for (const project of allProjects) {
    const slots = slotsFor(project);
    assert.equal(Math.min(...slots.map((s) => s.x)), 24, project.slug);
    assert.equal(Math.max(...slots.map((s) => s.x + s.w)), README_W - 24, project.slug);
    if (slots.length === 3) {
      const [lead, upper, lower] = slots;
      assert.equal(upper.x - (lead.x + lead.w), 16, "gap between the lead and the thumbnails");
      assert.equal(lower.y + lower.h, lead.y + lead.h, `${project.slug}: columns end at different heights`);
      assert.ok(lower.y - (upper.y + upper.h) >= 32, "room for the upper thumbnail's caption");
    }
  }
});

// WCAG contrast ratio between two #rrggbb colours.
const contrast = (a, b) => {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [lo, hi] = [lum(a), lum(b)].sort((x, y) => x - y);
  return (hi + 0.05) / (lo + 0.05);
};

test("text stays readable on both GitHub page colours", () => {
  for (const [palette, page] of [[PALETTE, "#0d1117"], [LIGHT, "#ffffff"]]) {
    for (const role of ["text", "text2", "text3", "accent"]) {
      assert.ok(contrast(palette[role], page) >= 4.5, `${role} ${palette[role]} on ${page}: ${contrast(palette[role], page).toFixed(2)}`);
    }
  }
});

test("the light variant recolours page text and leaves drawn hardware as it is", () => {
  const dark = `<text fill="${PALETTE.text}">name</text>${fixed(`<rect fill="${PALETTE.text}"/><rect fill="${PALETTE.bg}"/>`)}<rect fill="${PALETTE.ramp[3]}"/>`;
  const light = retheme(dark);
  assert.ok(light.includes(`<text fill="${LIGHT.text}">name</text>`));
  assert.ok(light.includes(`<rect fill="${PALETTE.text}"/><rect fill="${PALETTE.bg}"/>`), "hardware keeps its own colours");
  assert.ok(light.includes(`<rect fill="${LIGHT.ramp[3]}"/>`));
});

test("no dark-page text colour is left on the light hero outside the photo", () => {
  const light = retheme(renderHero(gpuData));
  const page = light.replace(/<!--fixed-->[\s\S]*?<!--\/fixed-->/g, "");
  assert.notEqual(page, light, "the photo is marked as fixed");
  for (const role of ["text", "text2", "text3"]) assert.ok(!page.includes(PALETTE[role]), `${role} would be unreadable on white`);
  assert.ok(page.includes(`fill="${LIGHT.text}">Zachary Stubbs<`));
});

const gpuData = {
  user: "ZacharySF",
  generatedAt: "2026-11-12",
  repos: [
    { title: "one", repos: ["a/one"], contributions: 128, breakdown: { commits: 100, pullRequests: 28, issues: 0, reviews: 0 } },
    { title: "two & co", repos: ["a/two"], contributions: 0, breakdown: { commits: 0, pullRequests: 0, issues: 0, reviews: 0 } },
    { title: "three", repos: ["a/three"], contributions: 6, breakdown: { commits: 6, pullRequests: 0, issues: 0, reviews: 0 } },
  ],
};

test("every hero label is filled from the data and escaped", () => {
  const svg = renderHero(gpuData);
  assert.ok(!/undefined|NaN/.test(svg));
  assert.ok(svg.includes(">two &amp; co<"));
});

test("the hero's total is the sum of the project rows it lists", () => {
  const svg = renderHero(gpuData);
  assert.ok(svg.includes(">134 contributions to these 3 projects<"), "128 + 0 + 6");
});

test("SM thresholds climb from 1 to 128 contributions so small repos still show", () => {
  assert.equal(SM_THRESHOLDS[0], 1);
  assert.equal(SM_THRESHOLDS.at(-1), 128);
  for (let i = 1; i < SM_THRESHOLDS.length; i++) assert.ok(SM_THRESHOLDS[i] > SM_THRESHOLDS[i - 1]);
  assert.equal(litSMs(0), 0);
  assert.equal(litSMs(1), 1);
  assert.ok(litSMs(6) >= 5, "a 6-contribution repo lights several SMs");
  assert.equal(litSMs(5000), SM_THRESHOLDS.length);
});

test("countByRepo sums every contribution kind per repository", () => {
  const node = (name, n) => ({ repository: { nameWithOwner: name }, contributions: { totalCount: n } });
  const counts = countByRepo([
    { commitContributionsByRepository: [node("a/x", 3), node("a/y", 1)], pullRequestContributionsByRepository: [node("a/x", 2)], issueContributionsByRepository: [], pullRequestReviewContributionsByRepository: [node("a/y", 4)] },
    { commitContributionsByRepository: [node("a/x", 10)], pullRequestContributionsByRepository: [], issueContributionsByRepository: [node("a/x", 1)], pullRequestReviewContributionsByRepository: [] },
  ]);
  assert.deepEqual(counts.get("a/x"), { commits: 13, pullRequests: 2, issues: 1, reviews: 0 });
  assert.deepEqual(counts.get("a/y"), { commits: 1, pullRequests: 0, issues: 0, reviews: 4 });
});

test("README image links carry each file's version, so a redrawn image is not served from a stale cache", () => {
  const readme = '<source srcset="assets/hero-light.svg"><img src="assets/hero-dark.svg?v=0ld0ld00" width="846"> <img src="assets/projects/x-dark.svg">';
  const out = versionImages(readme, (path) => (path.includes("hero") ? "aaaa1111" : "bbbb2222"));
  assert.equal(out, '<source srcset="assets/hero-light.svg?v=aaaa1111"><img src="assets/hero-dark.svg?v=aaaa1111" width="846"> <img src="assets/projects/x-dark.svg?v=bbbb2222">');
  assert.equal(versionImages(out, () => "bbbb2222").match(/\?v=/g).length, 3, "restamping replaces the version, it does not stack");
});

test("the Orion PCB view is one fixed KiCad window that keeps its colours on the light page", async () => {
  const { orionTestbed } = await import("./diagrams.mjs");
  const svg = orionTestbed(798, 440);
  assert.ok(svg.startsWith("<!--fixed-->") && svg.endsWith("<!--/fixed-->"), "the whole window is drawn hardware");
  assert.equal(retheme(svg), svg);
  assert.ok(svg.includes(`<rect width="798" height="440" fill="${PALETTE.surface}"/>`), "window fills the slot");
  assert.ok(!/font-family="PlexSans"/.test(svg), "uses the SANS/COND stacks");
});

test("the Orion PCB view highlights bat0 as one ratsnest line between the two radios and stays inside its slot", async () => {
  const { orionTestbed } = await import("./diagrams.mjs");
  const svg = orionTestbed(798, 440);
  assert.equal([...svg.matchAll(/<line [^>]*data-net="bat0"/g)].length, 1, "one airwire for bat0");
  assert.deepEqual([...svg.matchAll(/data-radio="(\w+)"/g)].map((m) => m[1]), ["drone", "ground"], "both radios outlined");
  for (const [, x, y] of svg.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"/g)) {
    assert.ok(+x >= 0 && +x <= 798 && +y >= 0 && +y <= 440, `text at ${x},${y} is inside the slot`);
  }
  for (const label of ["F.Cu", "B.Cu", "F.Silkscreen", "F.Courtyard", "Edge.Cuts", "Ratsnest", "Raspberry Pi 4", "Raspberry Pi 3", "BATMAN-adv", "IBSS", "0 to 15 Mbps"]) assert.ok(svg.includes(label), label);
});
