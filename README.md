# Velocmd

Velocmd is a high-performance system launcher and file indexer for Windows, engineered to bring a macOS Spotlight-like experience to the Windows ecosystem. Powered by a Rust backend and a lightweight Tauri frontend, it bypasses the sluggish native Windows indexer by utilizing an aggressive, in-memory indexing strategy.

## Key Features

- **Blazing Fast In-Memory Search**: On startup, Velocmd scans critical system directories (Start Menu, WindowsApps, User Data) and connected drives, loading everything into aggressive memory caching for instant retrieval.
- **Dynamic Filtering System**: Type `/` or `@` to trigger robust file type filtering with chips. Easily refine queries dynamically to show only `/apps`, `/folders`, `/files`, or even specific drives. 
- **Universal Windows Platform (UWP) Support**: Specifically engineered to flawlessly find Microsoft Store Apps (like Spotify, Netflix), stripping redundant alias extensions and fetching system icons properly. 
- **Direct Command Execution**: Start your search with `@cmd` to run processes directly from the launcher without opening a separate shell.
- **Web Search Integration**: Launch searches straight into your browser via `@google`, `@duckduckgo`, or `@bing`.
- **System Controls & Media Keys**: Quickly control media playback (play, pause, next track) and system power states directly using built-in `velo:` commands. 
- **Customizable Global Hotkeys**: Includes a dynamic global hotkey binder equipped with availability checks to ensure no conflicts with other apps. Defaults to `Win+Shift+.`.
- **Recents History Tracker**: Includes an optionally toggleable "Recents" panel to give you fast access to the last 10 things you successfully opened.
- **Native OS Execution**: Smart execution parses and runs absolute paths, folder navigation, web URLs, and commands properly through `cmd.exe` or Tauri native handlers depending on context.

## Technology Stack

- **Backend**: Rust utilizing [Tauri](https://tauri.app/). Optimized file system walking via the `jwalk` crate. 
- **Frontend**: Vanilla HTML / CSS / JS for zero-overhead DOM rendering. No heavy JS frameworks ensuring the absolute lowest latency on-screen possible.
- **Core Plugins**:
  - `tauri-plugin-global-shortcut` for binding and checking global keys.
  - `tauri-plugin-autostart` for launching at boot.
  - `tauri-plugin-opener` for native protocol processing.

## Installation / Development

1. Ensure you have **Rust**, **Node.js**, and **npm** installed on your system.
2. Clone the repository.
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the development server (auto-recompiles on change):
   ```bash
   npm run tauri dev
   ```
5. To build a highly optimized release executable:
   ```bash
   npm run tauri build
   ```

## Known Commands

Besides standard files and folders, you can type **`/velo `**, **`/settings `**, or specific keywords to find the following built-in integrations:
- **Velo Settings** - Opens the configuration pane
- **Velo: Toggle Recents** - Toggles the recent items menu
- **Velo: Clear Recents** - Wipes history
- **Velo: Reset Position** - Re-centers the window
- **Shutdown / Restart** - Safe system power off menus
- **Media: Play/Pause/Next/Previous** - Media controls
- **System Configs** - "Windows Updates", "Display Settings", "Sound Settings" etc. route directly to modern ms-settings protocols.

---

> Engineered to bring instant accessibility to Windows users who need speed.
