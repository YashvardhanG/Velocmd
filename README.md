# Velocmd Explorer

<br />
<p align="center">
  <a href="https://github.com/YashvardhanG/Velocmd">
    <img src="docs/assets/logo.png" alt="Logo" width="128" height="128">
  </a>
  <h3 align="center">Velocmd Explorer</h3>
  <p align="center">
    A lightning-fast system launcher powered by a native Rust indexer. Search files, run commands, and navigate your system seamlessly.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/YashvardhanG/Velocmd?style=flat-square&color=007ec6" alt="Version">
  <img src="https://img.shields.io/badge/Platform-Windows_10%20%7C%2011-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/Price-Free-brightgreen?style=flat-square" alt="Price">
</p>

<p align="center">
  <a href="https://ko-fi.com/I3I31XL6SJ" target="_blank">
    <img src="https://img.shields.io/badge/Buy%20me%20a%20coffee!-%235e8bde?style=flat&logo=ko-fi&logoColor=white" alt="Buy me a coffee!">
  </a>
</p>

</br>

<p align="center" style="margin: 0;">
  <img src="docs/assets/hero-video.gif" alt="Velocmd Hero Demo" style="display: block;">
</p>

<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about">About</a></li>
    <li><a href="#core-capabilities">Core Capabilities</a></li>
    <li><a href="#indexing-performance">Indexing Performance</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#development-setup">Development Setup</a></li>
    <li><a href="#contribute">Contribute</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About
**Velocmd** is a high-performance system launcher and file indexer designed to bring a unified, instant **command palette** to Windows. Powered by a Rust backend and a lightweight Tauri frontend, it bypasses the sluggish native Windows search by utilizing an optimized, in-memory indexing strategy.

Windows power users have long suffered through a native search experience that is notoriously slow, bloated with web results, and visually cumbersome. Velocmd was built with a single philosophy: **Zero latency, zero bloat, and total keyboard control.**

For a deep dive into every feature, chip alias, and advanced system command, please check out our: 

🔗 **[Full Documentation Site](https://yashvardhang.github.io/Velocmd/)** | **[Medium Article](https://medium.com/@yashvardhang11/meet-velocmd-the-lightning-fast-command-palette-windows-always-needed-2ab63a910960)**


<p align="left" style="margin: 0;">
  <img src="docs/assets/launch.png" alt="Velocmd" style="display: block;">
</p>

---

## Core Capabilities

### ⚡ Lightning Fast Search
Unlike traditional indexers that constantly read and write to a background database, Velocmd aggressively scans your Start Menu, local AppData, and mounted drives upon startup using multithreaded directory traversal. It stores this index directly in memory, resulting in sub-millisecond query responses.

### 🏷️ Smart Tag Filtering
Filter thousands of files instantly using `/` or `@` prefixes:
* **Types:** `/apps`, `/folders`, `/files`, `/settings`
* **Drives:** `/C:`, `/D:`
* **Actions:** `/cmd` (Terminal), `/search` (Web)

### ⚙️ Deep System Integration
Directly launch Sound Settings, Environment Variables, Registry Editor, Task Manager, or even trigger system power states like **Shutdown** and **Restart** directly from the bar.

### 🔄️ Automatic updates and refresh
Velocmd automatically refreshes the index after 15-mins intervals, and also checks if there are any updates to the app. There are manual options to refresh via `velo:refresh-index` command, or check for updates in the settings panel.

---

## Indexing Performance

All tests were performed on a cold start, dropping file system caches between runs, and indexing across all connected drives.

| Dataset Scope | Item Count | Windows Indexer | Velocmd |
| :--- | :--- | :--- | :--- |
| **Full System (All Drives)** | ~1 Million Items | Hours | **~3.97 seconds** |
| **Re-indexing (Warm)** | ~1 Million Items | Background | **~4.10 seconds** |

*Note: Velocmd utilizes maximum available threads to build an in-memory index instantly.*

---

## Usage

### The Master Shortcut
To summon the palette from anywhere:
> <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>.</kbd>

*Change this anytime via the <kbd>Tab</kbd> settings menu.*

### Basic Controls
* **<kbd>↓</kbd> / <kbd>↑</kbd>** : Navigate through search results.
* **<kbd>Enter</kbd>** : Open the selected file, folder, or application.
* **<kbd>Esc</kbd>** : Clear the search bar. Pressing it a second time hides the launcher.
* **<kbd>Tab</kbd>** : Toggle the Settings menu.

---

## Installation

### Download (Recommended)
1. Go to the [Latest Release](https://github.com/YashvardhanG/velocmd/releases/latest).
2. Download `Velocmd.Explorer_[version]_x64-setup.exe`.
3. Run the installer and launch from your Start Menu.

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
git clone [https://github.com/YashvardhanG/velocmd.git](https://github.com/YashvardhanG/velocmd.git)
cd velocmd

# 2. Install dependencies
npm install

# 3. Build the application
npm run tauri build
```

## Contribute

Every program is ever evolving and, that is possible only with valuable contributions. Any contributions you make are greatly appreciated. 
<ol>
  <li>Fork the Project</li>
  <li>Create your Feature Branch (git checkout -b functionalities/Feature)</li>
  <li>Commit your Changes (git commit -m 'Add a Feature')</li>
  <li>Push to the Branch (git push origin functionalities/Feature)</li>
  <li>Open a Pull Request</li>
</ol>

<br>**Liked the app?** Please **Star ✨** the repository, and if you do want to support further, you can always <a href='https://ko-fi.com/I3I31XL6SJ' target='_blank'>buy me a coffee!</a> ☕

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
