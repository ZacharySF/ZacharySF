<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/header-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/header-light.svg">
  <img src="assets/header-light.svg" width="960" alt="Zachary Stubbs">
</picture>

### / low-level systems / computer architecture / operating systems

General Engineering student at Texas A&M University, pursuing an electrical engineering path with a computer engineering focus.

My projects span embedded Linux, Nix/NixOS, ROS 2, networked systems, digital signal processing, and interactive web audio.

[Selected work](#user-content-selected-work) · [Tech stack](#user-content-tech-stack) · [Contact](#user-content-contact)

## Selected work

### [Determine](https://github.com/nunera/Determine)

I built Determine, a wearable assistive-tech prototype that turns distance measurements into audio and haptic warnings for blind and low-vision users. I developed C++/FreeRTOS firmware for ESP32 boards, integrated I²C time-of-flight sensing and vibration hardware, and connected the boards to Kotlin and Swift phone engines over a binary UDP protocol. My work included clock synchronization, stale-data rejection, deadline-based haptic commands, and watchdog handling for lost connections. I also built a 3D simulator that feeds the actual phone engine, with fault injection and a hardware-in-the-loop bridge for system-level testing.

### [Orion Mesh](https://github.com/ZacharySF/Orion-Mesh)

An embedded-networking study using two Raspberry Pis running NixOS, ROS 2 with CycloneDDS, and BATMAN-adv. I evaluated control-message latency and packet loss across nine H.264 bitrate conditions and documented the completed analysis in a paper.

### [Ichor](https://github.com/ZacharySF/ichor)

I co-authored Ichor, a collaborative browser synthesizer built with Svelte 5, TypeScript, Tone.js, and Cloudflare Workers. My contributions included patch-schema and audio-engine features, Svelte UI controls, MIDI compatibility, keyboard interactions, and the interactive preset library with 475 patches.

[Play the synthesizer ↗](https://ichor.songseeker.cc/)

I'm strengthening my C++ build and debugging fundamentals while moving into RTL and GPU systems work. I want future projects to pair implementation with benchmarks and analysis.

## Tech stack

![C++](https://img.shields.io/badge/C%2B%2B-00599C?style=for-the-badge&logo=cplusplus&logoColor=white)
![FreeRTOS](https://img.shields.io/badge/FreeRTOS-2D6B46?style=for-the-badge)
![ESP32](https://img.shields.io/badge/ESP32-E7352C?style=for-the-badge&logo=espressif&logoColor=white)
![Raspberry Pi](https://img.shields.io/badge/Raspberry_Pi-A22846?style=for-the-badge&logo=raspberrypi&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-24242B?style=for-the-badge&logo=linux&logoColor=white)
![NixOS](https://img.shields.io/badge/NixOS-5277C3?style=for-the-badge&logo=nixos&logoColor=white)
![ROS 2](https://img.shields.io/badge/ROS_2-22314E?style=for-the-badge&logo=ros&logoColor=white)
![Kotlin](https://img.shields.io/badge/Kotlin-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)
![Swift](https://img.shields.io/badge/Swift-F05138?style=for-the-badge&logo=swift&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![Tone.js](https://img.shields.io/badge/Tone.js-34343F?style=for-the-badge)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

## Contact

[LinkedIn ↗](https://linkedin.com/in/zsfs) · [Email ↗](mailto:Zachary.sf.stubbs@gmail.com)
