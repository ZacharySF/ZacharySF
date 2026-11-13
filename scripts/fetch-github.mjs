// Snapshots the GitHub data that drives the GPU hero into assets/gpu-data.json.
// Usage: GITHUB_TOKEN=<personal token> node scripts/fetch-github.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { layers } from "./projects.mjs";

export const USER = "ZacharySF";
export const HBM_STACKS = 6;

// One GPC per entry, deepest first. Chosen for technical depth, not activity, so the die
// is mostly hardware and systems work; `extra` repos are mirrors or spin-offs counted with it.
// The die has 8 GPC slots; unused slots are drawn fused off, as on a harvested chip.
const GPCS = [
  { slug: "determine" },
  { slug: "orion-mesh" },
  { slug: "cleanroom" },
  { slug: "nixos-config" },
  { slug: "ichor", extra: ["nunera/Ichor"] },
  { slug: "ginseng", extra: ["ZacharySF/ginseng-tui"] },
  { slug: "rika", hbm: false }, // Python-heavy app; kept out of the memory controllers
];

const KINDS = {
  commitContributionsByRepository: "commits",
  pullRequestContributionsByRepository: "pullRequests",
  issueContributionsByRepository: "issues",
  pullRequestReviewContributionsByRepository: "reviews",
};

/** Sum each contribution kind per repository across several contributionsCollection windows. */
export function countByRepo(collections) {
  const counts = new Map();
  for (const collection of collections) {
    for (const [field, kind] of Object.entries(KINDS)) {
      for (const { repository, contributions } of collection[field] ?? []) {
        const entry = counts.get(repository.nameWithOwner) ?? { commits: 0, pullRequests: 0, issues: 0, reviews: 0 };
        entry[kind] += contributions.totalCount;
        counts.set(repository.nameWithOwner, entry);
      }
    }
  }
  return counts;
}

/** Merge per-repo language byte counts and return the top `n` as shares of all bytes. */
export function shareLanguages(perRepo, n) {
  const bytes = new Map();
  for (const languages of perRepo) {
    for (const [name, count] of Object.entries(languages)) bytes.set(name, (bytes.get(name) ?? 0) + count);
  }
  const total = [...bytes.values()].reduce((a, b) => a + b, 0);
  return [...bytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, share: Math.round((count / total) * 1000) / 1000 }));
}

const token = () => {
  if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is required");
  return process.env.GITHUB_TOKEN;
};

async function rest(path) {
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: { authorization: `Bearer ${token()}`, accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

async function graphql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${token()}` },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(`graphql: ${JSON.stringify(body.errors ?? res.status)}`);
  return body.data;
}

const byRepo = (field) => `${field}(maxRepositories: 100) { repository { nameWithOwner } contributions { totalCount } }`;
const COLLECTION = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) { contributionsCollection(from: $from, to: $to) { ${Object.keys(KINDS).map(byRepo).join(" ")} } }
}`;

/** contributionsCollection spans at most one year, so walk the account's lifetime in yearly windows. */
async function allContributions(createdAt) {
  const windows = [];
  const now = Date.now();
  for (let from = Date.parse(createdAt); from < now; from += 365 * 86400_000) {
    const to = Math.min(from + 365 * 86400_000 - 1000, now);
    const data = await graphql(COLLECTION, { login: USER, from: new Date(from).toISOString(), to: new Date(to).toISOString() });
    windows.push(data.user.contributionsCollection);
  }
  return countByRepo(windows);
}

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const CALENDAR = `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
  totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`;

/** The last year of daily contributions, as on the profile's contribution graph. */
async function contributionCalendar() {
  const { contributionCalendar: c } = (await graphql(CALENDAR, { login: USER })).user.contributionsCollection;
  return {
    total: c.totalContributions,
    weeks: c.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] }))),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const projects = new Map(
    layers.flatMap((layer, index) => layer.projects.map((p) => [p.slug, { ...p, layer: index + 1 }])),
  );
  const user = await rest(`users/${USER}`);
  const counts = await allContributions(user.created_at);

  const zero = { commits: 0, pullRequests: 0, issues: 0, reviews: 0 };
  const repos = GPCS.map(({ slug, extra = [] }) => {
    const project = projects.get(slug);
    if (!project) throw new Error(`unknown project slug ${slug}`);
    const names = [project.repo, ...extra];
    const breakdown = { ...zero };
    for (const name of names) for (const [k, v] of Object.entries(counts.get(name) ?? zero)) breakdown[k] += v;
    const contributions = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { title: project.title, layer: project.layer, repos: names, contributions, breakdown };
  });

  const ignored = new Set(["HTML", "CSS", "Dockerfile", "mdsvex", "Jupyter Notebook"]); // metrics' ignore list, plus notebooks
  const hbmRepos = GPCS.filter((g) => g.hbm !== false).flatMap((g) => [projects.get(g.slug).repo, ...(g.extra ?? [])]);
  const perRepo = await Promise.all(hbmRepos.map((name) => rest(`repos/${name}/languages`)));
  const languages = shareLanguages(
    perRepo.map((langs) => Object.fromEntries(Object.entries(langs).filter(([name]) => !ignored.has(name)))),
    HBM_STACKS,
  );

  const owned = (await rest(`users/${USER}/repos?type=owner&per_page=100`)).filter((r) => !r.fork);
  const data = {
    user: USER,
    generatedAt: new Date().toISOString().slice(0, 10),
    repos,
    calendar: await contributionCalendar(),
    languages,
    totals: {
      followers: user.followers,
      repos: user.public_repos,
      stars: owned.reduce((n, r) => n + r.stargazers_count, 0),
      contributions: repos.reduce((n, r) => n + r.contributions, 0),
    },
  };
  const out = join(dirname(fileURLToPath(import.meta.url)), "../assets/gpu-data.json");
  writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`wrote ${out}`);
  for (const r of repos) console.log(`  L${r.layer} ${r.title}: ${r.contributions} ${JSON.stringify(r.breakdown)}`);
}
