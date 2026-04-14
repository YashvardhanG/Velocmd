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

Whether you are navigating thousands of local files or executing rapid-fire terminal scripts, v0.1.1 acts as the ultimate Windows power tool. Here is a look at what is packed into this release:

### 🚀 Core Highlights in v0.1.0

* **Sub-Millisecond Search:** Powered by Rust, the in-memory indexer delivers results the exact moment your finger leaves the keyboard.
* **Smart Chip Filtering:** Instantly narrow your search by typing `/apps`, `/folders`, `/C:`, or `/settings`. You can even chain them together for laser-focused precision.
* **Instant Terminal (`/cmd`):** Bypass the Windows Run prompt entirely. Type `/cmd ping google.com` to spawn a terminal instantly.
* **Deep OS Integration:** Launch over 30 deeply buried Windows settings, from *Environment Variables* to *Registry Editor*, without touching a mouse.
* **Intelligent Recents:** Hit <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>.</kbd> to instantly view your 10 most recently accessed files and commands.

!!! success "Strictly Local. Absolutely Free."
    Velocmd operates with zero telemetry, zero cloud syncing, and zero bloat. Your index is wiped from RAM the moment the application closes.

### 🚀 Core Highlights in v0.1.1 (Minor Fixes)

* **Minor Bug Fixes:** Fixed UI Glitches and Bugs 
* **Recents:** Recents now off my default to give a more cleaner look always. You can enable it from the settings panel.
* **Desktop/Active Tabs:** Added Desktop and Active Tabs navigation from /velo settings.
* **!cmd functionality:** Use terminal commands with `!cmd` in addition to `/cmd` and `@cmd`.
* **Reset Settings:** Reset Settings button to reset all settings to default.

!!! tip "Now switch between tabs the easy wasy"
    Just go to `/velo` "active tabs" and you will see the new tabs. You can switch between them using the arrow keys.


### How to get it
You can download the lightweight `*-setup.exe` directly from our [GitHub Releases page](https://github.com/YashvardhanG/velocmd/releases/latest).

If you want to read up on all the new features, hotkeys, and system commands, head over to the brand new [Feature Deep Dive](../../features.md). 

Enjoy the speed!