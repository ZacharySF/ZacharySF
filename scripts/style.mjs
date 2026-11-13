// Design tokens shared by every generated image on the profile (see the technical-svg-craft skill).
// Palette "Silicon ice" mapped onto roles; typeface IBM Plex Sans (+ Condensed for part designators).
//   bg / surface / structure / keyline     neutral subject (silicon, PCB, metal)
//   text / text2 / text3                   primary, secondary, tertiary (all >= 4.5:1 on bg)
//   ramp (4 steps)                         data only: lit SMs, lit PHY teeth, contribution bars
//   accent                                 one highlight (role tags, active layer)
//   silver / cap                           physical materials
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const PALETTE = {
  bg: "#0d1117", // GitHub's dark page colour, so panels sit flush on the profile
  surface: "#141b27",
  well: "#19212f",
  structure: "#232d40",
  keyline: "#30363d", // panel edge: >= 1.5:1 on both GitHub page backgrounds
  text: "#f1f5ff",
  text2: "#cbd5e6",
  text3: "#8796ad",
  ramp: ["#123a6b", "#1c64b8", "#4dabf7", "#d0ebff"],
  accent: "#4dabf7",
  silver: "#8b95a3",
  silverLight: "#c8ced6",
  silverDark: "#4b5563",
  cap: "#9aa3ae", // decoupling caps on the substrate, a shade of silver
};

// Type scale: at most four sizes per image; nothing below 12 px at 1x.
export const TYPE = { label: 12, body: 14, title: 20, display: 32 };
export const RADIUS = { panel: 6, part: 2 };
export const MARGIN = 24;
export const README_W = 846; // GitHub profile README column, desktop

// IBM Plex Sans (OFL, assets/fonts), subset to ASCII plus a few symbols, embedded as data URIs
// because an SVG shown through <img> cannot fetch fonts.
const FACES = {
  sans500: ["PlexSans", 500, "ibm-plex-sans-500.woff"],
  sans600: ["PlexSans", 600, "ibm-plex-sans-600.woff"],
  cond500: ["PlexCond", 500, "ibm-plex-sans-condensed-500.woff"],
};
export const SANS = "'PlexSans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
export const COND = "'PlexCond', 'PlexSans', 'Arial Narrow', sans-serif";

/** @font-face rules for the named faces (default: all three), read from <root>/assets/fonts. */
export function fontCss(root, faces = Object.keys(FACES)) {
  return faces
    .map((key) => {
      const [family, weight, file] = FACES[key];
      const b64 = readFileSync(join(root, "assets/fonts", file)).toString("base64");
      return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff;base64,${b64}) format('woff');}`;
    })
    .join("");
}

/** The opaque panel every image sits on: reads as deliberate on both light and dark GitHub. */
export const panel = (w, h) =>
  `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${RADIUS.panel}" fill="${PALETTE.bg}" stroke="${PALETTE.keyline}"/>`;

export const f1 = (n) => (Math.round(n * 10) / 10).toString();
