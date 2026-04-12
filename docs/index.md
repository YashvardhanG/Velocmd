---
template: home.html
---

<video autoplay loop muted playsinline width="750" style="clip-path: inset(3px 0 1px 0); display: block; margin: 0;">
  <source src="assets/hero-video.mp4" type="video/mp4">
</video>

## **About**
**Velocmd** is a high-performance system launcher and file indexer designed to bring a unified, instant **command palette** to Windows. Powered by a Rust backend and a lightweight Tauri frontend, it bypasses the sluggish native Windows search by utilizing an optimized, in-memory indexing strategy.

Windows power users have long suffered through a native search experience that is notoriously slow, bloated with web results, and visually cumbersome. Velocmd was built to solve this with a single, uncompromising philosophy: **Zero latency, zero bloat, and total keyboard control.**

## **Core Capabilities**
**Velocmd** is more than just an app launcher. It is a unified command palette for your entire Windows system.

**⚡ Blazing Fast, In-Memory Search**

Unlike traditional indexers that constantly read and write to a background database, Velocmd aggressively scans your Start Menu, local AppData, and mounted drives upon startup using multithreaded directory traversal. It stores this index directly in memory, resulting in sub-millisecond query responses.

**🏷️ Smart Tag Filtering**

Filter through thousands of files instantly without touching your mouse. By typing an / or @ prefix, you can activate smart chips to narrow your search context:

- **Types:** `/apps`, `/folders`, `/files`, `/settings`
- **Drives:** `/C:`, `/D:`
- **Actions:** `/cmd` (Terminal execution), `/search` (Web)

**⚙️ Deep System Integration**

Velocmd plugs directly into native Windows settings. Without navigating through menus, you can instantly search for and launch:

- **Deep system settings** (e.g., Sound Settings, Apps & Features, Environment Variables)
- **Legacy tools** (e.g., Control Panel, Registry Editor, Task Manager)
- **Power states** (e.g., Shutdown, Restart)
- **Media controls** (Play/Pause, Next/Prev Track)

**🕸️ Instant Web & Terminal Routing**

Need to look something up or run a script? Velocmd routes your queries seamlessly.

- **Terminal:** Type `!cmd ping google.com` to instantly spawn a command prompt executing your script.
- **Web:** Prefix queries with `/google`, `/duck`, or `/bing` to instantly open your default browser to the search results.

## Indexing Performance

All tests were performed on a cold start, dropping file system caches between runs, and indexing across all connected drives.

| Dataset Scope | Item Count | Windows Indexer | Velocmd |
| :--- | :--- | :--- | :--- |
| **Full System (All Drives)** | ~1M Items | Hours | **~3.97 seconds** |
| **Re-indexing (Warm)** | ~1M Items | Background | **~4.10 seconds** |

*Note: Velocmd utilizes maximum available threads to build an in-memory index instantly.*

## **Under the Hood**
Velocmd is engineered for performance, keeping its footprint incredibly small while maximizing speed.

- **Backend (Rust)**: Handles the heavy lifting. It utilizes multithreading for file traversal, interfaces directly with the Windows API to extract native .exe and .lnk icons, and manages the global shortcut hooks.
- **Frontend (Vanilla JS + HTML/CSS)**: A completely custom, dependency-free frontend ensures the UI renders instantly without the overhead of heavy JavaScript frameworks like React or Vue.
- **Bridge (Tauri)**: Packages the application into an ultra-lean binary, consuming a fraction of the RAM required by traditional Electron-based launchers.

## **Pricing**
Velocmd isn't just built for speed, **it's built on trust**.

- **Absolutely Free & Open Source**: There are no paywalls, no premium tiers, and no subscriptions. The entire codebase is open-source and community-driven.
- **Strictly Local**: Your data is yours. The index is built locally, stored entirely in your RAM, and wiped the moment you close the application.
- **Zero Telemetry**: Velocmd is absolutely private by design. There is no background tracking, no cloud syncing, and no analytics. What happens on your machine stays on your machine.