// Figures drawn for project blocks that have no screenshot to show (Orion Mesh, nixos-config).
// Each takes its slot size and returns markup for a w x h box with the shared tokens; the block
// renderer clips it to the slot. They follow the hero's language: top-down hardware on a pixel grid,
// kept dark on any page (fixed), with labels and traces around it. Facts come from the projects' READMEs.
import { COND, fixed, PALETTE as p, TYPE } from "./style.mjs";
import { escapeXml } from "./svg.mjs";

const text = (x, y, value, { size = TYPE.label, weight = 500, fill = p.text2, anchor = "start", caps = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}"${anchor === "start" ? "" : ` text-anchor="${anchor}"`}${caps ? ` font-family="${COND}" letter-spacing="0.3"` : ""}>${escapeXml(caps ? value.toUpperCase() : value)}</text>`;
const lines = (x, y, rows, options) => rows.map((row, i) => text(x, y + i * 16, row, options)).join("");
const rect = (x, y, w, h, fill, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ""} fill="${fill}"/>`;

// Isometric drawing, the same projection as the graphics card further up the page: i runs right and
// down, j left and down, h up. Coordinates are millimetres; `scale` is px per mm.
const isoAt = (ox, oy, scale) => (i, j, h = 0) => [Math.round((ox + (i - j) * scale * 0.866) * 10) / 10, Math.round((oy + (i + j) * scale * 0.5 - h * scale) * 10) / 10];
const poly = (points, fill) => `<polygon points="${points.map(([x, y]) => `${x},${y}`).join(" ")}" fill="${fill}"/>`;
// Orion Mesh keeps its own colours so it reads apart from the blue-on-navy figures: the green
// boards, black header and bright sockets of a real Raspberry Pi, with the link in raspberry red.
// The whole figure is a fixed dark panel, like a screenshot, on either page theme.
const ORION = {
  panel: "#0e1512",
  text: "#eef3ee",
  text2: "#bcc8bf",
  text3: "#84968a", // 5.6:1 on the panel
  link: "#f0527f",
  hole: "#c9a24a",
};
const MATERIAL = {
  pcb: ["#2f8156", "#1e5a3c", "#143f2a"],
  metal: ["#d9dde2", "#9ba3ad", "#5a626d"],
  plastic: ["#262a2f", "#16191c", "#0d0f11"],
};
// A box standing on height h0: its top, the face towards the viewer's left (j side) and right (i side).
function isoBox(at, [i0, j0, h0], [di, dj, dh], material) {
  const [i1, j1, h1] = [i0 + di, j0 + dj, h0 + dh];
  const [top, left, right] = MATERIAL[material];
  return poly([at(i0, j1, h1), at(i1, j1, h1), at(i1, j1, h0), at(i0, j1, h0)], left) + poly([at(i1, j0, h1), at(i1, j1, h1), at(i1, j1, h0), at(i1, j0, h0)], right) + poly([at(i0, j0, h1), at(i1, j0, h1), at(i1, j1, h1), at(i0, j1, h1)], top);
}

// Raspberry Pi parts in mm on the 85 x 56 board, header along the far edge, network and USB at the right end.
const PCB = 1.6;
const PI_PARTS = {
  4: [
    [[7, 1], [51, 5, 8.5], "plastic"], // 40-pin header
    [[7, 10], [12, 10, 2], "metal"], // wireless module
    [[22, 25], [15, 15, 2.4], "metal"], // SoC lid
    [[42, 26], [12, 14, 1], "plastic"], // memory
    [[66, 2.5], [21, 16, 13.5], "metal"], // Ethernet
    [[69, 22.5], [18, 13, 16], "metal"], // USB 3
    [[69, 40], [18, 13, 16], "metal"], // USB 2
    [[7, 49], [9, 8.5, 3.2], "metal"], // USB-C power
    [[22, 50], [7, 7.5, 3], "metal"], // micro HDMI
    [[35.5, 50], [7, 7.5, 3], "metal"], // micro HDMI
    [[50, 44], [7, 14, 6], "plastic"], // audio jack
  ],
  3: [
    [[7, 1], [51, 5, 8.5], "plastic"],
    [[3, 9], [2, 5, 1.2], "metal"], // chip antenna
    [[21, 24], [14, 14, 1.4], "plastic"], // SoC
    [[52, 34], [9, 9, 1], "plastic"], // USB and Ethernet controller
    [[69, 2], [18, 13, 16], "metal"], // USB
    [[69, 20], [18, 13, 16], "metal"], // USB
    [[66, 37.5], [21, 16, 13.5], "metal"], // Ethernet
    [[6.5, 50], [8, 7.5, 3], "metal"], // micro USB power
    [[24.5, 45], [15, 12.5, 6.5], "metal"], // HDMI
    [[50, 44], [7, 14, 6], "plastic"],
  ],
};
const PI_RADIO = { 4: [13, 15, PCB + 2], 3: [4, 11.5, PCB + 1.2] };

function isoPi(at, model) {
  const parts = [...PI_PARTS[model]].sort((a, b) => a[0][0] + a[0][1] - (b[0][0] + b[0][1])); // far parts first
  const holes = [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]].map(([i, j]) => { const [x, y] = at(i, j, PCB); return `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="2" fill="${ORION.hole}"/>`; }).join("");
  return isoBox(at, [0, 0, 0], [85, 56, PCB], "pcb") + holes + parts.map(([[i, j], size, material]) => isoBox(at, [i, j, PCB], size, material)).join("");
}

/**
 * Orion Mesh, full width: the two boards in the page's isometric projection, the radio link arcing
 * between their wireless parts with what it carries, and each node's job.
 */
export function orionBoards(w, h) {
  const scale = 1.9;
  const drone = isoAt(116, 100, scale);
  const ground = isoAt(w - 168, 100, scale);
  const [ax, ay] = drone(...PI_RADIO[4]);
  const [bx, by] = ground(...PI_RADIO[3]);
  const mid = (ax + bx) / 2;
  const jobs = (x, name, model, rows) => text(x, 276, name, { size: TYPE.body, weight: 600, fill: ORION.text }) + text(x, 294, `Raspberry Pi ${model}`, { fill: ORION.text3, caps: true }) + lines(x, 316, rows, { fill: ORION.text2 });
  return fixed(`${rect(0, 0, w, h, ORION.panel)}${isoPi(drone, 4)}${isoPi(ground, 3)}
  <path d="M${ax} ${ay} Q${mid} ${Math.min(ay, by) - 132} ${bx} ${by}" fill="none" stroke="${ORION.link}" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="${ax}" cy="${ay}" r="4" fill="${ORION.link}"/><circle cx="${bx}" cy="${by}" r="4" fill="${ORION.link}"/>
  ${text(mid, 36, "Ad-hoc Wi-Fi cell, bridged by BATMAN-adv", { fill: ORION.text, anchor: "middle" })}
  ${text(mid, 124, "Control messages at 50 Hz", { fill: ORION.text2, anchor: "middle" })}${text(mid, 142, "H.264 video at 0 to 15 Mbps", { fill: ORION.text2, anchor: "middle" })}${text(mid, 168, "one shared channel", { fill: ORION.text3, caps: true, anchor: "middle" })}
  ${jobs(24, "Drone node", 4, ["Publishes control and streams video", "Serves the reference clock"])}
  ${jobs(w - 24 - 208, "Ground node", 3, ["Times every control message", "Counts sequence gaps, logs CPU use"])}`);
}

const NIXOS_SYSTEM = ["nix", "boot", "locale", "networking", "audio", "desktop", "users", "packages"];
const NIXOS_HOME = ["shell", "git", "niri", "quickshell", "wezterm", "editors", "dev", "spicetify"];
const NIXOS_INPUTS = 6; // nixpkgs, home-manager, spicetify-nix, hermes-agent, oh-my-pi, skwd-wall

/**
 * nixos-config, full width: the flake as a floorplan of its modules with one output pad per host,
 * each routed through a UUID check to its own drive. The dashed crossed traces are the switch the check refuses.
 */
export function nixosFlake(w, h) {
  const die = { x: 16, y: 44, w: 352, h: 236 };
  const tile = { w: 79, h: 24 };
  const tiles = (names, y) => names.map((name, i) => rect(die.x + 12 + (i % 4) * (tile.w + 4), y + Math.floor(i / 4) * (tile.h + 4), tile.w, tile.h, p.well) + text(die.x + 20 + (i % 4) * (tile.w + 4), y + 16 + Math.floor(i / 4) * (tile.h + 4), name)).join("");
  const pads = Array.from({ length: NIXOS_INPUTS }, (_, i) => rect(die.x + 12 + i * 56, die.y + die.h - 22, 48, 10, p.silver)).join("");
  const [outA, outB] = [104, 216];
  const [check, drive] = [512, 600];
  const trace = (y) => `${rect(die.x + die.w + 4, y, check - die.x - die.w - 4, 1, p.text3)}${rect(check + 16, y, drive - check - 16, 1, p.text3)}<rect x="${check + 1}" y="${y - 7}" width="14" height="14" fill="${p.surface}" stroke="${p.accent}" stroke-width="2"/>${text(check + 8, y + 5, "=", { size: TYPE.body, fill: p.accent, anchor: "middle" })}`;
  const flake = `<rect x="${die.x - 2}" y="${die.y - 2}" width="${die.w + 4}" height="${die.h + 4}" fill="${p.silver}"/>${rect(die.x, die.y, die.w, die.h, p.bg)}
    ${text(die.x + 12, die.y + 22, "System modules", { fill: p.text3, caps: true })}<g shape-rendering="crispEdges">${tiles(NIXOS_SYSTEM, die.y + 30)}</g>
    ${text(die.x + 12, die.y + 110, "Home modules, built in the same step", { fill: p.text3, caps: true })}<g shape-rendering="crispEdges">${tiles(NIXOS_HOME, die.y + 118)}</g>
    ${text(die.x + 12, die.y + 198, `${NIXOS_INPUTS} inputs pinned in flake.lock`, { fill: p.text3, caps: true })}<g shape-rendering="crispEdges">${pads}${rect(die.x + die.w - 4, outA - 8, 8, 16, p.silver)}${rect(die.x + die.w - 4, outB - 8, 8, 16, p.silver)}</g>`;
  // M.2 2280 stick: edge connector with its key notch, controller, two flash packages, mounting cut-out.
  const nvme = `${rect(drive, outA - 20, 176, 40, p.structure)}<g shape-rendering="crispEdges">${Array.from({ length: 9 }, (_, i) => rect(drive, outA - 18 + i * 4 + (i > 5 ? 4 : 0), 8, 2, p.silverLight)).join("")}${rect(drive + 28, outA - 12, 24, 24, p.bg)}${rect(drive + 64, outA - 14, 40, 28, p.bg)}${rect(drive + 112, outA - 14, 40, 28, p.bg)}</g>`;
  // Portable drive: enclosure with its socket on the short edge and an activity light.
  const portable = `${rect(drive + 12, outB - 22, 144, 44, p.silverDark, 6)}${rect(drive + 4, outB - 5, 8, 10, p.silverLight)}${rect(drive + 132, outB - 2, 12, 4, p.ramp[2], 2)}`;
  return `${text(die.x, 28, "flake.nix", { size: TYPE.body, weight: 600, fill: p.text })}
  ${fixed(flake + nvme + portable)}<circle cx="${drive + 176}" cy="${outA}" r="6" fill="${p.surface}"/>
  <g shape-rendering="crispEdges">${trace(outA)}${trace(outB)}</g>
  <path d="M${check + 17} ${outA + 4} L${drive - 4} ${outB - 8} M${check + 17} ${outB - 4} L${drive - 4} ${outA + 8}" fill="none" stroke="${p.text3}" stroke-dasharray="4 4"/>
  ${text(die.x + die.w + 16, outA - 10, "xelo-nixos-main", { fill: p.text })}${text(die.x + die.w + 16, outB - 10, "xelo-nixos", { fill: p.text })}
  ${text(check + 16, outA + 26, "UUID check", { fill: p.text3, anchor: "end" })}${text(check + 16, outB + 26, "UUID check", { fill: p.text3, anchor: "end" })}
  ${lines(die.x + die.w + 16, (outA + outB) / 2 - 4, ["Wrong drive mounted:", "the switch is refused"], { fill: p.text2 })}
  ${text(drive, outA + 44, "Internal NVMe", { size: TYPE.body, weight: 600, fill: p.text })}${text(drive, outA + 60, "Beside Windows in the laptop", { fill: p.text3 })}
  ${text(drive, outB + 44, "External drive", { size: TYPE.body, weight: 600, fill: p.text })}${text(drive, outB + 60, "Its own root, boot and swap", { fill: p.text3 })}`;
}

export const DIAGRAMS = { orionBoards, nixosFlake };
