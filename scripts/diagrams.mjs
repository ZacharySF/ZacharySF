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

// Orion Mesh is drawn as the KiCad PCB editor with both boards open as footprints in KiCad's default
// layer colours: copper pads, courtyards, silkscreen designators, edge cuts and the keep-out under the
// drone's trace antenna. The drone (turned 180 degrees) and the ground board face each other radio to
// radio, and the bat0 net is highlighted as one ratsnest line between them. The side panel lists the
// layers and the net classes of a trial, the bottom panel the selected net. The window is drawn
// hardware and keeps its colours on the light page. Board outline and mounting holes are from the
// Raspberry Pi mechanical drawings; part placements follow them closely enough to read.
const KICAD = {
  bg: "#001023", fcu: "#c83434", bcu: "#4d7fc4", fsilk: "#f2eda1", bsilk: "#e8b2a7", fcrt: "#ff26e2", bcrt: "#26e9ff",
  fab: "#afafaf", edge: "#d0d2cd", pth: "#e3b72e", hole: "#000814", rats: "#f4f4f4", grid: "#16294a",
};
const r2 = (v) => Math.round(v * 100) / 100;
const hp = (v) => Math.round(v - 0.5) + 0.5; // centre of a 1 px line
const ip = Math.round;
const kText = (x, y, value, { sans = false, fill = p.text2, anchor = "start", rot = 0, attrs = "" } = {}) =>
  `<text x="${r2(x)}" y="${r2(y)}" font-family="${sans ? SANS : COND}" font-size="${sans ? TYPE.body : TYPE.label}" font-weight="${sans ? 600 : 500}" fill="${fill}"${anchor === "start" ? "" : ` text-anchor="${anchor}"`}${rot ? ` transform="rotate(${rot} ${r2(x)} ${r2(y)})"` : ""}${attrs}>${escapeXml(value)}</text>`;
const line = (x1, y1, x2, y2, stroke, extra = "") => `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${stroke}" stroke-width="1"${extra}/>`;
const hline = (x1, x2, y, stroke) => line(x1, hp(y), x2, hp(y), stroke);
const vline = (x, y1, y2, stroke) => line(hp(x), y1, hp(x), y2, stroke);
const fillRect = (x, y, w, h, fill) => `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${fill}"/>`;
const dot = (cx, cy, r, fill) => `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}"/>`;
// Pixel box [x, x + w) x [y, y + h) with a crisp 1 px stroke inside it.
function box1(x, y, w, h, stroke, extra = "") {
  const [x0, y0, x1, y1] = [ip(x), ip(y), ip(x + w), ip(y + h)];
  return `<rect x="${x0 + 0.5}" y="${y0 + 0.5}" width="${Math.max(0, x1 - x0 - 1)}" height="${Math.max(0, y1 - y0 - 1)}" fill="none" stroke="${stroke}"${extra}/>`;
}
// Filled arrowhead with its tip at (x, y), pointing along angle a.
function arrow(x, y, a, fill, len = 8, half = 2.5) {
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const [bx, by] = [x - c * len, y - s * len];
  return `<path d="M${r2(x)} ${r2(y)}L${r2(bx - s * half)} ${r2(by + c * half)}L${r2(bx + s * half)} ${r2(by - c * half)}Z" fill="${fill}"/>`;
}
const DASH_HIDDEN = ` stroke-dasharray="4 3"`;

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

// Top view at (ox, oy), s px per mm; rot turns it 180 degrees so the drone's radio (at x = 0) faces the ground board.
function view(ox, oy, s, rot) {
  const pt = (x, y) => (rot ? [ox + (BOARD.w - x) * s, oy + (BOARD.h - y) * s] : [ox + x * s, oy + y * s]);
  const box = ({ x, y, w, h }) => (rot ? { x: ox + (BOARD.w - x - w) * s, y: oy + (BOARD.h - y - h) * s, w: w * s, h: h * s } : { x: ox + x * s, y: oy + y * s, w: w * s, h: h * s });
  return { ox, oy, s, rot, pt, box, center: (part) => { const b = box(part); return [b.x + b.w / 2, b.y + b.h / 2]; } };
}

// One board as its KiCad footprints: B.Cu ground pour, courtyards, silkscreen, pads, holes, edge cuts, designators.
function pcbFootprints(parts, v, name) {
  const K = KICAD;
  const pad = (x, y, r, fill = K.pth, hole = 0.45) => { const [cx, cy] = v.pt(x, y); return dot(cx, cy, r * v.s, fill) + (hole ? dot(cx, cy, hole * v.s, K.hole) : ""); };
  const smd = (x, y, w, h, fill = K.fcu) => { const b = v.box({ x, y, w, h }); return fillRect(b.x, b.y, Math.max(1, b.w), Math.max(1, b.h), fill); };
  const outline = (part, stroke, extra = "") => { const b = v.box(part); return box1(b.x, b.y, b.w, b.h, stroke, extra); };
  const onBoard = ({ x, y, w, h }) => { const [x0, y0] = [Math.max(x, 0), Math.max(y, 0)]; return { x: x0, y: y0, w: Math.min(x + w, BOARD.w) - x0, h: Math.min(y + h, BOARD.h) - y0 }; };
  const b = v.box({ x: 0, y: 0, w: BOARD.w, h: BOARD.h });
  const zone = v.box({ x: 0.5, y: 0.5, w: BOARD.w - 1, h: BOARD.h - 1 });
  let o = `<rect x="${r2(zone.x)}" y="${r2(zone.y)}" width="${r2(zone.w)}" height="${r2(zone.h)}" rx="${r2(2.5 * v.s)}" fill="${K.bcu}" fill-opacity="0.16"/>`;
  for (const part of parts) {
    const { k, x, y, w, h } = part;
    if (k === "card") { o += outline(part, K.fab); continue; }
    if (k === "barrel") continue;
    const bot = part.side === "bot";
    if (k !== "pcbant") o += outline({ x: x - 0.5, y: y - 0.5, w: w + 1, h: h + 1 }, bot ? K.bcrt : K.fcrt);
    if (!["soc", "ic", "pcbant", "chipant", "shield"].includes(k)) o += outline(onBoard(part), bot ? K.bsilk : K.fsilk);
    if (k === "hdr") {
      for (let i = 0; i < 20; i++) for (let j = 0; j < 2; j++) {
        const [px, py] = [8.37 + 2.54 * i, 2.23 + 2.54 * j];
        o += i || j ? pad(px, py, 0.85) : smd(px - 0.85, py - 0.85, 1.7, 1.7, K.pth) + dot(...v.pt(px, py), 0.45 * v.s, K.hole);
      }
    } else if (k === "usb") {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) o += pad(x + 3 + j * 2.5, y + 3.3 + i * 2.2, 0.6, K.pth, 0.3);
      o += pad(x + 9, y + 0.9, 1.0) + pad(x + 9, y + h - 0.9, 1.0);
    } else if (k === "eth") {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) o += pad(x + 3 + j * 2.2, y + 3.5 + i * 2.6 + j * 1.3, 0.6, K.pth, 0.3);
      o += pad(x + 10.5, y + 2.6, 1.6, K.hole, 0) + pad(x + 10.5, y + h - 2.6, 1.6, K.hole, 0);
      o += pad(x + 14, y + 0.9, 1.0) + pad(x + 14, y + h - 0.9, 1.0);
    } else if (k === "usbc" || k === "hdmi" || k === "usbm") {
      const m = k === "hdmi" && w > 10 ? 12 : 8;
      for (let i = 0; i < m; i++) o += smd(x + 1 + ((w - 2.4) * i) / (m - 1), y + 0.4, 0.4, 1.4);
      o += pad(x + 0.4, y + 3, 0.7, K.pth, 0.35) + pad(x + w - 0.4, y + 3, 0.7, K.pth, 0.35);
    } else if (k === "audio") {
      o += smd(x - 0.6, y + 1.5, 1.4, 1.8) + smd(x + w - 0.8, y + 1.5, 1.4, 1.8) + smd(x + w - 0.8, y + 6.5, 1.4, 1.8);
      o += pad(x + w / 2, y + 3, 0.6, K.hole, 0) + pad(x + w / 2, y + 9, 0.6, K.hole, 0);
    } else if (k === "ffc") {
      for (let i = 0; i < 15; i++) o += smd(x + 0.3, y + 2 + ((h - 4.4) * i) / 14, 1.2, 0.4);
    } else if (k === "soc" || (k === "ic" && w >= 11)) {
      // BGA: a grid of 2 px balls in one path
      const m = k === "soc" ? 11 : 8, pitch = (w - 2.5) / (m - 1);
      let d = "";
      for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
        const [cx, cy] = v.pt(x + 1.25 + i * pitch, y + 1.25 + j * pitch);
        d += `M${r2(cx - 1)} ${r2(cy - 1)}h2v2h-2z`;
      }
      o += `<path d="${d}" fill="${bot ? K.bcu : K.fcu}"/>` + outline(part, bot ? K.bsilk : K.fsilk);
    } else if (k === "ic" || k === "shield") {
      const m = k === "shield" ? 6 : 4;
      for (let i = 0; i < m; i++) {
        const f = (i + 0.5) / m;
        o += smd(x + f * w - 0.3, y - 0.2, 0.6, 1.0) + smd(x + f * w - 0.3, y + h - 0.8, 0.6, 1.0);
        o += smd(x - 0.2, y + f * h - 0.3, 1.0, 0.6) + smd(x + w - 0.8, y + f * h - 0.3, 1.0, 0.6);
      }
      o += outline(part, K.fsilk);
    } else if (k === "pcbant") {
      // keep-out rule area under the trace antenna (hatched), then the copper meander
      const ka = v.box({ x: 0.3, y: 5.2, w: 5.6, h: 10.6 });
      let hatch = "";
      for (let t = -ka.h; t < ka.w; t += 5) hatch += `M${r2(ka.x + t)} ${r2(ka.y + ka.h)}l${r2(ka.h)} ${r2(-ka.h)}`;
      const id = `orion-keepout-${name}`;
      o += `<clipPath id="${id}"><rect x="${r2(ka.x)}" y="${r2(ka.y)}" width="${r2(ka.w)}" height="${r2(ka.h)}"/></clipPath>`;
      o += `<g clip-path="url(#${id})" stroke-opacity="0.45"><path d="${hatch}" fill="none" stroke="${K.fcu}" stroke-width="1"/></g>` + box1(ka.x, ka.y, ka.w, ka.h, K.fcu, DASH_HIDDEN);
      const pts = [];
      for (let i = 0; i <= 5; i++) {
        const yy = y + (h * i) / 5;
        pts.push([i % 2 ? x + w : x, yy]);
        if (i < 5) pts.push([i % 2 ? x + w : x, yy + h / 5]);
      }
      o += `<path d="M${pts.map(([px, py]) => v.pt(px, py).map(r2).join(" ")).join("L")}" fill="none" stroke="${K.fcu}" stroke-width="1.5"/>`;
    } else if (k === "chipant") {
      o += smd(x, y, w, 1.6) + smd(x, y + h - 1.6, w, 1.6) + outline(part, K.fab);
    } else if (k === "sd") {
      for (let i = 0; i < 8; i++) o += smd(x + 11.5, y + 2.5 + i * 1.1, 1.6, 0.6, K.bcu);
      o += smd(x + 1, y - 0.4, 1.6, 1.2, K.bcu) + smd(x + 1, y + h - 0.8, 1.6, 1.2, K.bcu);
    }
  }
  // mounting holes: 6 mm pad, 2.7 mm drill
  for (const [hx, hy] of BOARD.holes) o += pad(hx, hy, 3.0, K.pth, 1.35);
  o += `<rect x="${hp(b.x)}" y="${hp(b.y)}" width="${ip(b.w) - 1}" height="${ip(b.h) - 1}" rx="${r2(3 * v.s)}" fill="none" stroke="${K.edge}"/>`;
  // designators on F.Silkscreen / B.Silkscreen; BGA ones get a halo so they read over the balls
  for (const part of parts.filter((q) => q.ref && !q.nl)) {
    const [cx, cy] = part.lp ? v.pt(...part.lp) : part.k === "usb" || part.k === "eth" ? v.pt(part.x + part.w * 0.62, part.y + part.h / 2) : v.center(part);
    const bga = part.k === "soc" || (part.k === "ic" && part.w >= 11);
    o += kText(cx, cy + 4, part.ref, { anchor: "middle", fill: part.side === "bot" ? K.bsilk : K.fsilk, attrs: bga ? ` stroke="${K.bg}" stroke-width="4" paint-order="stroke"` : "" });
  }
  return o;
}

const ORION_LAYERS = [
  [KICAD.fcu, "F.Cu", "front copper"], [KICAD.bcu, "B.Cu", "back copper"], [KICAD.pth, "PTH pads", "header, jacks"],
  [KICAD.fsilk, "F.Silkscreen", "designators"], [KICAD.bsilk, "B.Silkscreen", "microSD J1"],
  [KICAD.fcrt, "F.Courtyard", "top parts"], [KICAD.bcrt, "B.Courtyard", "bottom parts"],
  [KICAD.edge, "Edge.Cuts", "85.0 x 56.0"], [KICAD.rats, "Ratsnest", "bat0 link"],
];
const ORION_NET_CLASSES = [["Control", "TwistStamped, 50 Hz"], ["Video", "H.264, 0 to 15 Mbps"], ["Clock", "Chrony, offset checked"], ["Trial", "orion-run_trial, SSH"]];
// Selected-net fields; x is where each column starts (column widths fitted to IBM Plex Sans Condensed at 12 px).
const ORION_NET = [
  [12, "Net", "bat0"], [54.8, "Net class", "BATMAN-adv, layer 2"], [180.95, "Members", "wlan0 (U2), wlan0 (U2)"],
  [315.18, "Cell", "IBSS, one Wi-Fi channel"], [454.88, "Transport", "CycloneDDS, UDP"], [563.03, "Ground records", "latency p95/p99, gaps"],
];

/**
 * Orion Mesh, full width (798 x 440): the testbed as the KiCad PCB editor. Both boards as footprints,
 * radios facing each other, the bat0 net drawn as one ratsnest line between them; layers and net classes
 * on the right, the selected net along the bottom. Facts are from the repository's README and orion_bench.
 */
export function orionTestbed(w, h) {
  const K = KICAD;
  const cv = { y0: 26, x1: 600, y1: 370 }; // board canvas
  const s = 2.8;
  const vd = view(28, 112, s, true), vg = view(344, 112, s, false);
  let o = `<rect width="${w}" height="${h}" fill="${p.surface}"/>` + fillRect(0, cv.y0, cv.x1, cv.y1 - cv.y0, K.bg);
  // 5 mm grid dots anchored to the ground board's origin
  const g = 5 * s;
  let grid = "";
  for (let x = vg.ox - g * Math.floor((vg.ox - 8) / g); x < cv.x1 - 4; x += g)
    for (let y = vg.oy - g * Math.floor((vg.oy - cv.y0 - 8) / g); y < cv.y1 - 4; y += g) grid += `M${ip(x)} ${ip(y)}h1v1h-1z`;
  o += `<path d="${grid}" fill="${K.grid}"/>`;
  o += pcbFootprints(PI4, vd, "drone") + pcbFootprints(PI3, vg, "ground");

  // bat0: both radios outlined, one airwire between their pads
  const [ud, ug] = [vd.box(PI4.find((q) => q.role === "wifi")), vg.box(PI3.find((q) => q.role === "wifi"))];
  const [a, b] = [[ud.x + ud.w, ud.y + ud.h / 2], [ug.x, ug.y + ug.h / 2]];
  o += box1(ud.x - 2, ud.y - 2, ud.w + 4, ud.h + 4, K.rats, ` data-radio="drone"`) + box1(ug.x - 2, ug.y - 2, ug.w + 4, ug.h + 4, K.rats, ` data-radio="ground"`);
  o += line(...a, ...b, K.rats, ` data-net="bat0"`);
  o += `<circle cx="${r2(a[0])}" cy="${r2(a[1])}" r="2.5" fill="${K.bg}" stroke="${K.rats}" stroke-width="1"/><circle cx="${r2(b[0])}" cy="${r2(b[1])}" r="2.5" fill="${K.bg}" stroke="${K.rats}" stroke-width="1"/>`;
  o += kText((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 6, "bat0", { anchor: "middle", fill: K.rats, rot: r2((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI) });
  // F.Fab captions and the 85 mm dimension on User.Drawings
  for (const [v, l1, l2, cfg] of [[vd, "drone: Raspberry Pi 4, BCM2711", "U2 CYW43455 on wlan0", "drone"], [vg, "ground: Raspberry Pi 3, BCM2837", "U2 BCM43438 on wlan0", "ground"]]) {
    o += kText(v.ox - 8, v.oy - 26, l1, { fill: K.fab }) + kText(v.ox - 8, v.oy - 10, l2, { fill: K.fab });
    o += kText(v.ox + 10, v.oy + BOARD.h * s + 26, `nixosConfigurations.${cfg}`, { fill: K.fab });
  }
  const gb = vg.box({ x: 0, y: 0, w: BOARD.w, h: BOARD.h });
  const [X1, X2, Y, yf] = [hp(gb.x), hp(gb.x + gb.w - 1), hp(gb.y + gb.h + 50), gb.y + gb.h + 3];
  o += vline(gb.x, yf + 2, Y + 4, K.fab) + vline(gb.x + gb.w - 1, yf + 2, Y + 4, K.fab) + line(X1, Y, X2, Y, K.fab) + arrow(X1, Y, Math.PI, K.fab) + arrow(X2, Y, 0, K.fab);
  o += kText((X1 + X2) / 2, Y - 4, "85.0 mm", { anchor: "middle", fill: K.fab });

  // window chrome
  o += fillRect(0, 0, w, cv.y0, p.surface) + hline(0, w, cv.y0 - 1, p.structure);
  o += kText(12, 17, "orion-mesh.kicad_pcb", { fill: p.text }) + kText(133.46, 17, "PCB Editor", { fill: p.text3 });
  o += kText(cv.x1 - 10, 17, "net highlight: bat0", { anchor: "end", fill: p.text3 });
  // appearance panel: layers, then net classes
  const [px0, px1] = [cv.x1, w];
  o += fillRect(px0, cv.y0, px1 - px0, cv.y1 - cv.y0, p.surface) + vline(px0, cv.y0, cv.y1, p.structure);
  o += kText(px0 + 12, cv.y0 + 20, "Layers", { sans: true, fill: p.text });
  ORION_LAYERS.forEach(([fill, name, note], i) => {
    const y = cv.y0 + 34 + i * 20;
    if (i === ORION_LAYERS.length - 1) o += fillRect(px0 + 1, y - 4, px1 - px0 - 1, 20, p.structure);
    o += fillRect(px0 + 12, y + 1, 10, 10, fill) + kText(px0 + 30, y + 10, name, { fill: p.text }) + kText(px1 - 12, y + 10, note, { anchor: "end", fill: p.text3 });
  });
  const ny = cv.y0 + 34 + ORION_LAYERS.length * 20 + 18;
  o += hline(px0, px1, ny - 12, p.structure) + kText(px0 + 12, ny + 6, "Net classes", { sans: true, fill: p.text });
  ORION_NET_CLASSES.forEach(([name, note], i) => { o += kText(px0 + 12, ny + 26 + i * 18, name) + kText(px1 - 12, ny + 26 + i * 18, note, { anchor: "end", fill: p.text3 }); });
  // message panel: the selected net
  const [my0, my1] = [cv.y1, 418];
  o += fillRect(0, my0, w, my1 - my0, p.surface) + hline(0, w, my0, p.structure);
  ORION_NET.forEach(([x, key, value], i) => {
    if (i) o += vline(x - 10, my0 + 8, my1 - 8, p.structure);
    o += kText(x, my0 + 20, key, { fill: p.text3 }) + kText(x, my0 + 38, value, { fill: p.text });
  });
  // status bar
  o += fillRect(0, my1, w, h - my1, p.bg) + hline(0, w, my1, p.structure);
  o += kText(12, h - 7, "X 85.0000  Y 56.0000", { fill: p.text3 }) + kText(170, h - 7, "grid 5.0000 mm", { fill: p.text3 });
  o += kText(w - 12, h - 7, "both SD images from one Nix flake  |  mm", { anchor: "end", fill: p.text3 });
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
