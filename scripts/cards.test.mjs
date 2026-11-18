import { test } from "node:test";
import assert from "node:assert/strict";
import { BLOCK, renderLayerStrip, renderProject, slotsFor, wrap } from "./build-assets.mjs";
import { ORION_BITRATES, orionSweep } from "./diagrams.mjs";
import { litSMs, renderHero, SM_THRESHOLDS } from "./gpu.mjs";
import { countByRepo, shareLanguages } from "./fetch-github.mjs";
import { layers } from "./projects.mjs";
import { calendarStats, renderCalendarCard } from "./card.mjs";
import { fixed, LIGHT, PALETTE, README_W, retheme } from "./style.mjs";

const day = (date, count, level) => ({ date, count, level });
const calendar = {
  total: 9,
  weeks: [
    [day("2026-01-04", 0, 0), day("2026-01-05", 2, 1), day("2026-01-06", 3, 2), day("2026-01-07", 0, 0)],
    [day("2026-01-08", 1, 1), day("2026-01-09", 1, 1), day("2026-01-10", 2, 4)],
  ],
};

test("calendarStats finds the best streak, busiest day and daily average", () => {
  const stats = calendarStats(calendar.weeks.flat());
  assert.equal(stats.bestStreak, 3);
  assert.equal(stats.currentStreak, 3, "streak still running on the last day");
  assert.deepEqual(stats.maxDay, { date: "2026-01-06", count: 3 });
  assert.equal(stats.average, 1.29);
});

test("the card's LED matrix has one LED per day, lit with the die's blue ramp", () => {
  const svg = renderCalendarCard(calendar);
  assert.equal((svg.match(/data-day=/g) ?? []).length, 7);
  assert.ok(svg.includes(`data-day="2026-01-10" data-level="4" fill="${PALETTE.ramp[3]}"`));
  assert.ok(svg.includes(`data-day="2026-01-05" data-level="1" fill="${PALETTE.ramp[0]}"`));
  assert.ok(!/undefined|NaN/.test(svg));
});

test("white GPU contacts stay within the card's visible side face", () => {
  const svg = renderCalendarCard(calendar);
  const contacts = [...svg.matchAll(new RegExp(`<polygon points="([^"]+)" fill="${PALETTE.text}"/>`, "g"))];
  assert.equal(contacts.length, 22);
  for (const [, points] of contacts) {
    for (const point of points.split(" ")) {
      const [x, y] = point.split(",").map(Number);
      const bottom = 42 + ((x - 104) / 8.66 + 18) * 5;
      assert.ok(y < bottom && y > bottom - 12, `contact outside side face: ${point}`);
    }
  }
});

test("GPC slots without a repo are drawn fused off, as on a harvested die", () => {
  const svg = renderHero(gpuData);
  assert.equal((svg.match(/data-fused=/g) ?? []).length, 8 - gpuData.repos.length);
});

const sampleLayer = { slug: "os", title: "Kernels & <isolation>", level: "kernel<" };
const sampleProject = {
  slug: "x",
  title: "Ampersand & co",
  role: "OS core",
  short: "Kernel keeps evidence read only & signs every <receipt>.",
  shots: [{ file: "a.jpg", caption: "Sealed & <signed>" }, { file: "b.jpg", caption: "Two" }, { file: "c.jpg", caption: "Three" }],
};

test("markup characters in project data are escaped, not emitted raw", () => {
  const svg = renderProject(sampleProject) + renderLayerStrip(sampleLayer, 0, 1);
  assert.ok(!svg.includes("& "), "raw ampersand would make the SVG invalid");
  assert.ok(!svg.includes("<isolation>") && !svg.includes("<receipt>") && !svg.includes("<signed>") && !svg.includes("KERNEL<"));
  assert.ok(svg.includes("Ampersand &amp; co") && svg.includes("Sealed &amp; &lt;signed&gt;") && svg.includes("Kernels &amp; &lt;isolation&gt;"));
});

test("wrap never exceeds the line budget and keeps every word", () => {
  const text = "Two Raspberry Pis on NixOS measuring ROS 2 control latency over a BATMAN-adv mesh";
  const lines = wrap(text, 30);
  for (const line of lines) assert.ok(line.length <= 30, line);
  assert.equal(lines.join(" "), text);
});

test("every real project summary fits its two lines and every caption fits beside its output label", () => {
  for (const layer of layers) {
    for (const project of layer.projects) {
      const lines = wrap(project.short, BLOCK.summaryChars);
      assert.ok(lines.length <= BLOCK.summaryLines, `${project.slug} summary: ${lines.length} lines`);
      slotsFor(project).forEach((slot, i) => {
        const room = Math.floor((slot.w - BLOCK.outputLabel) / BLOCK.captionCharWidth);
        assert.ok(project.shots[i].caption.length <= room, `${project.slug} caption ${i}: ${project.shots[i].caption.length} > ${room}`);
      });
    }
  }
});

test("a project on the die carries its GPC number from the hero map; one off the die carries none", () => {
  assert.ok(renderProject(sampleProject, { gpc: 3 }).includes(">GPC3<"));
  assert.ok(!renderProject(sampleProject).includes("GPC"));
});

test("pictures are numbered as outputs in the order they are listed", () => {
  const svg = renderProject(sampleProject);
  assert.deepEqual([...svg.matchAll(/>OUT (\d)</g)].map((m) => m[1]), ["0", "1", "2"]);
});

test("pictures line up with the hero's margins, and stacked thumbnails end level with the lead", () => {
  for (const layer of layers) {
    for (const project of layer.projects) {
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
  }
});

test("each layer strip lights only its own depth bar", () => {
  layers.forEach((layer, i) => {
    const svg = renderLayerStrip(layer, i, layers.length);
    assert.equal((svg.match(/data-depth="\d" data-active="true"/g) ?? []).length, 1);
    assert.ok(svg.includes(`data-depth="${i}" data-active="true"`));
    assert.equal((svg.match(/data-depth=/g) ?? []).length, layers.length);
  });
});

test("Orion bitrate bars are linear: twice the bitrate is twice the height", () => {
  const svg = orionSweep(250, 148);
  const height = (rate) => Number(svg.match(new RegExp(`data-rate="${rate}" [^>]*height="(\\d+)"`))?.[1] ?? 0);
  assert.equal(height(0), 0, "the no-video baseline draws no bar");
  const top = Math.max(...ORION_BITRATES);
  for (const rate of ORION_BITRATES) assert.ok(Math.abs(height(rate) / height(top) - rate / top) <= 0.01, `${rate} Mbps: ${height(rate)} px`);
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

test("no dark-page text colour is left on the light hero outside the die", () => {
  const light = retheme(renderHero(gpuData));
  const page = light.replace(/<!--fixed-->[\s\S]*?<!--\/fixed-->/g, "");
  assert.notEqual(page, light, "the die is marked as fixed hardware");
  for (const role of ["text", "text2", "text3"]) assert.ok(!page.includes(PALETTE[role]), `${role} would be unreadable on white`);
  assert.ok(page.includes(`fill="${LIGHT.text}">Zachary Stubbs<`));
});

const gpuData = {
  user: "ZacharySF",
  generatedAt: "2026-11-12",
  repos: [
    { title: "one", layer: 2, repos: ["a/one"], contributions: 128, breakdown: { commits: 100, pullRequests: 28, issues: 0, reviews: 0 } },
    { title: "two & co", layer: 1, repos: ["a/two"], contributions: 0, breakdown: { commits: 0, pullRequests: 0, issues: 0, reviews: 0 } },
    { title: "three", layer: 1, repos: ["a/three"], contributions: 6, breakdown: { commits: 6, pullRequests: 0, issues: 0, reviews: 0 } },
  ],
  languages: [
    { name: "Rust", share: 0.5 },
    { name: "C++", share: 0.25 },
  ],
  totals: { followers: 20, stars: 8, repos: 19, contributions: 134 },
};

const litIn = (svg, gpc) => (svg.match(new RegExp(`data-sm="${gpc}-\\d+" data-lit="true"`, "g")) ?? []).length;

test("each GPC is one repo with a full set of SMs, lit in proportion to its contributions", () => {
  const svg = renderHero(gpuData);
  assert.equal((svg.match(/data-gpc=/g) ?? []).length, 3);
  assert.equal((svg.match(/data-sm="0-\d+"/g) ?? []).length, SM_THRESHOLDS.length);
  assert.equal(litIn(svg, 0), SM_THRESHOLDS.length, "top of the scale fills the GPC");
  assert.equal(litIn(svg, 1), 0, "no contributions stays dark");
  assert.equal(litIn(svg, 2), litSMs(6));
  assert.ok(svg.includes("two &amp; co"));
});

test("every hero label is filled from the data (no undefined or NaN)", () => {
  const svg = renderHero(gpuData);
  assert.ok(!/undefined|NaN/.test(svg));
  assert.ok(svg.includes("134 contributions across 3 projects"), "every total carries its scope");
});

test("each memory controller is one language labelled with its share", () => {
  const svg = renderHero(gpuData);
  assert.equal((svg.match(/data-mem=/g) ?? []).length, 2);
  assert.ok(svg.includes("Rust 50%") && svg.includes("C++ 25%"));
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

test("shareLanguages merges bytes across repos and keeps the top n", () => {
  const shares = shareLanguages([{ Rust: 60, C: 10 }, { Rust: 20, Python: 10 }], 2);
  assert.deepEqual(shares, [
    { name: "Rust", share: 0.8 },
    { name: "C", share: 0.1 },
  ]);
});

test("every tech stack row fits beside its label", async () => {
  const { stack } = await import("./projects.mjs");
  const { STACK, renderStack } = await import("./build-assets.mjs");
  for (const [, items] of stack) assert.ok(items.length <= STACK.charsPerLine, items);
  const svg = renderStack(stack);
  assert.equal((svg.match(/data-stack-row=/g) ?? []).length, stack.length);
});

test("each GPC on the die is labelled so the map rows can be found on it", () => {
  const svg = renderHero(gpuData);
  for (let g = 0; g < 8; g++) assert.ok(svg.includes(`data-gpc-label="${g}"`), `GPC${g}`);
  assert.ok(svg.includes(">PROJECT<") && svg.includes(">CONTRIBUTIONS<"), "map columns are headed");
});
