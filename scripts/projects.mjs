// Profile projects grouped by layer, deepest (closest to hardware) first.
// Edit here, then run `node scripts/build-assets.mjs` to regenerate assets/projects.svg.

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
        role: "co-author",
        short: "Wearable obstacle warnings: FreeRTOS firmware, ToF sensing, haptics over UDP.",
      },
      {
        slug: "orion-mesh",
        title: "Orion Mesh",
        repo: "ZacharySF/Orion-Mesh",
        url: "https://github.com/ZacharySF/Orion-Mesh",
        role: "research",
        short: "Two-Pi NixOS mesh measuring ROS 2 control latency under H.264 load over BATMAN-adv.",
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
      },
      {
        slug: "nixos-config",
        title: "nixos-config",
        repo: "ZacharySF/nixos-config",
        url: "https://github.com/ZacharySF/nixos-config",
        role: "solo",
        short: "Two-host NixOS flake; the boot module checks disk UUIDs before it activates.",
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
        role: "co-author",
        short: "Collaborative browser synth: FM, AM, Karplus-Strong, MIDI, shared live sessions.",
      },
      {
        slug: "ginseng",
        title: "Ginseng",
        repo: "nunera/ginseng",
        url: "https://github.com/nunera/ginseng",
        role: "co-author",
        short: "Liquidity-risk engine: Monte Carlo with precision stopping, Sobol sampling, a TUI.",
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
        role: "solo",
        short: "Local-first desktop workspace: notes, a knowledge atlas and a terminal in SQLite.",
      },
      {
        slug: "research-evaluator",
        title: "research-evaluator",
        repo: "ZacharySF/research-evaluator",
        url: "https://github.com/ZacharySF/research-evaluator",
        role: "solo",
        short: "Evidence-first proposal judge and research loop for coding agents.",
      },
    ],
  },
];
