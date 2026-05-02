---
date: 2026-04-11
authors:
  - YashvardhanG
categories:
  - Releases
---

# Velocmd is Live! Instant Search is Here

After extensive development and optimization, I am incredibly excited to announce that **Velocmd** is officially out of beta and available for download! 

This release brings the lightning-fast, in-memory indexer to its most stable form yet, alongside a suite of deep system integrations.

Whether you are navigating thousands of local files or executing rapid-fire terminal scripts, **v0.1.6** (Latest) acts as the ultimate Windows power tool. Here is a look at what is packed into this release:

### 🚀 Core Highlights in v0.1.6 (Bug-Fixes)

* **Minor Fixes:** Minor UI tweaks and bug fixes (Velo Commands Panel + App Launch).

### 🚀 Core Highlights in v0.1.5 (Nox-Dimmer)

* **Built-In Nox Support:** Now with the `Nox` command, there is a built in support for Nox-Dimmer app and it's controls. 
    * `Nox:brightness_up`: Increases the brightness of the screen.
    * `Nox:brightness_down`: Decreases the brightness of the screen.
    * `Nox:hyper_toggle`: Toggles the hyper-mode of Nox-Dimmer.
    * `Nox:quit`: Quits the Nox-Dimmer app.
    * `Nox:open`: Opens the Nox-Dimmer app.
* **Velocmd Internal Commands Update:** Modified the `/velo` commands based on the latest internal commands.
* **Filter Debounce:** Fixed the filter typing debounce.
* **Minor Fixes:** Minor UI tweaks and bug fixes.

!!! info "What is Nox Dimmer?"
    Nox is a lightweight utility designed to solve a common problem: Monitors are often too bright, even at their lowest setting. Velocmd now natively supports Nox-Dimmer and its controls. Download Here: 🔗[Nox-Dimmer](https://github.com/YashvardhanG/Nox-Dimmer/releases/latest)


### 🚀 Core Highlights in v0.1.4 (Easier PC Folders Access)

* **Quick Access to Native PC Folders:** Typing `/pc` or `/thispc` or `/computer` immediately shows direct PC Folders (Documents, Downloads, etc.) as the top result.
* **Private Mode (Beta):** Triggered by typing the `/p` chip into the search bar supports: Incognito Web Browsing (Opens in default browser).
* **Common Websites List (/Web):** Triggered by typing the `/web` gives a list of common websites to open in your default browser or you can type out a link to open as well.
* **Native Icons:** Added more support on native Windows icons for files and folders, making it easier to identify them at a glance.
* **Minor Fixes:** Minor UI tweaks and bug fixes.

!!! tip "PC Folders"
    The `/pc` filter now acts as a high-priority shortcut for your core Windows locations, bypassing the need to search through thousands of indexed files: **Desktop**, **Documents**, **Downloads**, **Music**, **Pictures** and **Videos**

### 🚀 Core Highlights in v0.1.3 (Performance & Stat Mode)

* **Realtime RAM Analytics (Stat Mode):** Toggle the new Stat Mode in Settings to view Velocmd's live memory footprint directly in the footer.
* **New Velo Commands:** Now you can also `Velo:quit` to quit Velocmd and `Velo:close_window` to close the active window (`ctrl + w`).
* **Flawless Search UX:** Eliminated search result flickering and layout shifts. Implemented smart request sequencing and batched lazy-loading for file icons, guaranteeing perfectly smooth rendering.
* **Zero-Leak Indexing:** Resolved a memory leak during index refresh using a new Arena-based memory architecture. RAM usage no longer spirals during heavy disk scanning.
* **Instant Wake-Up:** Switched to a smarter background suspension strategy. Velocmd now wakes up instantly without the stuttering experienced in older versions.
* **Structured FAQs:** Organized and expanded our FAQ section so you can get up and running smoothly.

!!! tip "Stat Mode"
    **Stat Mode** is a lightweight, opt-in feature that displays Velocmd's current physical memory (RAM) usage in the footer of the launcher. Go to settings, click on "Stat Mode" and toggle it on to see it in action.

### 🚀 Core Highlights in v0.1.2 (Minor Fixes)

* **New Windows App Indexing:** Velocmd also now indexes complex windows bundled apps such as Whatsapp/Spotify, etc.
* **Velocmd commands Prioritised:** Velocmd commands and windows settings are now priortized in the search results.
* **Check for updates:** Now by default, Velocmd checks for updates on startup - with an added button to check for updates manually from the settings panel.
* **Speed and RAM:** The search results are now more consistent and faster, and it consumes less ram in the background.
* **Minor Bug Fixes:** Minor UI tweaks and bug fixes.

!!! tip "Check for updates on startup"
    Now by default, Velocmd checks for updates on startup - with an added button to `check for updates` manually from the settings panel.


### 🚀 Core Highlights in v0.1.1 (Minor Fixes)

* **Minor Bug Fixes:** Fixed UI Glitches and Bugs 
* **Recents:** Recents now off my default to give a more cleaner look always. You can enable it from the settings panel.
* **Desktop/Active Tabs:** Added Desktop and Active Tabs navigation from /velo settings.
* **!cmd functionality:** Use terminal commands with `!cmd` in addition to `/cmd` and `@cmd`.
* **Reset Settings:** Reset Settings button to reset all settings to default.

!!! tip "Now switch between tabs the easy wasy"
    Just go to `/velo` "active tabs" and you will see the new tabs. You can switch between them using the arrow keys.

### 🚀 Core Highlights in v0.1.0

* **Sub-Millisecond Search:** Powered by Rust, the in-memory indexer delivers results the exact moment your finger leaves the keyboard.
* **Smart Chip Filtering:** Instantly narrow your search by typing `/apps`, `/folders`, `/C:`, or `/settings`. You can even chain them together for laser-focused precision.
* **Instant Terminal (`/cmd`):** Bypass the Windows Run prompt entirely. Type `/cmd ping google.com` to spawn a terminal instantly.
* **Deep OS Integration:** Launch over 30 deeply buried Windows settings, from *Environment Variables* to *Registry Editor*, without touching a mouse.
* **Intelligent Recents:** Hit <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>.</kbd> to instantly view your 10 most recently accessed files and commands.

!!! success "Strictly Local. Absolutely Free."
    Velocmd operates with zero telemetry, zero cloud syncing, and zero bloat. Your index is wiped from RAM the moment the application closes.


### How to get it
You can download the lightweight `*-setup.exe` directly from our [GitHub Releases page](https://github.com/YashvardhanG/velocmd/releases/latest).

If you want to read up on all the new features, hotkeys, and system commands, head over to the brand new [Feature Deep Dive](../../features.md). 

Enjoy the speed!