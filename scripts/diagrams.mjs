// Diagrams drawn for project blocks that have no screenshot to show (Orion Mesh, nixos-config).
// Each takes its slot size and returns markup for a w x h box with the shared tokens; the block
// renderer clips it to the slot. Facts come from the projects' own READMEs.
import { COND, PALETTE as p, TYPE } from "./style.mjs";
import { escapeXml } from "./svg.mjs";

const text = (x, y, value, { size = TYPE.label, weight = 500, fill = p.text2, anchor = "start", caps = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}"${anchor === "start" ? "" : ` text-anchor="${anchor}"`}${caps ? ` font-family="${COND}" letter-spacing="0.3"` : ""}>${escapeXml(caps ? value.toUpperCase() : value)}</text>`;
const lines = (x, y, rows, options) => rows.map((row, i) => text(x, y + i * 16, row, options)).join("");
const box = (x, y, w, h, fill = p.well) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}"/>`;
const rule = (x, y, w, h = 1, fill = p.text3) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

/** Orion Mesh, lead slot: the two nodes, their network stack, the shared channel and the three boot steps. */
export function orionMesh(w, h) {
  const node = (x, name, board, app) => {
    const layers = [app, "CycloneDDS", "bat0, BATMAN-adv", "wlan0, ad-hoc Wi-Fi"];
    return (
      box(x, 16, 176, 176) +
      text(x + 12, 40, name, { size: TYPE.body, weight: 600, fill: p.text }) +
      text(x + 12, 58, board, { fill: p.text3, caps: true }) +
      layers.map((layer, i) => box(x + 8, 72 + i * 28, 160, 24, p.surface) + text(x + 16, 88 + i * 28, layer)).join("")
    );
  };
  const [x1, x2] = [192, w - 192];
  const mid = (x1 + x2) / 2;
  const steps = [
    ["Join", ["Both Pis join the same", "ad-hoc Wi-Fi cell when", "they boot."]],
    ["Mesh", ["BATMAN-adv puts wlan0", "behind bat0 and derives", "the address from the MAC."]],
    ["Measure", ["Chrony aligns the clocks,", "so each message's trip", "can be timed one way."]],
  ];
  return `${node(16, "Drone node", "Raspberry Pi 4", "ROS 2 publisher")}${node(w - 192, "Ground node", "Raspberry Pi 3", "ROS 2 subscriber")}
  ${text(mid, 76, "control, 50 Hz", { fill: p.text, anchor: "middle" })}${rule(x1, 83, x2 - x1, 2, p.accent)}<path d="M${x2} 84 l-8 -5 v10 z" fill="${p.accent}"/>
  ${text(mid, 112, "video, 0 to 15 Mbps", { anchor: "middle" })}${rule(x1, 119, x2 - x1)}<path d="M${x2} 119.5 l-8 -4 v8 z" fill="${p.text3}"/>
  ${text(mid, 160, "one shared channel", { fill: p.text3, anchor: "middle" })}${rule(x1, 164, x2 - x1, 8, p.structure)}
  ${rule(16, 208, w - 32, 1, p.structure)}
  ${steps.map(([title, body], i) => {
    const x = 16 + i * 172;
    return text(x, 236, String(i + 1), { size: TYPE.body, weight: 600, fill: p.accent }) + text(x + 16, 236, title, { size: TYPE.body, weight: 600, fill: p.text }) + lines(x, 260, body);
  }).join("")}`;
}

export const ORION_BITRATES = [0, 1, 2, 4, 6, 8, 10, 12, 15];

/** Orion Mesh, thumbnail: the encoder target of each trial condition; bar height is linear in Mbps. */
export function orionSweep(w, h) {
  const [bar, pitch, base, max] = [18, 26, 112, 64];
  const top = Math.max(...ORION_BITRATES);
  const bars = ORION_BITRATES.map((rate, i) => {
    const x = 12 + i * pitch;
    const height = Math.round((max * rate) / top);
    return `${box(x, base - max, bar, max, p.well)}${height ? `<rect data-rate="${rate}" x="${x}" y="${base - height}" width="${bar}" height="${height}" fill="${p.accent}"/>` : ""}${text(x + bar / 2, base + 18, String(rate), { anchor: "middle" })}`;
  }).join("");
  return `${text(12, 28, "Video load per trial", { weight: 600, fill: p.text })}${text(w - 12, 28, "Mbps", { fill: p.text3, anchor: "end" })}<g shape-rendering="crispEdges">${bars}</g>`;
}

/** Orion Mesh, thumbnail: what the ground node saves for every trial (orion_bench/control_sub.py). */
export function orionMetrics(w, h) {
  const names = ["Mean latency", "Median latency", "95th percentile", "99th percentile", "Maximum", "Std deviation", "Sequence gaps", "CPU use"];
  return `${text(12, 28, "Recorded per trial", { weight: 600, fill: p.text })}${rule(12, 40, w - 24, 1, p.structure)}${names.map((name, i) => text(i < 4 ? 12 : 136, 64 + (i % 4) * 22, name)).join("")}`;
}

/** nixos-config, full width: one flake, the modules both installs share, the two hosts, and the disk check. */
export function nixosFlake(w, h) {
  const [top, low, tall] = [44, 164, 96];
  const card = (x, y, width, title, body, { height = tall, edge = "" } = {}) =>
    `${box(x, y, width, height)}${edge ? `<rect x="${x + 1}" y="${y + 1}" width="${width - 2}" height="${height - 2}" rx="1" fill="none" stroke="${edge}" stroke-width="2"/>` : ""}${text(x + 12, y + 28, title, { size: TYPE.body, weight: 600, fill: p.text })}${lines(x + 12, y + 50, body)}`;
  const midY = (y) => y + tall / 2;
  const fork = (x, fromY, toX) => `${rule(x, fromY, (toX - x) / 2)}${rule(x + (toX - x) / 2, midY(top), 1, midY(low) - midY(top) + 1)}${rule(x + (toX - x) / 2, midY(top), (toX - x) / 2)}${rule(x + (toX - x) / 2, midY(low), (toX - x) / 2)}`;
  const join = (x, toX, toY) => `${rule(x, midY(top), (toX - x) / 2)}${rule(x, midY(low), (toX - x) / 2)}${rule(x + (toX - x) / 2, midY(top), 1, midY(low) - midY(top) + 1)}${rule(x + (toX - x) / 2, toY, (toX - x) / 2)}`;
  const centre = (top + low + tall) / 2;
  const heads = [[16, "Source"], [200, "Shared by both installs"], [424, "Host"], [640, "Before it activates"]];
  return `${heads.map(([x, label]) => text(x, 28, label, { fill: p.text3, caps: true })).join("")}
  ${card(16, centre - tall / 2, 144, "flake.nix", ["Inputs pinned in", "flake.lock"])}
  ${card(200, top, 184, "System modules", ["Boot, network, audio,", "desktop, users"])}${card(200, low, 184, "Home modules", ["Shell, Niri, Quickshell,", "terminal, editors"])}
  ${card(424, top, 176, "xelo-nixos-main", ["Internal drive,", "its own disk UUIDs"])}${card(424, low, 176, "xelo-nixos", ["External drive,", "its own disk UUIDs"])}
  ${card(640, centre - 68, w - 656, "Disk check", ["Mounted root and", "boot disks must", "match the host, or", "the switch stops."], { height: 136, edge: p.accent })}
  <g shape-rendering="crispEdges">${fork(160, centre, 200)}${rule(384, midY(top), 40)}${rule(384, midY(low), 40)}${rule(404, midY(top), 1, midY(low) - midY(top) + 1)}${join(600, 640, centre)}</g>`;
}

export const DIAGRAMS = { orionMesh, orionSweep, orionMetrics, nixosFlake };
