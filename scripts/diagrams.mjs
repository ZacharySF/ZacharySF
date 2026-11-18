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
// Orion Mesh keeps its own look so it reads apart from the blue-on-navy figures: a soft purple
// scene (violet gradient, lilac boards, pearl sockets, pink and aqua streams, a few sparkles).
// The whole figure is a fixed panel, like a screenshot, on either page theme.
const ORION = {
  panel: "#221447", // the gradient's middle, for cut-outs
  rule: "#4c3a86",
  text: "#ffffff",
  text2: "#e6defc",
  text3: "#b9abea", // 6.6:1 on the panel's lightest corner
  control: "#ff8ad4",
  video: "#8fe6ff",
  gold: "#ffe9f6",
  cavity: "#2a1a55",
};
const MATERIAL = {
  pcb: ["#b49cff", "#8468e0", "#5f45b8"],
  metal: ["#ffffff", "#ddd5f8", "#a99cdc"],
  plastic: ["#4a3590", "#34246c", "#251850"],
  ribbon: ["#ffd3ee", "#f3a6d6", "#c97fb6"], // camera and display connectors
  card: ["#7a63d6", "#5a46ac", "#43338a"],
};
// Soft backdrop: a violet gradient with two blurred lights, and four-point sparkles.
const orionBackdrop = (w, h) => `<defs>
    <linearGradient id="orionBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a0f38"/><stop offset="0.55" stop-color="#2a1958"/><stop offset="1" stop-color="#3b2470"/></linearGradient>
    <radialGradient id="orionLilac"><stop offset="0" stop-color="#b79cff" stop-opacity="0.38"/><stop offset="1" stop-color="#b79cff" stop-opacity="0"/></radialGradient>
    <radialGradient id="orionPink"><stop offset="0" stop-color="#ff9ad5" stop-opacity="0.28"/><stop offset="1" stop-color="#ff9ad5" stop-opacity="0"/></radialGradient>
  </defs>${rect(0, 0, w, h, "url(#orionBg)")}<ellipse cx="${w * 0.5}" cy="96" rx="330" ry="170" fill="url(#orionLilac)"/><ellipse cx="${w * 0.86}" cy="${h * 0.62}" rx="240" ry="190" fill="url(#orionPink)"/><ellipse cx="${w * 0.1}" cy="${h * 0.7}" rx="220" ry="170" fill="url(#orionLilac)"/>`;
const sparkle = (x, y, r, opacity = 0.9) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="#ffffff" fill-opacity="${opacity}"/>`;
// A box standing on height h0: its top, the face towards the viewer's left (j side) and right (i side).
function isoBox(at, [i0, j0, h0], [di, dj, dh], material) {
  const [i1, j1, h1] = [i0 + di, j0 + dj, h0 + dh];
  const [top, left, right] = MATERIAL[material];
  return poly([at(i0, j1, h1), at(i1, j1, h1), at(i1, j1, h0), at(i0, j1, h0)], left) + poly([at(i1, j0, h1), at(i1, j1, h1), at(i1, j1, h0), at(i1, j0, h0)], right) + poly([at(i0, j0, h1), at(i1, j0, h1), at(i1, j1, h1), at(i0, j1, h1)], top);
}
// Socket openings: a dark cavity on the face at the board's right end (constant i) or front edge (constant j).
const cavityI = (at, i, [j0, j1], [h0, h1]) => poly([at(i, j0, h1), at(i, j1, h1), at(i, j1, h0), at(i, j0, h0)], ORION.cavity);
const cavityJ = (at, j, [i0, i1], [h0, h1]) => poly([at(i0, j, h1), at(i1, j, h1), at(i1, j, h0), at(i0, j, h0)], ORION.cavity);

// Raspberry Pi parts in mm on the 85 x 56 board, header along the far edge, network and USB at the right end.
const PCB = 1.6;
const usbStack = (j) => ({ at: [69, j], size: [18, 13, 16], material: "metal", detail: (at) => cavityI(at, 87, [j + 1.5, j + 11.5], [PCB + 2, PCB + 6.5]) + cavityI(at, 87, [j + 1.5, j + 11.5], [PCB + 9, PCB + 13.5]) });
const ethernet = (j) => ({ at: [66, j], size: [21, 16, 13.5], material: "metal", detail: (at) => cavityI(at, 87, [j + 2.5, j + 13.5], [PCB + 2.5, PCB + 10.5]) });
const frontSocket = (i, j, [di, dj, dh]) => ({ at: [i, j], size: [di, dj, dh], material: "metal", detail: (at) => cavityJ(at, j + dj, [i + 1, i + di - 1], [PCB + 0.7, PCB + dh - 0.7]) });
const header = {
  at: [7, 1], size: [51, 5, 8.5], material: "plastic",
  // 2 x 20 gold pins on the header's top.
  detail: (at) => Array.from({ length: 40 }, (_, k) => { const [i, j] = [8.2 + Math.floor(k / 2) * 2.54, 1.8 + (k % 2) * 2.3]; return poly([at(i, j, PCB + 8.5), at(i + 1.1, j, PCB + 8.5), at(i + 1.1, j + 1.1, PCB + 8.5), at(i, j + 1.1, PCB + 8.5)], ORION.gold); }).join(""),
};
const audioJack = { at: [50, 44], size: [7, 14, 6], material: "plastic", detail: (at) => { const [x, y] = at(53.5, 58, PCB + 3); return `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="3.2" fill="${ORION.cavity}"/>`; } };
const common = [
  header,
  { at: [-2.5, 22], size: [2.5, 11, 1], material: "card", base: 0 }, // microSD card, showing past the board's edge
  { at: [2.5, 17], size: [2.5, 22, 4], material: "ribbon" }, // display connector
  { at: [45.5, 34], size: [2.5, 15, 4], material: "ribbon" }, // camera connector
  audioJack,
];
const PI_PARTS = {
  4: [
    ...common,
    { at: [7, 10], size: [12, 10, 2], material: "metal" }, // wireless module
    { at: [22, 25], size: [15, 15, 2.4], material: "metal" }, // SoC lid
    { at: [42, 26], size: [12, 14, 1], material: "plastic" }, // memory
    { at: [58, 30], size: [7, 7, 1], material: "plastic" }, // USB controller
    ethernet(2.5), usbStack(22.5), usbStack(40),
    frontSocket(7, 49, [9, 8.5, 3.2]), // USB-C power
    frontSocket(22, 50, [7, 7.5, 3]), frontSocket(35.5, 50, [7, 7.5, 3]), // micro HDMI
  ],
  3: [
    ...common,
    { at: [8, 9], size: [2, 5, 1.2], material: "metal" }, // chip antenna
    { at: [21, 24], size: [14, 14, 1.4], material: "plastic" }, // SoC
    { at: [52, 34], size: [9, 9, 1], material: "plastic" }, // USB and Ethernet controller
    usbStack(2), usbStack(20), ethernet(37.5),
    frontSocket(6.5, 50, [8, 7.5, 3]), // micro USB power
    frontSocket(24.5, 45, [15, 12.5, 6.5]), // HDMI
  ],
};
// Where callouts and the radio link attach, in board mm.
const PI_POINTS = {
  4: { radio: [13, 15, PCB + 2], soc: [29.5, 32.5, PCB + 2.4], card: [-1.2, 27.5, 1] },
  3: { radio: [9, 11.5, PCB + 1.2], soc: [28, 31, PCB + 1.4], card: [-1.2, 27.5, 1] },
};

function isoPi(at, model) {
  const parts = [...PI_PARTS[model]].sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1])); // far parts first
  const draw = (part) => isoBox(at, [...part.at, part.base ?? PCB], part.size, part.material) + (part.detail ? part.detail(at) : "");
  const under = parts.filter((part) => part.base === 0).map(draw).join("");
  const holes = [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]].map(([i, j]) => { const [x, y] = at(i, j, PCB); return `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.3" fill="${ORION.gold}"/><ellipse cx="${x}" cy="${y}" rx="2" ry="1.2" fill="${ORION.panel}"/>`; }).join("");
  const leds = [["#ff8ad4", 8], ["#8fe6ff", 11.5]].map(([fill, j]) => { const [x, y] = at(1.4, j, PCB); return `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="1.1" fill="${fill}"/>`; }).join("");
  return under + isoBox(at, [0, 0, 0], [85, 56, PCB], "pcb") + holes + leds + parts.filter((part) => part.base !== 0).map(draw).join("");
}

export const ORION_BITRATES = [0, 1, 2, 4, 6, 8, 10, 12, 15];

/**
 * Orion Mesh, full width. Top: both boards in the page's isometric projection with their parts called
 * out, and the radio link carrying the two streams. Bottom: what a control message carries, and the
 * video bitrates tested, on a linear ruler. Facts are from the repository's README and control_sub.py.
 */
export function orionTestbed(w, h) {
  const scale = 1.9;
  const drone = isoAt(150, 120, scale);
  const ground = isoAt(w - 196, 120, scale);
  const o = ORION;
  const label = (x, y, value, options = {}) => text(x, y, value, { fill: o.text2, ...options });
  const leader = (d) => `<path d="${d}" fill="none" stroke="${o.text3}"/>`;
  // A callout: a dot on the part, a leader straight up or down to the label's row, the label beside it.
  const callout = (at, point, y, value, side = 1) => {
    const [px, py] = at(...point).map(Math.round);
    const up = y < py;
    return `<circle cx="${px}" cy="${py}" r="2" fill="${o.text}"/>${leader(`M${px + 0.5} ${py} V${up ? y + 4 : y - 10} h${side * 6}`)}${label(px + side * 10, y, value, { anchor: side > 0 ? "start" : "end" })}`;
  };
  const [ax, ay] = drone(...PI_POINTS[4].radio);
  const [bx, by] = ground(...PI_POINTS[3].radio);
  const mid = (ax + bx) / 2;
  const arc = (lift) => `M${ax} ${ay} Q${mid} ${Math.min(ay, by) - lift} ${bx} ${by}`;
  const key = (y, swatch, value) => `${swatch}${label(mid - 24, y, value)}`;

  const top = `${isoPi(drone, 4)}${isoPi(ground, 3)}
  <path d="${arc(150)}" fill="none" stroke="${o.video}" stroke-width="18" stroke-opacity="0.12" stroke-linecap="round"/>
  <path d="${arc(150)}" fill="none" stroke="${o.video}" stroke-width="6" stroke-opacity="0.55" stroke-linecap="round"/>
  <path d="${arc(150)}" fill="none" stroke="${o.control}" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>
  <circle cx="${ax}" cy="${ay}" r="10" fill="${o.control}" fill-opacity="0.25"/><circle cx="${bx}" cy="${by}" r="10" fill="${o.control}" fill-opacity="0.25"/><circle cx="${ax}" cy="${ay}" r="4" fill="${o.control}"/><circle cx="${bx}" cy="${by}" r="4" fill="${o.control}"/>
  ${sparkle(mid - 118, 70, 7)}${sparkle(mid + 96, 58, 5, 0.7)}${sparkle(mid + 150, 92, 3, 0.6)}${sparkle(mid - 20, 128, 3, 0.5)}${sparkle(w - 60, 300, 6, 0.7)}${sparkle(40, 250, 4, 0.6)}
  ${text(24, 36, "Drone node", { size: TYPE.body, weight: 600, fill: o.text })}${text(24, 54, "Raspberry Pi 4", { fill: o.text3, caps: true })}
  ${text(w - 24, 36, "Ground node", { size: TYPE.body, weight: 600, fill: o.text, anchor: "end" })}${text(w - 24, 54, "Raspberry Pi 3", { fill: o.text3, caps: true, anchor: "end" })}
  ${text(mid, 36, "Ad-hoc Wi-Fi cell, bridged by BATMAN-adv", { fill: o.text, anchor: "middle" })}
  ${key(170, `<path d="M${mid - 58} 166 h24" stroke="${o.control}" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>`, "Control, 50 Hz")}
  ${key(192, `<path d="M${mid - 58} 188 h24" stroke="${o.video}" stroke-width="6" stroke-opacity="0.55" stroke-linecap="round"/>`, "H.264 video, 0 to 15 Mbps")}
  ${key(214, `<path d="M${mid - 58} 210.5 h24" stroke="${o.text3}"/>`, "Chrony syncs the clocks")}
  ${callout(drone, PI_POINTS[4].radio, 98, "Radio: wlan0 in bat0", -1)}
  ${callout(drone, PI_POINTS[4].soc, 286, "SoC: ROS 2 publisher, video encoder")}
  ${callout(drone, PI_POINTS[4].card, 306, "microSD: NixOS image")}
  ${callout(ground, PI_POINTS[3].radio, 98, "Radio: wlan0 in bat0")}
  ${callout(ground, PI_POINTS[3].soc, 286, "SoC: subscriber, latency log")}
  ${callout(ground, PI_POINTS[3].card, 306, "microSD: NixOS image")}`;

  // What one control message carries (geometry_msgs/TwistStamped), drawn as a field map.
  const fy = 372;
  const fields = [["header.stamp", "send time", 132], ["header.frame_id", "sequence number", 132], ["twist", "synthetic command", 100]];
  let fx = 24;
  const message = fields
    .map(([name, meaning, width]) => {
      const cell = `<rect x="${fx + 0.5}" y="${fy + 0.5}" width="${width - 5}" height="27" rx="13.5" fill="#ffffff" fill-opacity="0.1" stroke="${o.text3}" stroke-opacity="0.7"/>${label(fx + width / 2 - 2, fy + 18, name, { fill: o.text, anchor: "middle" })}${label(fx + width / 2 - 2, fy + 46, meaning, { fill: o.text3, anchor: "middle" })}`;
      fx += width + 4;
      return cell;
    })
    .join("");

  // Tested encoder targets on a linear ruler: a tall tick and its number at each one, a short tick per Mbps.
  const ruler = { x0: 436, x1: w - 32, y: fy + 14 };
  const top15 = Math.max(...ORION_BITRATES);
  const xOf = (rate) => Math.round((ruler.x0 + ((ruler.x1 - ruler.x0) * rate) / top15) * 10) / 10;
  const minor = Array.from({ length: top15 + 1 }, (_, r) => `<rect x="${xOf(r)}" y="${ruler.y - 4}" width="1" height="4" fill="${o.text3}"/>`).join("");
  const major = ORION_BITRATES.map((rate) => `<rect data-rate="${rate}" x="${xOf(rate)}" y="${ruler.y - 14}" width="2" height="14" rx="1" fill="${o.video}"/>${label(xOf(rate) + 1, ruler.y + 20, String(rate), { anchor: "middle" })}`).join("");

  const bottom = `${rect(24, 328, w - 48, 1, o.rule)}
  ${text(24, 356, "One control message", { fill: o.text3, caps: true })}${message}
  ${label(24, fy + 76, "Latency is the ground's receive time minus the send time.")}
  ${text(ruler.x0, 356, "Video load per trial, Mbps", { fill: o.text3, caps: true })}
  <g shape-rendering="crispEdges">${rect(ruler.x0, ruler.y, ruler.x1 - ruler.x0 + 2, 1, o.text3)}${minor}${major}</g>
  ${label(ruler.x0, fy + 76, "Each trial also records sequence gaps and CPU use.")}`;

  return fixed(`${orionBackdrop(w, h)}${top}${bottom}`);
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
