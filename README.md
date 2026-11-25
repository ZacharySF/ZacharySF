# Zachary Stubbs

I study Electrical and Computer Engineering at Texas A&M. Most of my projects sit close to the hardware: microcontroller firmware, Linux sandboxing, NixOS, and small networks of Raspberry Pis. A few are apps.

[Email](mailto:Zachary.sf.stubbs@gmail.com) &nbsp;&nbsp; [LinkedIn](https://linkedin.com/in/zsfs)

## Operating systems

<a href="https://github.com/nunera/cleanroom"><img align="left" width="38%" src="assets/cleanroom.jpg" alt="The cleanroom control room during a ransomware incident"></a>

### [cleanroom](https://github.com/nunera/cleanroom)

An operating system for investigating a break-in. Nemotron agents work inside sealed Linux roots, the kernel keeps the evidence read-only, and every action lands in a signed log. In 29 test runs no evidence changed, and all 15 wipe attempts were blocked.

Team project at HackUTD 2026; I worked on the OS core. Rust and Nix. [Demo video](https://youtu.be/mHiA2bX0uxg)

<br clear="left">

<a href="https://github.com/ZacharySF/misaos"><img align="left" width="38%" src="assets/misaos.jpg" alt="MisaOS refusing to boot a system whose generation identity does not match"></a>

### [MisaOS](https://github.com/ZacharySF/misaos)

Runs apps from other Linux distributions, like Debian or Void, on NixOS without mixing the two. Each app gets a sealed copy of its files and sees only the folders it's granted. Nothing runs until its exact bytes are approved, and an altered system is refused at boot.

Co-author. Rust, bubblewrap and Dinit.

<br clear="left">

<a href="https://github.com/ZacharySF/nixos-config"><img align="left" width="38%" src="assets/nixos-config.jpg" alt="My Niri desktop with the Quickshell bar along the top"></a>

### [nixos-config](https://github.com/ZacharySF/nixos-config)

The NixOS setup for my laptop: Niri, Quickshell and home-manager from one flake. The laptop has two installs, and applying the wrong one's config once left it in emergency mode, so now every switch [checks the disk UUIDs first](https://github.com/ZacharySF/nixos-config/blob/master/modules/system/boot.nix#L12-L20) and refuses the wrong host.

Solo. Nix and QML.

<br clear="left">

## Hardware and networking

<a href="https://github.com/nunera/Determine"><img align="left" width="38%" src="assets/determine.jpg" alt="The Determine prototype glasses at HackTX 2026"></a>

### [Determine](https://github.com/nunera/Determine)

Glasses that warn a cane user about obstacles at head height. A time-of-flight sensor on the frame feeds an ESP32-C3, and a phone turns the distance into sound and vibration. It works on the bench but hasn't been tried with blind or low-vision users yet.

Co-author, HackTX 2026. C and C++ firmware, Kotlin and Swift apps.

<br clear="left">

<a href="https://github.com/ZacharySF/Orion-Mesh"><img align="left" width="38%" src="assets/orion-mesh.jpg" alt="Terminal output of orion-run_batch: bitrates 0 to 15 Mbps, 5 repeats each, 45 trials, about 112 minutes"></a>

### [Orion Mesh](https://github.com/ZacharySF/Orion-Mesh)

Two Raspberry Pis on a BATMAN-adv mesh, used to measure how much an H.264 video stream on the same Wi-Fi channel delays ROS 2 control messages sent at 50 Hz. Both SD card images build from one Nix flake. The measurements are done and I'm writing the paper.

Research project. Python, ROS 2 and Nix.

<br clear="left">

## Apps and tools

<a href="https://github.com/nunera/ginseng"><img align="left" width="38%" src="assets/ginseng.jpg" alt="Ginseng's shortfall risk surface across cash and time, from 2,048 simulated futures"></a>

### [Ginseng](https://github.com/nunera/ginseng)

A liquidity-risk simulator for people with uneven income. It turns past cash flows into thousands of possible futures and estimates how much cash to hold back. We checked Monte Carlo and Sobol sampling against exact answers: Sobol hit the hardest target at 2.34 times lower cost, but lost on easier ones.

Co-author, HackRice 16. Python and Svelte.

<br clear="left">

<a href="https://github.com/ZacharySF/ichor"><img align="left" width="38%" src="assets/ichor.jpg" alt="Ichor's synth panel: two oscillators, a filter, an envelope and the keyboard"></a>

### [Ichor](https://github.com/ZacharySF/ichor)

A synthesizer that runs in the browser, with FM, AM and Karplus-Strong voices, MIDI input, knobs you modulate by dragging a source onto them, and a Strudel panel for live coding. Anyone with a session link can play the same patch at the same time.

Co-author. Svelte 5, Tone.js and Cloudflare Workers. [Play it](https://ichor.songseeker.cc/)

<br clear="left">

<a href="https://github.com/ZacharySF/kitty"><img align="left" width="38%" src="assets/rika.jpg" alt="rika!'s brain view: the whole workspace as one 3D map"></a>

### [rika!](https://github.com/ZacharySF/kitty)

A desktop workspace for students that keeps everything on your own machine: block notes, documents, planning, study tools and a terminal, all in SQLite. The brain view draws the whole workspace as one 3D map.

Solo. Svelte 5, Python and Tauri. [Download for Linux](https://github.com/ZacharySF/rika/releases/latest)

<br clear="left">
