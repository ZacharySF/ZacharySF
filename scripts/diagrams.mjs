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

// A Raspberry Pi seen from above at 2 px per mm (85 x 56 mm board), 40-pin header along the top edge.
// `model` 4 or 3 moves the parts that differ: Ethernet and USB order, the power and HDMI sockets, the SoC lid.
function board(x, y, model) {
  const at = (dx, dy, w, h, fill, rx = 0) => rect(x + dx, y + dy, w, h, fill, rx);
  const pins = at(15, 1, 102, 12, p.bg) + Array.from({ length: 40 }, (_, i) => at(17 + Math.floor(i / 2) * 5, 3 + (i % 2) * 5, 3, 3, p.silverLight)).join("");
  const holes = BOARD_HOLES.map(([cx, cy]) => `<circle cx="${x + cx}" cy="${y + cy}" r="5" fill="${p.silverDark}"/>`).join("");
  const sockets =
    model === 4
      ? at(140, 6, 34, 32, p.silver) + at(140, 44, 34, 26, p.silver) + at(140, 78, 34, 26, p.silver) + at(14, 102, 18, 12, p.silver) + at(44, 104, 14, 10, p.silver) + at(70, 104, 14, 10, p.silver)
      : at(140, 6, 34, 26, p.silver) + at(140, 40, 34, 26, p.silver) + at(140, 74, 34, 32, p.silver) + at(12, 104, 16, 10, p.silver) + at(48, 100, 30, 14, p.silver);
  const chips =
    model === 4
      ? at(44, 40, 30, 30, p.silverLight) + at(84, 42, 24, 26, p.bg) + at(116, 62, 12, 12, p.bg) + at(14, 20, 24, 18, p.silver)
      : at(44, 40, 28, 28, p.bg) + at(100, 60, 20, 20, p.bg) + at(6, 18, 4, 10, p.silverLight);
  // Camera and display ribbon connectors, and the audio jack on the bottom edge.
  const ribbons = at(2, 46, 6, 40, p.text3) + at(90, 78, 6, 22, p.text3) + at(100, 102, 14, 12, p.bg);
  return `<rect x="${x}" y="${y}" width="170" height="112" rx="6" fill="${p.structure}"/>${holes}<g shape-rendering="crispEdges">${pins}${chips}${ribbons}${sockets}</g>`;
}

// Mounting holes show the panel behind the board, so they are drawn outside the fixed hardware.
const BOARD_HOLES = [[7, 7], [123, 7], [7, 105], [123, 105]];
const boardHoles = (x, y) => BOARD_HOLES.map(([cx, cy]) => `<circle cx="${x + cx}" cy="${y + cy}" r="3" fill="${p.surface}"/>`).join("");

/**
 * Orion Mesh, full width: the two boards from above, the radio link between their wireless parts,
 * what travels over it, and each node's job.
 */
export function orionBoards(w, h) {
  const [left, right, top] = [24, w - 24 - 170, 80];
  const [radioA, radioB] = [left + 26, right + 8]; // Pi 4 wireless module, Pi 3 chip antenna
  const jobs = (x, name, model, rows) => text(x, top + 140, name, { size: TYPE.body, weight: 600, fill: p.text }) + text(x, top + 158, `Raspberry Pi ${model}`, { fill: p.text3, caps: true }) + lines(x, top + 182, rows);
  const note = (x, head, rows) => text(x, top + 40, head, { fill: p.text3, caps: true }) + lines(x, top + 62, rows);
  return `${fixed(board(left, top, 4) + board(right, top, 3))}${boardHoles(left, top)}${boardHoles(right, top)}
  <path d="M${radioA} ${top + 26} V48 H${radioB} V${top + 20}" fill="none" stroke="${p.accent}" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="${radioA}" cy="${top + 28}" r="4" fill="${p.accent}"/><circle cx="${radioB}" cy="${top + 22}" r="4" fill="${p.accent}"/>
  ${text((radioA + radioB) / 2, 36, "Ad-hoc Wi-Fi cell, bridged by BATMAN-adv", { fill: p.text, anchor: "middle" })}
  ${text(radioA + 10, 72, "wlan0", { fill: p.text3, caps: true })}${text(radioB + 10, 72, "wlan0", { fill: p.text3, caps: true })}
  <rect x="226" y="50" width="1" height="${top - 24}" fill="${p.text3}"/>
  ${note(226, "On the link", ["Control at 50 Hz", "H.264 video"])}${note(350, "Video load", ["0 to 15 Mbps", "in nine steps"])}${note(466, "On both nodes", ["ROS 2, CycloneDDS", "BATMAN-adv, Chrony"])}
  ${jobs(left, "Drone node", 4, ["Publishes control at 50 Hz", "Streams H.264 at 0 to 15 Mbps", "Serves the reference clock"])}
  ${jobs(right, "Ground node", 3, ["Times every control message", "Counts gaps in the sequence", "Logs CPU use per trial"])}`;
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
