import { test } from "node:test";
import assert from "node:assert/strict";
import { renderCard, renderLayer, wrap, CARD } from "./build-assets.mjs";
import { litSMs, renderHero, SM_THRESHOLDS } from "./gpu.mjs";
import { countByRepo, shareLanguages } from "./fetch-github.mjs";
import { layers } from "./projects.mjs";
import { calendarStats, renderCalendarCard } from "./card.mjs";
import { PALETTE } from "./style.mjs";

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

test("GPC slots without a repo are drawn fused off, as on a harvested die", () => {
  const svg = renderHero(gpuData);
  assert.equal((svg.match(/data-fused=/g) ?? []).length, 8 - gpuData.repos.length);
});

const sample = {
  slug: "x",
  title: "Ampersand & <tags>",
  repo: "owner/repo",
  url: "https://github.com/owner/repo",
  role: "OS core",
  language: "Rust",
  description: "Kernel keeps evidence read only & every call is signed <receipt>.",
  tags: ["namespaces", "s6-rc & dinit"],
};

test("markup characters in project data are escaped, not emitted raw", () => {
  const svg = renderCard(sample);
  assert.ok(!svg.includes("& "), "raw ampersand would make the SVG invalid");
  assert.ok(!svg.includes("<tags>") && !svg.includes("<receipt>"));
  assert.ok(svg.includes("Ampersand &amp; &lt;tags&gt;"));
});

test("wrap never exceeds the line budget and keeps every word", () => {
  const text = "Two Raspberry Pis on NixOS measuring ROS 2 control latency over a BATMAN-adv mesh";
  const lines = wrap(text, 30);
  for (const line of lines) assert.ok(line.length <= 30, line);
  assert.equal(lines.join(" "), text);
});

test("every real description fits inside the card body", () => {
  for (const layer of layers) {
    for (const project of layer.projects) {
      const lines = wrap(project.description, CARD.charsPerLine);
      assert.ok(lines.length <= CARD.maxLines, `${project.slug}: ${lines.length} lines`);
    }
  }
});

test("layer banner highlights exactly its own depth segment", () => {
  const svg = renderLayer(layers[1], 1, layers.length);
  assert.equal((svg.match(/data-active="true"/g) ?? []).length, 1);
  assert.ok(svg.includes('data-depth="1" data-active="true"'));
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
