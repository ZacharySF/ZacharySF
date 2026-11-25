# Zachary Stubbs

I study Electrical and Computer Engineering at Texas A&M. Most of my projects sit close to the hardware: microcontroller firmware, Linux sandboxing, NixOS, and small networks of Raspberry Pis. A few are apps.

You can reach me by [email](mailto:Zachary.sf.stubbs@gmail.com) or on [LinkedIn](https://linkedin.com/in/zsfs).

## Projects

### [cleanroom](https://github.com/nunera/cleanroom)

*Team project, built in about 24 hours at HackUTD 2026. I worked on the OS core.*

An operating system for responding to a break-in. Nemotron agents investigate from inside sealed Linux roots that are pinned by digest, the kernel keeps the evidence read-only, and every command and model call is written to a signed log you can check offline. In our 29 test runs no evidence file changed, and the kernel blocked all 15 attempts to wipe it. Rust and Nix. [Demo video](https://youtu.be/mHiA2bX0uxg).

<p>
  <img src="assets/shots/cleanroom-controlroom.jpg" height="160" alt="The cleanroom control room during a ransomware incident">
  <img src="assets/shots/cleanroom-system.jpg" height="160" alt="Sealed roots and the chain of signed receipts">
  <img src="assets/shots/cleanroom-overview.jpg" height="160" alt="Which actions need a signature">
</p>

### [rika!](https://github.com/ZacharySF/kitty)

*Solo.*

A desktop workspace for students that keeps everything on your own machine: block notes, documents, planning, study tools and a built-in terminal, stored in SQLite. The brain view draws the whole workspace as one 3D map. Svelte 5 and Python, packaged with Tauri. [Download for Linux](https://github.com/ZacharySF/rika/releases/latest).

<p>
  <img src="assets/shots/rika-brain.jpg" height="160" alt="The brain view: the whole workspace as one 3D map">
  <img src="assets/shots/rika-welcome.jpg" height="160" alt="The welcome card">
  <img src="assets/shots/rika-home.jpg" height="160" alt="The home dashboard">
</p>

### [MisaOS](https://github.com/ZacharySF/misaos)

*Co-author.*

Runs software built for another Linux distribution, such as Debian or Void, on a NixOS computer without mixing the two systems. Each app gets a sealed copy of its own files and sees only the host folders its plan grants, and nothing runs until its exact bytes have been approved. It can also boot a machine on its own (so far in a VM), and it refuses to start a system that has been altered. Rust, bubblewrap and Dinit.

<p>
  <img src="assets/shots/misaos-boot.jpg" height="160" alt="MisaOS booting a machine: it checks the system, then starts each service">
  <img src="assets/shots/misaos-xclock.jpg" height="160" alt="A Debian app on a NixOS desktop">
  <img src="assets/shots/misaos-refused.jpg" height="160" alt="An altered system being refused">
</p>

### [nixos-config](https://github.com/ZacharySF/nixos-config)

*Solo.*

The NixOS setup for my laptop: Niri, Quickshell and home-manager, built from one flake. The laptop has two installs, one on the internal NVMe and one on an external drive. On September 24, 2026 the external drive's configuration was applied to the internal install, and it booted into emergency mode. Since then, every switch first checks that the mounted root and boot partitions are the ones the host expects ([`modules/system/boot.nix`](https://github.com/ZacharySF/nixos-config/blob/master/modules/system/boot.nix#L12-L20)):

```nix
actual_uuid=$(${pkgs.util-linux}/bin/findmnt --noheadings --output UUID --mountpoint ${lib.escapeShellArg mountPoint})
if [ "$actual_uuid" != ${lib.escapeShellArg expectedUUID} ]; then
  echo ${lib.escapeShellArg "Refusing to activate ${config.networking.hostName}: ${mountPoint} must have UUID ${expectedUUID}. Select the flake host for the mounted installation."} >&2
  exit 1
fi
```

### [Orion Mesh](https://github.com/ZacharySF/Orion-Mesh)

*Research project.*

A two-node Raspberry Pi test bed that measures how much an H.264 video stream on the same Wi-Fi channel delays ROS 2 control messages. A Pi 4 publishes control messages at 50 Hz while streaming video at 0 to 15 Mbps, and a Pi 3 records one-way latency and missing messages across a BATMAN-adv mesh. Both SD card images build from one Nix flake. The measurements and analysis are done, and I'm finishing the paper.

### [Determine](https://github.com/nunera/Determine)

*Co-author, HackTX 2026.*

Glasses that warn a cane user about obstacles at head height. A time-of-flight sensor on the frame is read by an ESP32-C3 running FreeRTOS, which sends the distance over UDP to a phone, and the phone answers with sound and vibration. It works on the bench, but it has not been tested with blind or low-vision users yet.

<p>
  <img src="assets/shots/determine-glasses.jpg" height="160" alt="The prototype glasses at HackTX 2026">
  <img src="assets/shots/determine-world.jpg" height="160" alt="The simulator running the real warning engine">
  <img src="assets/shots/determine-site.jpg" height="160" alt="The home page of the web app">
</p>

### [Ginseng](https://github.com/nunera/ginseng)

*Co-author, HackRice 16.*

A liquidity-risk simulator for people with uneven income. It resamples past cash flows into thousands of possible futures, then estimates how much cash to keep in reserve and how likely you are to run short. We compared plain Monte Carlo with scrambled Sobol sampling and checked both against exact answers on small cases. The result was mixed: Sobol reached the tightest error target at 2.34 times lower cost, but plain Monte Carlo was cheaper for several easier targets. Python.

<p>
  <img src="assets/shots/ginseng-risk.jpg" height="160" alt="Shortfall risk across cash and time, from 2,048 simulated futures">
  <img src="assets/shots/ginseng-frontier.jpg" height="160" alt="The frontier of 148 portfolios">
  <img src="assets/shots/ginseng-tui.jpg" height="160" alt="The terminal research workspace">
</p>

### [Ichor](https://github.com/ZacharySF/ichor)

*Co-author.*

A synthesizer that runs in the browser, with FM, AM and Karplus-Strong voices, MIDI input, knobs you modulate by dragging a source onto them, and a Strudel panel for live coding. Anyone with a session link can play the same patch at the same time. Svelte 5, Tone.js and Cloudflare Workers. [Play it in your browser](https://ichor.songseeker.cc/).

<p>
  <img src="assets/shots/ichor-synth.jpg" height="160" alt="Two oscillators, a filter, an envelope and the keyboard">
  <img src="assets/shots/ichor-modulation.jpg" height="160" alt="Modulation routing">
  <img src="assets/shots/ichor-strudel.jpg" height="160" alt="Live coding with Strudel">
</p>
