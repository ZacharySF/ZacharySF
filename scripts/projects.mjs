// Profile projects in the order the README lists them, grouped by category. The README carries each
// project's title link and description; the generated image is only its pictures and captions.
// Edit here, then run `node scripts/build-assets.mjs` to regenerate assets/projects/*.svg.
//
// Each project shows either three pictures (a lead and two thumbnails) or one full-width picture.
// A picture is a file in assets/shots, saved at twice its slot size (lead 1064 x 664, thumbnail
// 500 x 296, full width 1596 x twice `height`), or a `diagram` drawn by scripts/diagrams.mjs.

// Tech stack: [area, items], in list order; set as type under the hero by stack.mjs.
export const stack = [
  ["Languages", ["C++", "C", "Rust", "Python", "TypeScript", "Swift"]],
  ["Embedded", ["ESP32", "FreeRTOS", "PlatformIO", "Raspberry Pi"]],
  ["Systems", ["Linux", "NixOS", "bubblewrap", "dinit", "Docker"]],
  ["Networks", ["ROS 2", "CycloneDDS", "BATMAN-adv", "UDP"]],
  ["Apps", ["Svelte", "Tone.js", "Cloudflare", "Tauri"]],
];

export const categories = [
  {
    title: "Operating systems",
    projects: [
      {
        slug: "cleanroom",
        title: "cleanroom",
        repo: "nunera/cleanroom",
        shots: [
          { file: "cleanroom-controlroom.jpg", caption: "Control room during a ransomware incident" },
          { file: "cleanroom-system.jpg", caption: "Sealed roots, receipt chain" },
          { file: "cleanroom-overview.jpg", caption: "What needs a signature" },
        ],
      },
      {
        slug: "misaos",
        title: "MisaOS",
        repo: "ZacharySF/misaos",
        shots: [
          { file: "misaos-boot.jpg", caption: "MisaOS starting a machine: it checks the system, then starts each service" },
          { file: "misaos-xclock.jpg", caption: "A Debian app on a NixOS desktop" },
          { file: "misaos-refused.jpg", caption: "An altered system is refused" },
        ],
      },
      {
        slug: "nixos-config",
        title: "nixos-config",
        repo: "ZacharySF/nixos-config",
        shots: [{ diagram: "nixosFlake", height: 296, caption: "The flake as a floorplan: each host output is routed to its own drive through a UUID check" }],
      },
    ],
  },
  {
    title: "Hardware and networking",
    projects: [
      {
        slug: "determine",
        title: "Determine",
        repo: "nunera/Determine",
        shots: [
          { file: "determine-glasses.jpg", caption: "The prototype glasses at HackTX 26" },
          { file: "determine-world.jpg", caption: "Simulator with the real engine" },
          { file: "determine-site.jpg", caption: "Home page of the web app" },
        ],
      },
      {
        slug: "orion-mesh",
        title: "Orion Mesh",
        repo: "ZacharySF/Orion-Mesh",
        shots: [{ diagram: "orionTestbed", height: 440, caption: "Both boards in the KiCad PCB editor, with the bat0 mesh link drawn between their radios" }],
      },
    ],
  },
  {
    title: "Apps and tools",
    projects: [
      {
        slug: "ginseng",
        title: "Ginseng",
        repo: "nunera/ginseng",
        shots: [
          { file: "ginseng-risk.jpg", caption: "Shortfall risk across cash and time, from 2,048 simulated futures" },
          { file: "ginseng-frontier.jpg", caption: "Frontier of 148 portfolios" },
          { file: "ginseng-tui.jpg", caption: "Terminal research workspace" },
        ],
      },
      {
        slug: "ichor",
        title: "Ichor",
        repo: "ZacharySF/ichor",
        shots: [
          { file: "ichor-synth.jpg", caption: "Two oscillators, filter, envelope and keyboard" },
          { file: "ichor-modulation.jpg", caption: "Modulation routing" },
          { file: "ichor-strudel.jpg", caption: "Live coding with Strudel" },
        ],
      },
      {
        slug: "rika",
        title: "rika!",
        repo: "ZacharySF/kitty",
        shots: [
          { file: "rika-brain.jpg", caption: "Brain view: the whole workspace as one 3D map" },
          { file: "rika-welcome.jpg", caption: "Welcome card" },
          { file: "rika-home.jpg", caption: "Home dashboard" },
        ],
      },
    ],
  },
];
