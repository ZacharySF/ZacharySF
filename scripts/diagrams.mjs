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

// Orion Mesh is drawn as a block diagram in the manner of NVIDIA's module and software-stack figures:
// flat filled tiles with their names inside, one container per node, a bus where the two meet, and a
// key for what the fills mean. The colours are its own (cobalt and sky blue with amber, a darker and a
// lighter half) so it reads apart from the other figures, and it stays as drawn on either page theme.
const ORION = {
  left: "#0f2257", // the drone's half of the panel
  right: "#1c4496", // the ground's half
  boxLeft: "#182f72",
  boxRight: "#2a57b8",
  ink: "#0e1d4a", // text on light tiles; also the darkest tile
  white: "#ffffff",
  soft: "#cfe0f9", // secondary text on the blue grounds (>= 7:1)
  own: "#f2bd4b", // written for Orion Mesh
  theirs: "#a9c8f5", // third-party software
  net: "#dbe8fc", // network interfaces
  metal: "#52648f", // hardware
};
const ORION_BITRATES = [0, 1, 2, 4, 6, 8, 10, 12, 15];
const ORION_NODES = [
  { name: "Drone node", board: "Raspberry Pi 4", soc: "BCM2711, 4 cores", own: ["control_pub", "video_tx"] },
  { name: "Ground node", board: "Raspberry Pi 3", soc: "BCM2837, 4 cores", own: ["control_sub", "video_rx", "cpu_log"] },
];

/**
 * Orion Mesh, full width: each node's stack from its benchmark programs down to the board, the one
 * Wi-Fi channel both share, the two streams that cross it, the fields of a control message and the
 * video bitrates tested. Names are the repository's own (orion_bench, README).
 */
export function orionTestbed(w, h) {
  const o = ORION;
  const tile = (x, y, width, name, fill, ink = o.ink, height = 28) => `${rect(x, y, width, height, fill, 2)}${text(x + width / 2, y + height / 2 + 4, name, { fill: ink, anchor: "middle" })}`;
  // Tiles of the given widths (or equal widths) across `span`, 8 px apart.
  const row = (x, y, span, names, fill, widths, ink) => {
    const each = widths ?? names.map(() => (span - 8 * (names.length - 1)) / names.length);
    let at = x;
    return names.map((name, i) => { const out = tile(Math.round(at), y, Math.round(each[i]), name, fill, ink); at += each[i] + 8; return out; }).join("");
  };
  const box = { w: 314, pad: 12, y: 24, h: 296 };
  const node = (x, { name, board, soc, own }, fill) => {
    const [ix, span] = [x + box.pad, box.w - 2 * box.pad];
    const chip = { x: ix, y: box.y + 220, size: 60 };
    const cores = [0, 1, 2, 3].map((k) => rect(chip.x + 8 + (k % 2) * 24, chip.y + 8 + Math.floor(k / 2) * 24, 20, 20, o.metal)).join("");
    return `${rect(x, box.y, box.w, box.h, fill, 4)}
    ${text(ix, box.y + 26, name, { size: TYPE.body, weight: 600, fill: o.white })}${text(x + box.w - box.pad, box.y + 26, board, { fill: o.soft, anchor: "end" })}
    ${row(ix, box.y + 40, span, own, o.own)}
    ${row(ix, box.y + 76, span, ["ROS 2", "CycloneDDS", "ffmpeg", "Chrony"], o.theirs, [50, 88, 62, 66])}
    ${tile(ix, box.y + 112, span, "bat0, BATMAN-adv mesh", o.net)}
    ${tile(ix, box.y + 148, span, "wlan0, ad-hoc Wi-Fi", o.net)}
    ${tile(ix, box.y + 184, span, "NixOS image, built from one flake", o.ink, o.white)}
    ${rect(chip.x, chip.y, chip.size, chip.size, o.ink, 2)}${cores}
    ${tile(ix + 72, chip.y, span - 72, soc, o.metal, o.white, 26)}
    ${row(ix + 72, chip.y + 34, span - 72, ["Wi-Fi radio", "microSD", "40-pin"], o.metal, null, o.white).replaceAll('height="28"', 'height="26"')}`;
  };
  const [lx, rx] = [24, w - 24 - box.w];
  const [gapL, gapR] = [lx + box.w, rx];
  const mid = w / 2;
  // A stream from the drone's programs to the ground's: a line with an arrowhead, named above it.
  const stream = (y, name) => `${rect(gapL, y - 1, gapR - gapL - 8, 2, o.own)}<path d="M${gapR} ${y} l-10 -5 v10 z" fill="${o.own}"/>${text(mid, y - 8, name, { fill: o.white, anchor: "middle" })}`;

  const by = 356;
  const fields = [["header.stamp", "send time", 112], ["header.frame_id", "sequence number", 128], ["twist", "synthetic command", 58]];
  let fx = lx;
  const message = fields.map(([name, meaning, width]) => { const out = tile(fx, by, width, name, o.net) + text(fx, by + 46, meaning, { fill: o.soft }); fx += width + 8; return out; }).join("");
  const key = [["Written for Orion Mesh", o.own], ["Third-party software", o.theirs], ["Hardware", o.metal]];
  let kx = lx;
  const legend = key.map(([name, fill]) => { const out = rect(kx, h - 34, 12, 12, fill, 2) + text(kx + 18, h - 24, name, { fill: o.soft }); kx += 18 + name.length * 6.3 + 20; return out; }).join("");

  return fixed(`<defs><pattern id="orionWeave" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="${o.white}" fill-opacity="0.05"/></pattern></defs>
  ${rect(0, 0, mid, h, o.left)}${rect(mid, 0, w - mid, h, o.right)}${rect(0, 0, w, h, "url(#orionWeave)")}
  ${node(lx, ORION_NODES[0], o.boxLeft)}${node(rx, ORION_NODES[1], o.boxRight)}
  ${stream(box.y + 58, "control, 50 Hz")}${stream(box.y + 100, "video, 0 to 15 Mbps")}
  ${tile(gapL, box.y + 148, gapR - gapL, "one channel", o.own)}
  ${text(lx, by - 12, "One control message", { weight: 600, fill: o.white })}${message}
  ${text(rx, by - 12, "Video load per trial, Mbps", { weight: 600, fill: o.white })}${row(rx, by, box.w, ORION_BITRATES.map(String), o.theirs)}
  ${text(rx, by + 46, "Each trial also records sequence gaps and CPU use.", { fill: o.soft })}
  ${legend}${text(w - 24, h - 24, "Latency = ground receive time - send time", { fill: o.soft, anchor: "end" })}`);
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

export const DIAGRAMS = { orionTestbed, nixosFlake };
