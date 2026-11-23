// Figures drawn for project blocks that have no screenshot to show (Orion Mesh, nixos-config).
// Each takes its slot size and returns markup for a w x h box with the shared tokens; the block
// renderer clips it to the slot. They follow the hero's language: top-down hardware on a pixel grid,
// kept dark on any page (fixed), with labels and traces around it. Facts come from the projects' READMEs.
import { COND, fixed, PALETTE as p, SANS, TYPE } from "./style.mjs";
import { escapeXml } from "./svg.mjs";

const text = (x, y, value, { size = TYPE.label, weight = 500, fill = p.text2, anchor = "start", caps = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}"${anchor === "start" ? "" : ` text-anchor="${anchor}"`}${caps ? ` font-family="${COND}" letter-spacing="0.3"` : ""}>${escapeXml(caps ? value.toUpperCase() : value)}</text>`;
const lines = (x, y, rows, options) => rows.map((row, i) => text(x, y + i * 16, row, options)).join("");
const rect = (x, y, w, h, fill, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ""} fill="${fill}"/>`;

// Orion Mesh is drawn as a cyanotype blueprint sheet: both boards in orthographic top view (drone
// above, ground below, each turned so its radio faces the middle), dashed leaders from each radio to
// its network stack, the two stacks joined across one IBSS cell by antenna symbols, the trial schedule
// on the right and a title strip along the bottom. The sheet is drawn hardware and keeps its colours on
// the light page. Board outline and mounting holes are from the Raspberry Pi mechanical drawings; part
// placements follow them closely enough to read.
const BP = { sheet: p.ramp[0], mid: p.ramp[1], ink2: p.ramp[2], ink: p.ramp[3], white: p.text };
const r2 = (v) => Math.round(v * 100) / 100;
const hp = (v) => Math.round(v - 0.5) + 0.5; // centre of a 1 px line
const ip = Math.round;
const bpText = (x, y, value, { sans = false, size = TYPE.label, fill = BP.ink, anchor = "start", rot = 0, attrs = "" } = {}) =>
  `<text x="${r2(x)}" y="${r2(y)}" font-family="${sans ? SANS : COND}" font-size="${size}" font-weight="${sans ? 600 : 500}" fill="${fill}"${anchor === "start" ? "" : ` text-anchor="${anchor}"`}${rot ? ` transform="rotate(${rot} ${r2(x)} ${r2(y)})"` : ""}${attrs}>${escapeXml(value)}</text>`;
const line = (x1, y1, x2, y2, stroke, sw = 1, extra = "") => `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${stroke}" stroke-width="${sw}"${extra}/>`;
const hline = (x1, x2, y, stroke, sw = 1) => line(x1, hp(y), x2, hp(y), stroke, sw);
const vline = (x, y1, y2, stroke) => line(hp(x), y1, hp(x), y2, stroke);
const path = (d, stroke, fill = "none", extra = "") => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1"${extra}/>`;
const circle = (cx, cy, r, stroke, fill = "none") => `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
// Pixel box [x, x + w) x [y, y + h) with a crisp 1 px (box1) or 2 px (box2) stroke inside it.
function box1(x, y, w, h, stroke, fill = "none", extra = "") {
  const [x0, y0, x1, y1] = [ip(x), ip(y), ip(x + w), ip(y + h)];
  return `<rect x="${x0 + 0.5}" y="${y0 + 0.5}" width="${Math.max(0, x1 - x0 - 1)}" height="${Math.max(0, y1 - y0 - 1)}" fill="${fill}" stroke="${stroke}"${extra}/>`;
}
function box2(x, y, w, h, stroke, fill = "none", rx = 0) {
  const [x0, y0, x1, y1] = [ip(x), ip(y), ip(x + w), ip(y + h)];
  return `<rect x="${x0 + 1}" y="${y0 + 1}" width="${x1 - x0 - 2}" height="${y1 - y0 - 2}"${rx ? ` rx="${rx}"` : ""} fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
}
// Filled arrowhead with its tip at (x, y), pointing along angle a.
function arrow(x, y, a, fill, len = 8, half = 2.5) {
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const [bx, by] = [x - c * len, y - s * len];
  return `<path d="M${r2(x)} ${r2(y)}L${r2(bx - s * half)} ${r2(by + c * half)}L${r2(bx + s * half)} ${r2(by - c * half)}Z" fill="${fill}"/>`;
}
const DASH_HIDDEN = ` stroke-dasharray="4 3"`;
const DASH_CENTRE = ` stroke-dasharray="12 3 2 3"`;

// Boards in mm, top view: 40-pin header along the top long edge, USB/Ethernet at x = 85, microSD under x = 0.
const BOARD = { w: 85, h: 56, holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]] };
const COMMON = [
  { ref: "J2", k: "hdr", x: 7.1, y: 1, w: 50.8, h: 5, lp: [32.5, 9.8] },
  { ref: "J11", k: "ffc", x: 1.5, y: 17, w: 3.5, h: 20, nl: 1 },
  { ref: "J1", k: "sd", x: 0, y: 21.5, w: 14, h: 14, side: "bot", lp: [10.5, 28.5] },
  { ref: "", k: "card", x: -2.5, y: 23, w: 2.5, h: 11, side: "bot" },
];
const PI4 = [
  ...COMMON,
  { ref: "J3", k: "eth", x: 66, y: 2.25, w: 22, h: 16 },
  { ref: "J4", k: "usb", x: 70, y: 22.45, w: 17.1, h: 13.1 },
  { ref: "J5", k: "usb", x: 70, y: 40.45, w: 17.1, h: 13.1 },
  { ref: "J6", k: "usbc", x: 6.7, y: 49.5, w: 9, h: 7.5, lp: [11.2, 46] },
  { ref: "J7", k: "hdmi", x: 22.5, y: 50, w: 7, h: 7.5, lp: [26, 46.5] },
  { ref: "J8", k: "hdmi", x: 36, y: 50, w: 7, h: 7.5, lp: [39.5, 46.5] },
  { ref: "J9", k: "audio", x: 50.5, y: 44, w: 7, h: 11, lp: [54, 40.5] },
  { ref: "", k: "barrel", x: 51.5, y: 55, w: 5, h: 3.5 },
  { ref: "J10", k: "ffc", x: 45.5, y: 36, w: 3.5, h: 19, nl: 1 },
  { ref: "U1", k: "soc", x: 22, y: 22, w: 15, h: 15 },
  { ref: "U3", k: "ic", x: 41, y: 22, w: 12, h: 12 },
  { ref: "U4", k: "ic", x: 57, y: 26, w: 7, h: 7 },
  { ref: "U2", k: "shield", x: 7, y: 9, w: 12, h: 11, role: "wifi" },
  { ref: "", k: "pcbant", x: 0.8, y: 6, w: 4, h: 9 },
];
const PI3 = [
  ...COMMON,
  { ref: "J4", k: "usb", x: 70, y: 2.45, w: 17.1, h: 13.1 },
  { ref: "J5", k: "usb", x: 70, y: 20.45, w: 17.1, h: 13.1 },
  { ref: "J3", k: "eth", x: 66, y: 37.75, w: 22, h: 16 },
  { ref: "J6", k: "usbm", x: 6.6, y: 51, w: 8, h: 6, lp: [10.6, 47.5] },
  { ref: "J7", k: "hdmi", x: 24.5, y: 45.5, w: 15, h: 12 },
  { ref: "J9", k: "audio", x: 50, y: 44, w: 7, h: 11, lp: [53.5, 40.5] },
  { ref: "", k: "barrel", x: 51, y: 55, w: 5, h: 3.5 },
  { ref: "J10", k: "ffc", x: 43.5, y: 34, w: 3.5, h: 20, nl: 1 },
  { ref: "U1", k: "soc", x: 23, y: 18, w: 14, h: 14 },
  { ref: "U3", k: "ic", x: 22, y: 17, w: 16, h: 16, side: "bot", nl: 1 },
  { ref: "U4", k: "ic", x: 56, y: 25, w: 9, h: 9 },
  { ref: "U2", k: "ic", x: 8, y: 9, w: 7, h: 7, role: "wifi", lp: [18.5, 12.5] },
  { ref: "", k: "chipant", x: 1, y: 6, w: 3, h: 8 },
];

// Top view at (ox, oy), s px per mm, turned 180 degrees so the radio (at x = 0) faces the sheet's middle.
function view(ox, oy, s) {
  const pt = (x, y) => [ox + (BOARD.w - x) * s, oy + (BOARD.h - y) * s];
  const box = ({ x, y, w, h }) => ({ x: ox + (BOARD.w - x - w) * s, y: oy + (BOARD.h - y - h) * s, w: w * s, h: h * s });
  return { s, pt, box, center: (part) => { const b = box(part); return [b.x + b.w / 2, b.y + b.h / 2]; } };
}

function boardTop(parts, v) {
  const { ink, ink2, sheet } = BP;
  const b = v.box({ x: 0, y: 0, w: BOARD.w, h: BOARD.h });
  let o = box2(b.x, b.y, b.w, b.h, ink, sheet, ip(3 * v.s));
  for (const part of parts.filter((q) => q.k === "card")) { const q = v.box(part); o += box1(q.x, q.y, q.w, q.h, ink, sheet); }
  for (const part of parts.filter((q) => q.side !== "bot")) {
    const q = v.box(part);
    if (part.k === "pcbant") {
      // PCB trace antenna: a meander inside the part box
      const pts = [];
      for (let i = 0; i <= 5; i++) {
        const y = part.y + (part.h * i) / 5;
        pts.push([i % 2 ? part.x + part.w : part.x, y]);
        if (i < 5) pts.push([i % 2 ? part.x + part.w : part.x, y + part.h / 5]);
      }
      o += path(`M${pts.map(([x, y]) => v.pt(x, y).map(r2).join(" ")).join("L")}`, ink);
      continue;
    }
    o += box1(q.x, q.y, q.w, q.h, ink, sheet);
    if (part.k === "hdr") {
      const r = Math.max(0.8, 0.32 * v.s);
      for (let i = 0; i < 20; i++) for (let j = 0; j < 2; j++) {
        const [cx, cy] = v.pt(8.37 + 2.54 * i, 2.23 + 2.54 * j);
        o += i === 0 && j === 0 ? `<rect x="${r2(cx - r)}" y="${r2(cy - r)}" width="${r2(2 * r)}" height="${r2(2 * r)}" fill="${ink2}"/>` : `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${ink2}"/>`;
      }
    }
    if (part.k === "soc") o += box1(q.x + 0.12 * q.w, q.y + 0.12 * q.h, 0.76 * q.w, 0.76 * q.h, ink);
    if (part.k === "usb" || part.k === "eth") o += vline(v.box({ x: BOARD.w + 0.5, y: 0, w: 0.01, h: 0 }).x, ip(q.y) + 1, ip(q.y + q.h) - 1, ink);
    if (part.k === "ffc") o += vline(v.box({ x: part.x + part.w * 0.55, y: 0, w: 0.01, h: 0 }).x, ip(q.y) + 1, ip(q.y + q.h) - 1, ink);
  }
  for (const part of parts.filter((q) => q.side === "bot" && q.k !== "card")) { const q = v.box(part); o += box1(q.x, q.y, q.w, q.h, ink2, "none", DASH_HIDDEN); }
  const hr = 1.35 * v.s;
  for (const [hx, hy] of BOARD.holes) {
    const [cx, cy] = v.pt(hx, hy);
    o += circle(cx, cy, hr, ink, sheet) + line(cx - hr - 3, cy, cx + hr + 3, cy, ink2) + line(cx, cy - hr - 3, cx, cy + hr + 3, ink2);
  }
  for (const part of parts.filter((q) => q.ref && !q.nl)) {
    const [cx, cy] = part.lp ? v.pt(...part.lp) : v.center(part);
    o += bpText(cx, cy + 4, part.ref, { anchor: "middle", fill: part.side === "bot" ? ink2 : ink });
  }
  return o;
}

function dimH(x1, x2, yFeat, yd, label) {
  const d = yd > yFeat ? 1 : -1;
  const [X1, X2, Y] = [hp(x1), hp(x2), hp(yd)];
  return vline(x1, yFeat + 2 * d, yd + 4 * d, BP.ink2) + vline(x2, yFeat + 2 * d, yd + 4 * d, BP.ink2) + line(X1, Y, X2, Y, BP.ink2) + arrow(X1, Y, Math.PI, BP.ink2) + arrow(X2, Y, 0, BP.ink2) + bpText((X1 + X2) / 2, Y - 4, label, { anchor: "middle", fill: BP.white });
}
function dimV(y1, y2, xFeat, xd, label) {
  const d = xd > xFeat ? 1 : -1;
  const [Y1, Y2, X] = [hp(y1), hp(y2), hp(xd)];
  return hline(xFeat + 2 * d, xd + 4 * d, y1, BP.ink2) + hline(xFeat + 2 * d, xd + 4 * d, y2, BP.ink2) + line(X, Y1, X, Y2, BP.ink2) + arrow(X, Y1, -Math.PI / 2, BP.ink2) + arrow(X, Y2, Math.PI / 2, BP.ink2) + bpText(X - 4, (Y1 + Y2) / 2, label, { anchor: "middle", rot: -90, fill: BP.white });
}
// Antenna symbol (IEC 60617): stem from (x, y) towards dir (-1 up, +1 down), open triangle at the far end; 24 px long.
function antenna(x, y, dir) {
  const [X, a, b] = [hp(x), y + dir * 10, y + dir * 24];
  return line(X, y, X, b, BP.ink) + path(`M${X - 8} ${b}L${X} ${a}L${X + 8} ${b}Z`, BP.ink);
}
// First-angle projection symbol (ISO 128): end view circles, then the truncated cone.
const projectionSymbol = (x, y) =>
  circle(x + 6.5, y + 6, 6.5, BP.ink) + circle(x + 6.5, y + 6, 3.5, BP.ink) + line(x - 2.5, y + 6, x + 15.5, y + 6, BP.ink, 1, DASH_CENTRE) +
  path(`M${x + 18} ${y + 2.5}L${x + 34} ${y - 0.5}L${x + 34} ${y + 12.5}L${x + 18} ${y + 9.5}Z`, BP.ink);

const TRIAL_MBPS = [0, 1, 2, 4, 6, 8, 10, 12, 15]; // orion_bench encoder targets, one trial each
const TRIAL_SPEC = [
  ["CONTROL", "TwistStamped at 50 Hz"],
  ["VIDEO", "synthetic H.264, ffmpeg"],
  ["MEASURED", "latency: mean, median, p95,"],
  ["", "p99, max, std; seq gaps; CPU"],
  ["CLOCKS", "Chrony, offset checked first"],
  ["STARTED BY", "orion-run_trial over SSH"],
  ["DDS", "CycloneDDS over UDP"],
  ["IMAGES", "one Nix flake, NixOS aarch64"],
  ["", "nixosConfigurations.drone"],
  ["", "nixosConfigurations.ground"],
];

/**
 * Orion Mesh, full width (798 x 440): the testbed as a cyanotype blueprint sheet. Left, both boards in
 * top view; middle, each radio's network stack, the two joined by one Wi-Fi channel; right, the trial
 * schedule; bottom, the title strip. Facts are from the repository's README and orion_bench.
 */
export function orionTestbed(w, h) {
  const { sheet, mid, ink, ink2, white } = BP;
  let o = `<rect width="${w}" height="${h}" fill="${sheet}"/>${box1(7, 7, w - 14, h - 14, ink2)}${box2(14, 14, w - 28, h - 28, ink)}`;

  const vd = view(64, 50, 2.4), vg = view(64, 226, 2.4);
  o += boardTop(PI4, vd) + boardTop(PI3, vg);
  const full = { x: 0, y: 0, w: BOARD.w, h: BOARD.h };
  const [db, gb] = [vd.box(full), vg.box(full)];
  o += dimH(db.x, db.x + db.w - 1, db.y + db.h + 1, 202, "85.0");
  o += dimV(db.y, db.y + db.h - 1, db.x - 10, 38, "56.0") + dimV(gb.y, gb.y + gb.h - 1, gb.x - 10, 38, "56.0");
  const title = (x, y, name, chip) => `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${TYPE.body}" font-weight="600" fill="${white}">${escapeXml(name)}<tspan dx="10" font-family="${COND}" font-size="${TYPE.label}" font-weight="500" fill="${ink}">${escapeXml(chip)}</tspan></text>`;
  o += title(db.x, 36, "DRONE  RASPBERRY PI 4", "BCM2711, 4x Cortex-A72") + title(gb.x, 382, "GROUND  RASPBERRY PI 3", "BCM2837, 4x Cortex-A53");

  // Middle column: the protocol stacks, drone on top (data flows down), ground below (data flows up).
  const [x0, x1, rh] = [312, 532, 22];
  const half = (x1 - x0 - 6) / 2;
  const layer = (x, y, bw, name, note) => box1(x, y, bw, rh, ink, sheet) + bpText(x + 8, y + 15, name, { fill: white }) + bpText(x + bw - 8, y + 15, note, { anchor: "end" });
  let y = 50;
  o += layer(x0, y, half, "ROS 2", "50 Hz") + layer(x0 + half + 6, y, half, "ffmpeg", "H.264");
  y += rh + 6;
  o += layer(x0, y, half, "CycloneDDS", "UDP") + vline(x0 + half + 6 + half / 2, y - 6, y + rh + 6, ink) + bpText(x0 + half + 6 + half / 2 + 6, y + 15, "0 to 15 Mbps");
  y += rh + 6;
  o += layer(x0, y, x1 - x0, "bat0", "BATMAN-adv, layer 2");
  y += rh + 6;
  const wlanD = y;
  o += layer(x0, y, x1 - x0, "wlan0", "IBSS (ad-hoc), CYW43455");
  const ax = (x0 + x1) / 2;
  o += antenna(ax, y + rh, 1);
  const aTopD = y + rh + 24;
  let g = 362 - rh;
  o += layer(x0, g, half, "latency", "p95, p99") + layer(x0 + half + 6, g, half, "seq gaps", "CPU");
  g -= rh + 6;
  o += layer(x0, g, half, "CycloneDDS", "UDP") + layer(x0 + half + 6, g, half, "SSH", "trial start");
  g -= rh + 6;
  o += layer(x0, g, x1 - x0, "bat0", "BATMAN-adv, layer 2");
  g -= rh + 6;
  const wlanG = g;
  o += layer(x0, g, x1 - x0, "wlan0", "IBSS (ad-hoc), BCM43438") + antenna(ax, g, -1);
  // The air gap: one Wi-Fi channel carrying both flows.
  const [za, zb] = [aTopD + 6, g - 24 - 6];
  const zig = Array.from({ length: 7 }, (_, i) => [ax + (i > 0 && i < 6 ? (i % 2 ? 6 : -6) : 0), za + ((zb - za) * i) / 6]);
  o += `<path d="M${zig.map((q) => q.map(r2).join(" ")).join("L")}" fill="none" stroke="${white}" stroke-width="1"/>` + arrow(ax, zb + 1, Math.PI / 2, white, 7, 3) + arrow(ax, za - 1, -Math.PI / 2, white, 7, 3);
  const my = (za + zb) / 2;
  o += bpText(ax - 18, my - 4, "TwistStamped and", { anchor: "end" }) + bpText(ax - 18, my + 12, "H.264 to ground", { anchor: "end" });
  o += bpText(ax + 18, my - 4, "one IBSS cell,", { fill: white }) + bpText(ax + 18, my + 12, "one Wi-Fi channel", { fill: white });
  // Leaders from each board's radio to its wlan0 layer.
  for (const [v, parts, wy] of [[vd, PI4, wlanD], [vg, PI3, wlanG]]) {
    const r = v.box(parts.find((q) => q.role === "wifi"));
    const [sx, sy] = [r.x + r.w, hp(r.y + r.h / 2)];
    o += `<circle cx="${r2(sx)}" cy="${sy}" r="2" fill="${white}"/>` + path(`M${r2(sx)} ${sy}H${hp(292)}V${hp(wy + rh / 2)}H${x0}`, ink2, "none", DASH_HIDDEN);
  }

  // Right column: the trial schedule.
  const [rx0, rx1] = [552, w - 26];
  o += bpText(rx0, 60, "TRIAL SCHEDULE", { sans: true, size: TYPE.body, fill: white });
  o += bpText(rx0, 82, "ENCODER TARGET, Mbps (ONE TRIAL EACH)", { size: 10, fill: ink2 });
  const cw = (rx1 - rx0) / TRIAL_MBPS.length;
  o += box1(rx0, 88, rx1 - rx0 + 1, 24, ink);
  TRIAL_MBPS.forEach((mbps, i) => {
    if (i) o += vline(rx0 + i * cw, 88, 112, ink2);
    o += bpText(rx0 + (i + 0.5) * cw, 104, String(mbps), { anchor: "middle", fill: white, attrs: ` data-mbps="${mbps}"` });
  });
  TRIAL_SPEC.forEach(([key, value], i) => {
    const yy = 128 + i * 22;
    if (key && i) o += hline(rx0, rx1, yy - 15, mid);
    if (key) o += bpText(rx0, yy, key, { size: 10, fill: ink2 });
    o += bpText(rx0 + 62, yy, value, { fill: white });
  });

  // Title strip.
  const [ty0, ty1] = [h - 48, h - 14];
  o += hline(14, w - 14, ty0, ink, 2);
  [[14, "TITLE", "ORION MESH, RF LINK BETWEEN TWO NODES"], [330, "DRAWN", "Z. STUBBS"], [430, "DWG NO", "OM-002"], [510, "REV", "A"], [556, "SCALE", "1:1"], [610, "UNITS", "mm"], [664, "SHEET", "1 / 1"]].forEach(([x, cap, value], i) => {
    if (i) o += vline(x, ty0 + 1, ty1 - 1, ink2);
    o += bpText(x + 6, ty0 + 12, cap, { size: 10, fill: ink2 }) + bpText(x + 6, ty0 + 27, value, { fill: white, ...(i ? {} : { sans: true, size: TYPE.body }) });
  });
  o += vline(722, ty0 + 1, ty1 - 1, ink2) + projectionSymbol(733, ty0 + 10);
  return fixed(o);
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
