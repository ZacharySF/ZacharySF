// Profile projects grouped by layer, deepest (closest to hardware) first.
// Edit here, then run `node scripts/build-assets.mjs` to regenerate assets/projects/*.svg.
//
// Each project shows either three pictures (a lead and two thumbnails) or one full-width picture.
// A picture is a file in assets/shots, saved at twice its slot size (lead 1064 x 664, thumbnail
// 500 x 296, full width 1596 x twice `height`), or a `diagram` drawn by scripts/diagrams.mjs.

// Tech stack, shown beside the graphics card: [label, items].
export const stack = [
  ["LANGUAGES", "C++ · C · Rust · Python · TypeScript · Swift"],
  ["EMBEDDED", "ESP32 · FreeRTOS · PlatformIO · Raspberry Pi"],
  ["SYSTEMS", "Linux · NixOS · bubblewrap · dinit · Docker"],
  ["NETWORKS", "ROS 2 · CycloneDDS · BATMAN-adv · UDP"],
  ["APPS", "Svelte · Tone.js · Cloudflare · Tauri"],
];

export const layers = [
  {
    slug: "embedded",
    title: "Embedded systems & networks",
    level: "hardware",
    projects: [
      {
        slug: "determine",
        title: "Determine",
        repo: "nunera/Determine",
        url: "https://github.com/nunera/Determine",
        role: "Co-author",
        short: "Glasses that warn a cane user about obstacles at head height. A time-of-flight sensor and FreeRTOS firmware on the frame report distance over UDP; the phone answers with sound and a haptic pulse.",
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
        url: "https://github.com/ZacharySF/Orion-Mesh",
        role: "Research",
        short: "Two Raspberry Pis on NixOS, joined by a BATMAN-adv mesh, measure how much an H.264 stream on the same Wi-Fi channel delays 50 Hz ROS 2 control messages. Both SD images build from one flake.",
        shots: [{ diagram: "orionBoards", height: 312, caption: "The testbed: two boards and the radio link between them" }],
      },
    ],
  },
  {
    slug: "os",
    title: "Operating systems & isolation",
    level: "kernel",
    projects: [
      {
        slug: "cleanroom",
        title: "cleanroom",
        repo: "nunera/cleanroom",
        url: "https://github.com/nunera/cleanroom",
        role: "OS core",
        short: "An incident-response OS built at HackUTD 2026. Nemotron agents investigate inside sealed strata, the kernel keeps evidence read-only, and every action leaves a signed receipt.",
        shots: [
          { file: "cleanroom-controlroom.jpg", caption: "Control room during a ransomware incident" },
          { file: "cleanroom-system.jpg", caption: "Sealed roots, receipt chain" },
          { file: "cleanroom-overview.jpg", caption: "What needs a signature" },
        ],
      },
      {
        slug: "nixos-config",
        title: "nixos-config",
        repo: "ZacharySF/nixos-config",
        url: "https://github.com/ZacharySF/nixos-config",
        role: "Solo",
        short: "One flake for two installs of the same laptop, with Niri, Quickshell and home-manager built in a single step. A check before every switch compares disk UUIDs, so the wrong host cannot activate.",
        shots: [{ diagram: "nixosFlake", height: 296, caption: "The flake as a floorplan: each host output is routed to its own drive through a UUID check" }],
      },
      {
        slug: "misaos",
        title: "MisaOS",
        repo: "ZacharySF/misaos",
        url: "https://github.com/ZacharySF/misaos",
        role: "Co-author",
        short: "Runs apps from another Linux on a NixOS machine, each in a sealed root that sees only its own files and the folders a plan grants. Images are locked by digest, approved, verified and publisher-checked first.",
        shots: [
          { diagram: "misaView", caption: "What one imported app can see, and what it cannot" },
          { diagram: "misaChecks", caption: "Four checks before launch" },
          { diagram: "misaRoots", caption: "Debian and Void side by side" },
        ],
      },
    ],
  },
  {
    slug: "signals",
    title: "Signal processing & numerics",
    level: "algorithms",
    projects: [
      {
        slug: "ichor",
        title: "Ichor",
        repo: "ZacharySF/ichor",
        url: "https://github.com/ZacharySF/ichor",
        role: "Co-author",
        short: "A synthesizer that runs in the browser: FM, AM and Karplus-Strong voices, MIDI input, a Strudel live-coding panel, and sessions several people can play at once. Svelte 5, Tone.js, Cloudflare Workers.",
        shots: [
          { file: "ichor-synth.jpg", caption: "Two oscillators, filter, envelope and keyboard" },
          { file: "ichor-modulation.jpg", caption: "Modulation routing" },
          { file: "ichor-strudel.jpg", caption: "Live coding with Strudel" },
        ],
      },
      {
        slug: "ginseng",
        title: "Ginseng",
        repo: "nunera/ginseng",
        url: "https://github.com/nunera/ginseng",
        role: "Co-author",
        short: "A liquidity-risk engine. Monte Carlo runs stop once the estimate is precise enough, Sobol sampling cuts the noise, and the results open in a browser explorer or a terminal workspace.",
        shots: [
          { file: "ginseng-risk.jpg", caption: "Shortfall risk across cash and time, from 2,048 simulated futures" },
          { file: "ginseng-frontier.jpg", caption: "Frontier of 148 portfolios" },
          { file: "ginseng-tui.jpg", caption: "Terminal research workspace" },
        ],
      },
    ],
  },
  {
    slug: "tools",
    title: "Applications & tooling",
    level: "interface",
    projects: [
      {
        slug: "rika",
        title: "rika!",
        repo: "ZacharySF/kitty",
        url: "https://github.com/ZacharySF/kitty",
        role: "Solo",
        short: "A local-first desktop workspace for students: block notes, planning, study tools, a 3D map of everything in it and a built-in terminal, stored in SQLite. Svelte 5, Python, Tauri.",
        shots: [
          { file: "rika-brain.jpg", caption: "Brain view: the whole workspace as one 3D map" },
          { file: "rika-welcome.jpg", caption: "Welcome card" },
          { file: "rika-home.jpg", caption: "Home dashboard" },
        ],
      },
    ],
  },
];
