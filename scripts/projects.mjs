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
        short: "Wearable obstacle warnings: FreeRTOS firmware, ToF sensing, haptics over UDP.",
        shots: [
          { file: "determine-glasses.jpg", caption: "The prototype glasses at HackTX 26" },
          { file: "determine-world.jpg", caption: "Simulator driving the real phone engine" },
          { file: "determine-app.jpg", caption: "Desktop app, system ready" },
        ],
      },
      {
        slug: "orion-mesh",
        title: "Orion Mesh",
        repo: "ZacharySF/Orion-Mesh",
        url: "https://github.com/ZacharySF/Orion-Mesh",
        role: "Research",
        short: "Two-Pi NixOS mesh measuring ROS 2 control latency under H.264 load over BATMAN-adv.",
        shots: [
          { diagram: "orionMesh", caption: "How the two nodes talk: ROS 2 over a BATMAN-adv mesh on one Wi-Fi channel" },
          { diagram: "orionSweep", caption: "Nine video bitrates tested" },
          { diagram: "orionMetrics", caption: "Eight measurements per trial" },
        ],
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
        short: "Incident-response OS: agents run in sealed strata; every action is signed.",
        shots: [
          { file: "cleanroom-controlroom.jpg", caption: "Control room during a ransomware incident" },
          { file: "cleanroom-system.jpg", caption: "Sealed roots and the receipt chain" },
          { file: "cleanroom-overview.jpg", caption: "What needs a signature" },
        ],
      },
      {
        slug: "nixos-config",
        title: "nixos-config",
        repo: "ZacharySF/nixos-config",
        url: "https://github.com/ZacharySF/nixos-config",
        role: "Solo",
        short: "Two-host NixOS flake; the boot module checks disk UUIDs before it activates.",
        shots: [{ diagram: "nixosFlake", height: 296, caption: "One flake builds both installs; a check stops the wrong host from activating" }],
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
        short: "Collaborative browser synth: FM, AM, Karplus-Strong, MIDI, shared live sessions.",
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
        short: "Liquidity-risk engine: Monte Carlo with precision stopping, Sobol sampling, a TUI.",
        shots: [
          { file: "ginseng-risk.jpg", caption: "Shortfall risk across cash and time, from 2,048 simulated futures" },
          { file: "ginseng-frontier.jpg", caption: "Portfolio frontier, 148 portfolios" },
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
        short: "Local-first desktop workspace: notes, a knowledge atlas and a terminal in SQLite.",
        shots: [
          { file: "rika-brain.jpg", caption: "Brain view: the whole workspace as one 3D map" },
          { file: "rika-welcome.jpg", caption: "Welcome card" },
          { file: "rika-home.jpg", caption: "Home dashboard" },
        ],
      },
      {
        slug: "research-evaluator",
        title: "research-evaluator",
        repo: "ZacharySF/research-evaluator",
        url: "https://github.com/ZacharySF/research-evaluator",
        role: "Solo",
        short: "Evidence-first proposal judge and research loop for coding agents.",
        shots: [{ file: "research-evaluator-loop.jpg", height: 280, caption: "How each research round feeds the next" }],
      },
    ],
  },
];
