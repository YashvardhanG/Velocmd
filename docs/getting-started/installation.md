---
icon: material/download-box-outline
description: "Download and install Velocmd on Windows 10 or 11. Get the pre-built installer or build from source with Rust and Tauri."
---

# Installation

Velocmd is packaged as a lightweight, standalone Windows executable. It is designed specifically for Windows 10/11 with zero external dependencies.

---

## Download (Recommended)

The easiest way to get Velocmd is by downloading the pre-compiled binary from our official GitHub releases.

1. Navigate to the [Latest Release](https://github.com/yashvardhang/velocmd/releases/latest) page on GitHub.
2. Download the `Velocmd.Explorer_[version]_x64-setup.exe` (or standalone `.exe`) from the Assets section.
3. Run the installer and follow the prompts.

!!! warning "Windows SmartScreen"
    Because Velocmd is a new, open-source application, Windows Defender SmartScreen might flag the installer as an "unrecognized app." This is completely normal for unsigned indie binaries. Click **More info**, then **Run anyway** to proceed.

---

## Launching & Autostart

Once installed, simply launch Velocmd from your Start Menu. It will immediately begin indexing your system in the background (this typically takes a few seconds on the first launch, and is near-instant on subsequent launches thanks to a cached index).

By default, Velocmd will minimize to your System Tray. 

<div align="center" markdown>
![Velocmd launcher after installation on Windows](../assets/launch.png){ width="750" }
</div>

!!! tip "Run at Startup"
    For the best experience, we highly recommend allowing Velocmd to run on startup so it is always ready when you need it. You can toggle **"Start with Windows"** directly inside the Velocmd settings menu.

---

## Build from Source

If you prefer to compile Velocmd yourself, you can build it directly from the Rust and JavaScript source code.

**Prerequisites:**
You will need [Node.js](https://nodejs.org/), [Rust](https://rustup.rs/), and the [Tauri prerequisites for Windows](https://tauri.app/v1/guides/getting-started/prerequisites) installed.

**1. Clone the repository**
First, grab the source code from GitHub and navigate into the project directory.
```bash
git clone [https://github.com/yashvardhang/velocmd.git](https://github.com/yashvardhang/velocmd.git)
cd velocmd
```

**2. Install dependencies**
Install the required Node.js packages for the custom frontend.
```bash
npm install
```

**3. Build the application**
Finally, run the build command to compile the Rust backend and bundle the frontend.
```bash
npm run tauri build
```
