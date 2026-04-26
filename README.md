# Velocmd Explorer

<br />
<p align="center">
  <a href="https://github.com/YashvardhanG/Velocmd">
    <img src="docs/assets/logo.png" alt="Logo" width="128" height="128">
  </a>
  <h3 align="center">Velocmd Explorer</h3>
  <p align="center">
    ⚡ A lightning-fast system launcher powered by a native Rust indexer. Search files, run commands, and navigate your system seamlessly.
  </p>
</p>

<p align="center">
  <a href="https://github.com/YashvardhanG/Velocmd/releases/latest"><img src="https://img.shields.io/github/v/release/YashvardhanG/Velocmd?style=flat-square&color=007ec6&label=Latest%20Release" alt="Version"></a>
  <img src="https://img.shields.io/badge/Platform-Windows_10%20%7C%2011-blue?style=flat-square" alt="Platform">
  <a href="https://github.com/YashvardhanG/Velocmd/blob/main/LICENSE"><img src="https://img.shields.io/github/license/YashvardhanG/Velocmd?style=flat-square&color=green" alt="License"></a>
  <img src="https://img.shields.io/badge/Price-Free-brightgreen?style=flat-square" alt="Price">
</p>



<p align="center">
  <a href="https://yashvardhang.github.io/Velocmd/"><strong>📖 Documentation</strong></a> · 
  <a href="https://github.com/YashvardhanG/Velocmd/releases/latest"><strong>📥 Download</strong></a> · 
  <a href="https://github.com/YashvardhanG/Velocmd/issues"><strong>🐛 Report Bug</strong></a> · 
  <a href="https://github.com/YashvardhanG/Velocmd/issues"><strong>💡 Request Feature</strong></a>
</p>

<p align="center">
  <a href="https://ko-fi.com/I3I31XL6SJ" target="_blank">
    <img src="https://img.shields.io/badge/Buy%20me%20a%20coffee!-%235e8bde?style=flat&logo=ko-fi&logoColor=white" alt="Buy me a coffee!">
  </a>
</p>

<br>

<p align="center" style="margin: 0;">
  <img src="docs/assets/hero-video.gif" alt="Velocmd Hero Demo" style="display: block;">
</p>

---

<details open="open">
  <summary><strong>Table of Contents</strong></summary>
  <ol>
    <li><a href="#about">About</a></li>
    <li><a href="#why-velocmd">Why Velocmd?</a></li>
    <li><a href="#core-capabilities">Core Capabilities</a></li>
    <li><a href="#indexing-performance">Indexing Performance</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li><a href="#development-setup">Development Setup</a></li>
    <li><a href="#contribute">Contribute</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

---

## About
**Velocmd** is a high-performance **system launcher and file indexer** designed to bring a unified, instant command palette to Windows. Powered by a Rust backend and a lightweight Tauri frontend, it bypasses the sluggish native Windows search by utilizing an optimized, in-memory indexing strategy.

Windows power users have long suffered through a native search experience that is notoriously slow, bloated with web results, and visually cumbersome. Velocmd was built with a single philosophy: **Zero latency, zero bloat, and total keyboard control.**

For a deep dive into every feature, chip alias, and advanced system command, please check out our: 🔗 **[Full Documentation Site](https://yashvardhang.github.io/Velocmd/)** | **[Medium Article](https://medium.com/@yashvardhang11/meet-velocmd-the-lightning-fast-command-palette-windows-always-needed-2ab63a910960)**


<p align="left" style="margin: 0;">
  <img src="docs/assets/launch.png" alt="Velocmd" style="display: block;">
</p>

---

## Why Velocmd?

| Feature | Windows Search | PowerToys Run | Velocmd |
| :--- | :---: | :---: | :---: |
| **Indexing Speed** | Hours (initial) | Relies on Windows Search | **~4 seconds** (1M items) |
| **Web Result Bloat** | ✅ Yes | ❌ No | ❌ No |
| **In-Memory Index** | ❌ No | ❌ No | ✅ Yes |
| **Deep System Settings** | ✅ Built-In | Via plugins | ✅ 32 Built-in |
| **Global Call / UI** | Start-Menu | Basic Floating Bar | Raycast-like Overlay |
| **Terminal Execution** | ❌ No | ✅ Yes | ✅ Yes |
| **Smart Chip Filtering** | ❌ No | ✅ Basic (plugin prefixes) | ✅ Yes |
| **Active Window Switching** | ❌ No | ✅ Window Walker | ✅ Built-in |
| **App Size** | In-Built | Heavy (Requires .NET) | **10MB** |
| **Portability** | OS Bound | Requires Installer | ✅ **Standalone/Installer** |
| **Backend** | Legacy C++/WinUI | .NET/C# | **Rust/Tauri** |
| **Telemetry** | ✅ Sends data | Optional | ❌ None |

---

## Core Capabilities

### ⚡ Lightning Fast Search
Unlike traditional indexers that constantly read and write to a background database, Velocmd aggressively scans your Start Menu, local AppData, and mounted drives upon startup using multithreaded directory traversal. It stores this index directly in memory, resulting in sub-millisecond query responses.

### 🏷️ Smart Tag Filtering
Filter thousands of files instantly using `/` or `@` prefixes:
* **Types:** `/apps`, `/folders`, `/files`, `/settings`
* **Drives:** `/C:`, `/D:`
* **Actions:** `/cmd` (Terminal), `/search` (Web), `/web` (Websites)

<p align="center" style="margin: 0;">
  <img src="docs/assets/file search.png" alt="Smart Chip Filtering in Velocmd" style="display: block;">
</p>

### ⚙️ Deep System Integration
Directly launch Sound Settings, Environment Variables, Registry Editor, Task Manager, or even trigger system power states like **Shutdown** and **Restart** directly from the bar.

<p align="center" style="margin: 0;">
  <img src="docs/assets/velo.png" alt="Velocmd Internal Commands & System Controls" style="display: block;">
</p>

### 🔄️ Automatic Updates & Refresh
Velocmd automatically refreshes the index every 15 minutes in the background, and checks for app updates on startup. You can also manually trigger a refresh via the `Velo: Refresh Index` command, or check for updates in the settings panel.

### 🪟 Active Window Switching
Type `/tabs` to instantly see and switch between all your open applications and browser tabs — no Alt+Tab fumbling required.

---

## Indexing Performance

All tests were performed on a modern _NVMe SSD,_ indexing across all connected drives.

| Dataset Scope | Item Count | Windows Indexer | Velocmd |
| :--- | :--- | :--- | :--- |
| **Initial Indexing** | ~1 Million Items | Hours | **~3.97 seconds** |
| **Re-indexing (Full Rescan)** | ~1 Million Items | Real-time (USN Journal) | **~4.10 seconds** |

*Note: Velocmd utilizes maximum available threads for instant manual indexing, but automatically drops to the lowest OS thread priority during background scans to ensure zero impact on games or heavy workloads.*

---

## Usage

### The Master Shortcut
The default global shortcut to summon the palette from anywhere is:
> <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>.</kbd>

If this conflicts with another application on your system, Velocmd will automatically fallback to the next available preset. The full preset list is:

`Win+Shift+.` · `Alt+Space` · `Win+Space` · `Ctrl+Space` · `Ctrl+Shift+Space` · `Win+S` · `Alt+S` · `Win+/`

You can also manually pick any of these presets from the settings panel (press <kbd>Tab</kbd> to open it).

<p align="center" style="margin: 0;">
  <img src="docs/assets/settings.png" alt="Velocmd: Settings" style="display: block;">
</p>

### Basic Controls
* **<kbd>↓</kbd> / <kbd>↑</kbd>** : Navigate through search results.
* **<kbd>Enter</kbd>** : Open the selected file, folder, or application.
* **<kbd>Esc</kbd>** : Clear the search bar. Pressing it a second time hides the launcher.
* **<kbd>Tab</kbd>** : Toggle the Settings menu.

### Quick Reference

| Command | What it does |
| :--- | :--- |
| `/apps discord` | Search only applications |
| `/folders downloads` | Search only directories |
| `/C: system32` | Filter by drive |
| `/cmd ping google.com` | Run a terminal command |
| `/google rust tauri` | Search Google directly |
| `/web` | Browse preset websites |
| `/tabs` | Switch between open windows |
| `/velo` | Access internal Velocmd commands |
| `/pc` | Access default Windows folders |
| `/nox` | Control Nox Dimmer settings |

---

## Installation

### Download (Recommended)
1. Go to the [Latest Release](https://github.com/YashvardhanG/velocmd/releases/latest).
2. Download `Velocmd.Explorer_[version]_x64-setup.exe`.
3. Run the installer and launch from your Start Menu.

> ⚠️ **Windows SmartScreen:** Because Velocmd is a new open-source application, Windows Defender SmartScreen might flag the installer. Click **More info** → **Run anyway** to proceed.

---

## Built With

Velocmd is engineered from the ground up with a focus on performance and minimal resource usage.

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | [Rust](https://www.rust-lang.org/) | Core indexer, search engine, and system integration |
| **Framework** | [Tauri v2](https://tauri.app/) | Lightweight native window with web frontend |
| **Frontend** | Vanilla JS + CSS | Zero-dependency UI with custom chip system |
| **Directory Walker** | [jwalk](https://crates.io/crates/jwalk) | Parallel, multithreaded filesystem traversal |
| **Serialization** | [bincode](https://crates.io/crates/bincode) | Binary index caching for instant cold starts |
| **System Icons** | [systemicons](https://crates.io/crates/systemicons) | Native Windows icon extraction |
| **OS Integration** | [windows-rs](https://crates.io/crates/windows) | Direct Win32 API calls for media keys, window management |

---

## Development Setup

### Prerequisites
Before you begin, ensure you have the following installed on your Windows machine:
* **Node.js**: LTS version (v18 or higher recommended).
* **Rust**: Install via [rustup.rs](https://rustup.rs/).
* **WebView2**: Standard on Windows 10/11, but ensure it's up to date.
* **C++ Build Tools**: Required for Rust compilation. You can get these via the [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

### Local Run
If you want to run the application in development mode with hot-reloading:

```bash
# 1. Clone the repository
git clone https://github.com/YashvardhanG/velocmd.git
cd velocmd

# 2. Install dependencies
npm install

# 3. Run in development mode (with hot-reloading)
npm run tauri dev

# 4. Or build the production binary
npm run tauri build
```

---

## Contribute

Every program is ever evolving and, that is possible only with valuable contributions. Any contributions you make are greatly appreciated. 
<ol>
  <li>Fork the Project</li>
  <li>Create your Feature Branch (<code>git checkout -b functionalities/Feature</code>)</li>
  <li>Commit your Changes (<code>git commit -m 'Add a Feature'</code>)</li>
  <li>Push to the Branch (<code>git push origin functionalities/Feature</code>)</li>
  <li>Open a Pull Request</li>
</ol>

<br>**Liked the app?** Please **Star ✨** the repository, and if you do want to support further, you can always <a href='https://ko-fi.com/I3I31XL6SJ' target='_blank'>buy me a coffee!</a> ☕

---

## License

Distributed under the **GNU General Public License v3.0**. See [`LICENSE`](LICENSE) for more information.

---

<!-- CONTACT -->
## Contact

<p align="center">
  <br>
  <img src="https://github.com/YashvardhanG/YashvardhanG/blob/main/Wolf_1.jpg" alt="Logo" width="150" height="150"><br>
  <a href = "https://www.yashvardhang.dev/">Connect with me! | Yashvardhan Gupta</a><br><br>
  <a href='https://ko-fi.com/I3I31XL6SJ' target='_blank'>
    <img height='40' style='border:0px; height:40px;' src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee!' />
  </a>
</p>
