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

// Orion Mesh is drawn as a plate from a hardware manual, in the page's own silver and blue and the
// isometric projection of the graphics card further up: i runs right and down, j left and down, h up
// (millimetres; `scale` is px per mm). Faces are flat tones lit from the upper left with a hairline on
// every edge, each board casts one flat shadow, parts carry numbered balloons with straight leaders that
// never cross, and the key below says what each numbered part does in the experiment.
const isoAt = (ox, oy, scale) => (i, j, h = 0) => [Math.round((ox + (i - j) * scale * 0.866) * 10) / 10, Math.round((oy + (i + j) * scale * 0.5 - h * scale) * 10) / 10];
const EDGE = p.bg;
const poly = (points, fill, edge = EDGE) => `<polygon points="${points.map(([x, y]) => `${x},${y}`).join(" ")}" fill="${fill}"${edge ? ` stroke="${edge}" stroke-width="0.75" stroke-linejoin="round"` : ""}/>`;
const ORION = { gold: p.silverLight, cavity: p.bg };
// [top, face towards the viewer's left, face towards the right]: lightest on top, darkest on the right.
const MATERIAL = {
  pcb: [p.ramp[1], "#174f93", p.ramp[0]],
  metal: [p.silverLight, p.silver, p.silverDark],
  plastic: ["#222b3b", p.surface, p.bg],
  ribbon: ["#eef1f5", p.silverLight, p.silver], // camera and display connectors
  card: [p.silver, p.silverDark, p.structure],
};
// A box standing on height h0: its top, the face towards the viewer's left (j side) and right (i side).
function isoBox(at, [i0, j0, h0], [di, dj, dh], material) {
  const [i1, j1, h1] = [i0 + di, j0 + dj, h0 + dh];
  const [top, left, right] = MATERIAL[material];
  return poly([at(i0, j1, h1), at(i1, j1, h1), at(i1, j1, h0), at(i0, j1, h0)], left) + poly([at(i1, j0, h1), at(i1, j1, h1), at(i1, j1, h0), at(i1, j0, h0)], right) + poly([at(i0, j0, h1), at(i1, j0, h1), at(i1, j1, h1), at(i0, j1, h1)], top);
}
// Socket openings: a dark cavity on the face at the board's right end (constant i) or front edge (constant j).
const cavityI = (at, i, [j0, j1], [h0, h1]) => poly([at(i, j0, h1), at(i, j1, h1), at(i, j1, h0), at(i, j0, h0)], ORION.cavity, "");
const cavityJ = (at, j, [i0, i1], [h0, h1]) => poly([at(i0, j, h1), at(i1, j, h1), at(i1, j, h0), at(i0, j, h0)], ORION.cavity, "");

// Raspberry Pi parts in mm on the 85 x 56 board, header along the far edge, network and USB at the right end.
const PCB = 1.6;
const usbStack = (j) => ({ at: [69, j], size: [18, 13, 16], material: "metal", detail: (at) => cavityI(at, 87, [j + 1.5, j + 11.5], [PCB + 2, PCB + 6.5]) + cavityI(at, 87, [j + 1.5, j + 11.5], [PCB + 9, PCB + 13.5]) });
const ethernet = (j) => ({ at: [66, j], size: [21, 16, 13.5], material: "metal", detail: (at) => cavityI(at, 87, [j + 2.5, j + 13.5], [PCB + 2.5, PCB + 10.5]) });
const frontSocket = (i, j, [di, dj, dh]) => ({ at: [i, j], size: [di, dj, dh], material: "metal", detail: (at) => cavityJ(at, j + dj, [i + 1, i + di - 1], [PCB + 0.7, PCB + dh - 0.7]) });
const header = {
  at: [7, 1], size: [51, 5, 8.5], material: "plastic",
  // 2 x 20 gold pins on the header's top.
  detail: (at) => Array.from({ length: 40 }, (_, k) => { const [i, j] = [8.2 + Math.floor(k / 2) * 2.54, 1.8 + (k % 2) * 2.3]; return poly([at(i, j, PCB + 8.5), at(i + 1.1, j, PCB + 8.5), at(i + 1.1, j + 1.1, PCB + 8.5), at(i, j + 1.1, PCB + 8.5)], ORION.gold, ""); }).join(""),
};
const audioJack = { at: [50, 44], size: [7, 14, 6], material: "plastic", detail: (at) => { const [x, y] = at(53.5, 58, PCB + 3); return `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="3.2" fill="${ORION.cavity}"/>`; } };
const common = [
  header,
  { at: [-4, 22], size: [4, 11, 1], material: "card", base: 0 }, // microSD card, showing past the board's edge
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
  4: { radio: [13, 15, PCB + 2], soc: [29.5, 32.5, PCB + 2.4], card: [-2.4, 30, 1] },
  3: { radio: [9, 11.5, PCB + 1.2], soc: [28, 31, PCB + 1.4], card: [-2.4, 30, 1] },
};


function isoPi(at, model) {
  const parts = [...PI_PARTS[model]].sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1])); // far parts first
  const draw = (part) => isoBox(at, [...part.at, part.base ?? PCB], part.size, part.material) + (part.detail ? part.detail(at) : "");
  const under = parts.filter((part) => part.base === 0).map(draw).join("");
  const holes = [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]].map(([i, j]) => { const [x, y] = at(i, j, PCB); return `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.3" fill="${p.silverLight}"/><ellipse cx="${x}" cy="${y}" rx="2" ry="1.2" fill="${p.bg}"/>`; }).join("");
  const leds = [[p.ramp[3], 8], [p.accent, 11.5]].map(([fill, j]) => { const [x, y] = at(1.4, j, PCB); return `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="1.1" fill="${fill}"/>`; }).join("");
  // One flat shadow on the ground, cast down and to the right of the board's outline.
  const shadow = `<polygon points="${[[7, 7], [94, 7], [94, 63], [7, 63]].map(([i, j]) => at(i, j, 0).join(",")).join(" ")}" fill="${p.bg}" fill-opacity="0.6"/>`;
  return shadow + under + isoBox(at, [0, 0, 0], [85, 56, PCB], "pcb") + holes + leds + parts.filter((part) => part.base !== 0).map(draw).join("");
}

/**
 * Orion Mesh, full width. Top: both boards with numbered parts and the radio link between them.
 * Bottom: the key, one column per node and one for the link, saying what each numbered part does.
 * Facts are from the repository's README and orion_bench.
 */
export function orionTestbed(w, h) {
  const scale = 1.9;
  const drone = isoAt(150, 108, scale);
  const ground = isoAt(w - 196, 108, scale);
  const label = (x, y, value, options = {}) => text(x, y, value, { fill: p.text2, ...options });
  const balloon = (x, y, n) => `<circle cx="${x}" cy="${y}" r="9" fill="${p.text}"/>${text(x, y + 4, String(n), { weight: 600, fill: p.bg, anchor: "middle" })}`;
  // A numbered balloon beside a part, joined to it by one straight leader that stops at the balloon's rim.
  const callout = (at, point, [bx, by], n) => {
    const [px, py] = at(...point);
    const d = Math.hypot(bx - px, by - py);
    const [ex, ey] = [bx - ((bx - px) * 9) / d, by - ((by - py) * 9) / d];
    return `<path d="M${px} ${py} L${Math.round(ex * 10) / 10} ${Math.round(ey * 10) / 10}" fill="none" stroke="${p.text3}"/><circle cx="${px}" cy="${py}" r="2" fill="${p.text}"/>${balloon(bx, by, n)}`;
  };
  const [ax, ay] = drone(...PI_POINTS[4].radio);
  const [bx, by] = ground(...PI_POINTS[3].radio);
  const mid = (ax + bx) / 2;
  const apex = Math.min(ay, by) - 150;

  const plate = `${fixed(isoPi(drone, 4) + isoPi(ground, 3))}
  <path d="M${ax} ${ay} Q${mid} ${apex} ${bx} ${by}" fill="none" stroke="${p.accent}" stroke-width="2" stroke-dasharray="6 4"/>
  ${balloon(mid, (ay + by) / 2 - 75, 4)}
  ${callout(drone, PI_POINTS[4].radio, [88, 70], 1)}${callout(drone, PI_POINTS[4].soc, [118, 252], 2)}${callout(drone, PI_POINTS[4].card, [40, 156], 3)}
  ${callout(ground, PI_POINTS[3].radio, [644, 70], 1)}${callout(ground, PI_POINTS[3].soc, [572, 252], 2)}${callout(ground, PI_POINTS[3].card, [496, 156], 3)}`;

  const ky = 296;
  const column = (x, title, sub, rows) =>
    `${text(x, ky + 24, title, { size: TYPE.body, weight: 600, fill: p.text })}${text(x, ky + 42, sub, { fill: p.text3, caps: true })}${rows.map(([n, value], i) => `${n ? balloon(x + 9, ky + 64 + i * 24, n) : ""}${label(x + 28, ky + 68 + i * 24, value)}`).join("")}`;
  const key = `${rect(24, ky, w - 48, 1, p.structure)}
  ${column(24, "Drone node", "Raspberry Pi 4", [[1, "Radio: wlan0, joined to bat0"], [2, "SoC: sends control, encodes video"], [3, "microSD: NixOS image from the flake"]])}
  ${column(290, "Link", "Ad-hoc Wi-Fi, BATMAN-adv", [[4, "Control: TwistStamped at 50 Hz"], [0, "Video: H.264 at 0 to 15 Mbps"], [0, "Clocks: kept in step by Chrony"]])}
  ${column(556, "Ground node", "Raspberry Pi 3", [[1, "Radio: wlan0, joined to bat0"], [2, "SoC: times each message, logs CPU"], [3, "microSD: image from the same flake"]])}`;

  return `${plate}${key}`;
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
