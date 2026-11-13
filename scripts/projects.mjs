// Profile projects grouped by layer, deepest (closest to hardware) first.
// Edit here, then run `node scripts/build-assets.mjs` to regenerate assets/cards and assets/layers.

export const layers = [
  {
    slug: "embedded",
    title: "Embedded systems & networks",
    level: "hardware",
    concepts: "microcontrollers · RTOS · sensor buses · mesh routing · latency measurement",
    projects: [
      {
        slug: "determine",
        title: "Determine",
        repo: "nunera/Determine",
        url: "https://github.com/nunera/Determine",
        role: "co-author",
        language: "C++",
        description:
          "Wearable obstacle warnings for blind and low-vision users. ESP32 firmware on FreeRTOS reads I²C time-of-flight sensors and drives haptics over a binary UDP link to the phone.",
        tags: ["FreeRTOS", "ESP32", "UDP", "HIL sim"],
      },
      {
        slug: "orion-mesh",
        title: "Orion Mesh",
        repo: "ZacharySF/Orion-Mesh",
        url: "https://github.com/ZacharySF/Orion-Mesh",
        role: "research",
        language: "Nix",
        description:
          "Two Raspberry Pis on NixOS measuring ROS 2 control latency and loss over a BATMAN-adv mesh while H.264 video shares the channel, across nine bitrates.",
        tags: ["ROS 2", "CycloneDDS", "BATMAN-adv", "Chrony"],
      },
    ],
  },
  {
    slug: "os",
    title: "Operating systems & isolation",
    level: "kernel",
    concepts: "namespaces · PID 1 / init · boot chains · content-addressed roots · declarative hosts",
    projects: [
      {
        slug: "cleanroom",
        title: "cleanroom",
        repo: "nunera/cleanroom",
        url: "https://github.com/nunera/cleanroom",
        role: "OS core",
        language: "Rust",
        description:
          "Incident-response OS. Agents run in kernel-walled strata over digest-pinned Debian and Alpine roots; every command and model call lands in a signed receipt log.",
        tags: ["namespaces", "bubblewrap", "dinit / s6-rc", "HackUTD 2026"],
      },
      {
        slug: "nixos-config",
        title: "nixos-config",
        repo: "ZacharySF/nixos-config",
        url: "https://github.com/ZacharySF/nixos-config",
        role: "solo",
        language: "Nix",
        description:
          "Flake for two NixOS installs with home-manager as a module. The boot module checks root and boot UUIDs before activation, so the wrong host can't brick a drive.",
        tags: ["flakes", "home-manager", "Quickshell"],
      },
    ],
  },
  {
    slug: "signals",
    title: "Signal processing & numerics",
    level: "algorithms",
    concepts: "synthesis engines · modulation routing · Monte Carlo · quasi-random sampling · liquidity risk",
    projects: [
      {
        slug: "ichor",
        title: "Ichor",
        repo: "ZacharySF/ichor",
        url: "https://github.com/ZacharySF/ichor",
        role: "co-author",
        language: "TypeScript",
        description:
          "Collaborative browser synth: subtractive, FM, AM and Karplus-Strong engines, drag-to-modulate routing, MIDI, 475 presets, sessions synced by Durable Objects.",
        tags: ["Tone.js", "Svelte 5", "Cloudflare"],
      },
      {
        slug: "ginseng",
        title: "Ginseng",
        repo: "nunera/ginseng",
        url: "https://github.com/nunera/ginseng",
        role: "co-author",
        language: "Python",
        description:
          "Liquidity-risk research engine: cash-failure Monte Carlo with precision stopping, measured Sobol sampling, funding-plan optimization, 3D risk surfaces and a terminal UI.",
        tags: ["Monte Carlo", "Sobol", "Svelte", "Postgres"],
      },
    ],
  },
  {
    slug: "tools",
    title: "Applications & tooling",
    level: "interface",
    concepts: "local-first data · desktop packaging · signed updates · agent workflows",
    projects: [
      {
        slug: "rika",
        title: "rika!",
        repo: "ZacharySF/kitty",
        url: "https://github.com/ZacharySF/kitty",
        role: "solo",
        language: "Python",
        description:
          "Local-first desktop workspace: block notes, a knowledge atlas, study tools and a bundled terminal in one SQLite file. Signed Linux releases with in-app updates.",
        tags: ["Tauri", "Svelte 5", "SQLite"],
      },
      {
        slug: "research-evaluator",
        title: "research-evaluator",
        repo: "ZacharySF/research-evaluator",
        url: "https://github.com/ZacharySF/research-evaluator",
        role: "solo",
        language: "JavaScript",
        description:
          "Evidence-first proposal judge and builder loop for coding agents. Remembers explored angles, maps remaining gaps and audits the evaluator itself.",
        tags: ["Agent Skills", "prompting"],
      },
    ],
  },
];
