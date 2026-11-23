import { test } from "node:test";
import assert from "node:assert/strict";
import { BLOCK, renderLayerStrip, renderProject, renderStats, slotsFor, versionImages, wrap } from "./build-assets.mjs";
import { litSMs, renderHero, SM_THRESHOLDS } from "./gpu.mjs";
import { countByRepo, shareLanguages, totalKinds } from "./fetch-github.mjs";
import { layers } from "./projects.mjs";
import { calendarStats, renderCalendarCard } from "./card.mjs";
import { fixed, LIGHT, PALETTE, README_W, retheme } from "./style.mjs";

// GitHub's image proxy refuses an SVG that is not well-formed XML and shows its alt text instead,
// so every attribute in every start tag must be name="value". Returns the offending tags.
const malformedTags = (svg) =>
  [...svg.replace(/<!--[\s\S]*?-->/g, "").replace(/<style>[\s\S]*?<\/style>/g, "").matchAll(/<([a-zA-Z][\w:-]*)([^>]*)>/g)]
    .filter(([, , attrs]) => attrs.replace(/\s+[\w:-]+="[^"]*"/g, "").replace(/\s*\/$/, "").trim() !== "")
    .map(([tag]) => tag.slice(0, 120));

test("every generated image is well-formed: no attribute without a quoted value", async () => {
  const { renderCardRow, renderStack } = await import("./build-assets.mjs");
  const { stack } = await import("./projects.mjs");
  const images = {
    hero: renderHero(gpuData),
    cardRow: renderCardRow(renderCalendarCard(calendar), renderStack(stack)),
    ...Object.fromEntries(layers.flatMap((l) => l.projects).map((pr) => [pr.slug, renderProject(pr)])),
  };
  for (const [name, svg] of Object.entries(images)) assert.deepEqual(malformedTags(svg), [], name);
});

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

test("gold PCIe contacts lie on the edge connector's PCB tabs, not floating off the card", () => {
  const svg = renderCalendarCard(calendar);
  const polys = (attr) => [...svg.matchAll(new RegExp(`<polygon points="([^"]+)"[^>]*${attr}`, "g"))].map(([, pts]) => pts.split(" ").map((q) => q.split(",").map(Number)));
  const tabs = polys("data-edge");
  const contacts = polys("data-contact");
  assert.equal(tabs.length, 2, "short and long segment either side of the key notch");
  assert.ok(contacts.length >= 40, `x16 connector has a full row of contacts, got ${contacts.length}`);
  // Convex containment: the point is on the inner side of every edge of the tab's top face.
  const inside = (poly, [x, y]) => {
    const sides = poly.map(([ax, ay], i) => {
      const [bx, by] = poly[(i + 1) % poly.length];
      return (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    });
    return sides.every((c) => c >= -0.5) || sides.every((c) => c <= 0.5);
  };
  for (const contact of contacts) {
    assert.ok(tabs.some((tab) => contact.every((pt) => inside(tab, pt))), `contact off the PCB edge: ${contact.join(" ")}`);
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

test("every real project summary fits its lines and every caption fits beside its output label", () => {
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

test("a longer summary pushes the pictures down instead of running into them", () => {
  const shots = [{ file: "a.jpg", caption: "One" }, { file: "b.jpg", caption: "Two" }, { file: "c.jpg", caption: "Three" }];
  const sentence = "Each word here adds to a summary that has to wrap across the column. ";
  const two = slotsFor({ slug: "two", short: sentence.repeat(3).trim(), shots });
  const three = slotsFor({ slug: "three", short: sentence.repeat(4).trim(), shots });
  assert.equal(wrap(sentence.repeat(3).trim(), BLOCK.summaryChars).length, 2);
  assert.equal(wrap(sentence.repeat(4).trim(), BLOCK.summaryChars).length, 3);
  assert.equal(three[0].y - two[0].y, BLOCK.summaryLeading);
  assert.equal(two[0].y, BLOCK.top);
});

test("each layer strip lights only its own depth bar", () => {
  layers.forEach((layer, i) => {
    const svg = renderLayerStrip(layer, i, layers.length);
    assert.equal((svg.match(/data-depth="\d" data-active="true"/g) ?? []).length, 1);
    assert.ok(svg.includes(`data-depth="${i}" data-active="true"`));
    assert.equal((svg.match(/data-depth=/g) ?? []).length, layers.length);
  });
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

test("each language's PHY lights its 12 slices in proportion to its share, the largest all of them", () => {
  const svg = renderHero(gpuData);
  const lit = (m) => (svg.match(new RegExp(`data-mc="${m}" data-lit="1"`, "g")) ?? []).length;
  assert.equal((svg.match(/data-mc="0"/g) ?? []).length, 12);
  assert.equal(lit(0), 12, "Rust has the largest share");
  assert.equal(lit(1), 6, "C++ has half of it");
  assert.ok(svg.includes(">Rust</text>") && svg.includes(">C++</text>"), "each PHY is named on the die");
});

test("the die stays inside its 304 x 260 region left of the side panel", () => {
  const svg = renderHero(gpuData);
  const die = svg.match(/<g data-die="1" transform="translate\((\d+) (\d+)\)"/);
  assert.deepEqual([Number(die[1]), Number(die[2])], [24, 24]);
  const body = svg.slice(svg.indexOf("<g data-die"), svg.indexOf("<!--/fixed-->", svg.indexOf("<g data-die")));
  for (const [, x, y, w, h] of body.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
    assert.ok(+x >= 0 && +y >= 0 && +x + +w <= 304 && +y + +h <= 260, `rect ${x},${y} ${w}x${h}`);
  }
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

test("totalKinds adds each contribution kind over every repository", () => {
  const counts = new Map([
    ["a/x", { commits: 13, pullRequests: 2, issues: 1, reviews: 0 }],
    ["a/y", { commits: 1, pullRequests: 0, issues: 0, reviews: 4 }],
  ]);
  assert.deepEqual(totalKinds(counts), { commits: 14, pullRequests: 2, issues: 1, reviews: 4 });
});

const statsData = {
  languages: [{ name: "Rust & <C>", share: 0.5 }, { name: "Python", share: 0.25 }, { name: "Nix", share: 0.05 }],
  calendar: { total: 321 },
  totals: { commits: 1656, pullRequests: 145, stars: 8, hbmProjects: 6 },
};

test("language bars are as long as their share: half the share, half the bar", () => {
  const svg = renderStats(statsData);
  const width = (i) => Number(svg.match(new RegExp(`data-language="${i}" [^>]*width="(\\d+)"`))[1]);
  assert.equal(width(1) * 2, width(0));
  assert.equal(width(2) * 10, width(0));
  assert.ok(svg.includes("50%") && svg.includes("25%") && svg.includes("5%"));
  assert.ok(svg.includes("Rust &amp; &lt;C&gt;") && !svg.includes("<C>"));
});

test("every headline number is grouped by thousands and says what it counts and over what period", () => {
  const svg = renderStats(statsData);
  for (const [value, scope] of [["1,656", "Commits, all time"], ["145", "Pull requests, all time"], ["321", "Contributions, last 12 months"], ["8", "Stars on my repositories"]]) {
    assert.ok(svg.includes(`>${value}<`), value);
    assert.ok(svg.includes(`>${scope}<`), scope);
  }
  assert.ok(svg.includes("6 chip projects"), "the language scope matches the hero's memory controllers");
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
