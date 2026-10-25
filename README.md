<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/header-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/header-light.svg">
  <img src="assets/header-light.svg" width="960" alt="Zachary Stubbs — embedded systems, computer architecture, and digital design. Texas A&amp;M Engineering.">
</picture>

General Engineering student at Texas A&M University, pursuing an electrical engineering path with a computer engineering focus.

My work spans embedded Linux, Nix/NixOS, ROS 2, networked systems, digital signal processing, and interactive web audio. I'm specifically interested in computer architecture, digital design, and GPU performance.

[Selected work](#user-content-selected-work) · [Toolkit](#user-content-toolkit) · [Contact](#user-content-contact)

## Selected work

### [Determine](https://github.com/nunera/Determine)

I built Determine, a wearable assistive-tech prototype that turns distance measurements into audio and haptic warnings for blind and low-vision users. I developed C++/FreeRTOS firmware for ESP32 boards, integrated I²C time-of-flight sensing and vibration hardware, and connected the boards to Kotlin and Swift phone engines over a binary UDP protocol. My work included clock synchronization, stale-data rejection, deadline-based haptic commands, and watchdog handling for lost connections. I also built a 3D simulator that feeds the actual phone engine, with fault injection and a hardware-in-the-loop bridge for system-level testing.

### [Orion Mesh](https://github.com/ZacharySF/Orion-Mesh)

An embedded-networking study using two Raspberry Pis running NixOS, ROS 2 with CycloneDDS, and BATMAN-adv. I evaluated control-message latency and packet loss across nine H.264 bitrate conditions and documented the completed analysis in a paper.

### [Ichor](https://github.com/ZacharySF/ichor)

I co-authored Ichor, a collaborative browser synthesizer built with Svelte 5, TypeScript, Tone.js, and Cloudflare Workers. My contributions included patch-schema and audio-engine features, Svelte UI controls, MIDI compatibility, keyboard interactions, and the interactive preset library with 475 patches.

[Play the synthesizer ↗](https://ichor.songseeker.cc/)

I'm strengthening my C++ build and debugging fundamentals while moving into RTL and GPU systems work. I want future projects to pair implementation with benchmarks and analysis.

## Toolkit

| Area | Tools used in my projects |
| :--- | :--- |
| Embedded & hardware | `C++` · `FreeRTOS` · `ESP32` · `I²C` · `Raspberry Pi` |
| Systems & networking | `Nix/NixOS` · `ROS 2` · `CycloneDDS` · `BATMAN-adv` · `UDP` |
| Applications & audio | `Kotlin` · `Swift` · `TypeScript` · `Svelte` · `Tone.js` |

## Contact

[LinkedIn ↗](https://linkedin.com/in/zsfs) · [Email ↗](mailto:Zachary.sf.stubbs@gmail.com)
