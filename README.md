# Zachary Stubbs

General Engineering student at Texas A&M University, pursuing an electrical engineering path with a computer engineering focus.

My work spans embedded Linux, Nix/NixOS, ROS 2, networked systems, digital signal processing, and interactive web audio. I'm specifically interested in computer architecture, digital design, and GPU performance.

## Projects

### [Determine](https://github.com/nunera/Determine)

I built Determine, a wearable assistive-tech prototype that turns distance measurements into audio and haptic warnings for blind and low-vision users. I developed C++/FreeRTOS firmware for ESP32 boards, integrated I²C time-of-flight sensing and vibration hardware, and connected the boards to Kotlin and Swift phone engines over a binary UDP protocol. My work included clock synchronization, stale-data rejection, deadline-based haptic commands, and watchdog handling for lost connections. I also built a 3D simulator that feeds the actual phone engine, with fault injection and a hardware-in-the-loop bridge for system-level testing.

### [Orion Mesh](https://github.com/ZacharySF/Orion-Mesh)

An embedded-networking study using two Raspberry Pis running NixOS, ROS 2 with CycloneDDS, and BATMAN-adv. I evaluated control-message latency and packet loss across nine H.264 bitrate conditions and documented the completed analysis in a paper.

### [Ichor](https://github.com/ZacharySF/ichor)

I co-authored Ichor, a collaborative browser synthesizer built with Svelte 5, TypeScript, Tone.js, and Cloudflare Workers. My contributions included patch-schema and audio-engine features, Svelte UI controls, MIDI compatablity, keyboard interactions, and making the interactive preset library including 475 patches.

I'm strengthening my C++ build and debugging fundamentals while moving into RTL and GPU systems work. I want future projects to pair implementation with benchmarks and analysis.
