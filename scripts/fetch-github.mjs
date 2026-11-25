// Snapshots the GitHub data that drives the hero and the graphics card into assets/gpu-data.json.
// Usage: GITHUB_TOKEN=<personal token> node scripts/fetch-github.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { categories } from "./projects.mjs";

export const USER = "ZacharySF";

// One entry per marked block on the die photo, in the README's order, so block N is the Nth project.
// `extra` repos are mirrors or spin-offs counted with it. The photo has 8 blocks; spare ones stay unmarked.
const PROJECTS = [
  { slug: "cleanroom" },
  { slug: "misaos" },
  { slug: "nixos-config" },
  { slug: "determine" },
  { slug: "orion-mesh" },
  { slug: "ginseng", extra: ["ZacharySF/ginseng-tui"] },
  { slug: "ichor", extra: ["nunera/Ichor"] },
  { slug: "rika" },
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
  const projects = new Map(categories.flatMap((c) => c.projects).map((p) => [p.slug, p]));
  const user = await rest(`users/${USER}`);
  const counts = await allContributions(user.created_at);

  const zero = { commits: 0, pullRequests: 0, issues: 0, reviews: 0 };
  const repos = PROJECTS.map(({ slug, extra = [] }) => {
    const project = projects.get(slug);
    if (!project) throw new Error(`unknown project slug ${slug}`);
    const names = [project.repo, ...extra];
    const breakdown = { ...zero };
    for (const name of names) for (const [k, v] of Object.entries(counts.get(name) ?? zero)) breakdown[k] += v;
    const contributions = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { title: project.title, repos: names, contributions, breakdown };
  });

  const data = {
    user: USER,
    generatedAt: new Date().toISOString().slice(0, 10),
    repos,
    calendar: await contributionCalendar(),
  };
  const out = join(dirname(fileURLToPath(import.meta.url)), "../assets/gpu-data.json");
  writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`wrote ${out}`);
  for (const r of repos) console.log(`  ${r.title}: ${r.contributions} ${JSON.stringify(r.breakdown)}`);
}
