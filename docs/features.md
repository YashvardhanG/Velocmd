---
icon: material/feature-search-outline
---

# Feature Deep Dive

Velocmd is packed with power-user features that go far beyond a simple search bar. Below is a detailed guide on every feature available to accelerate your workflow.

---

## Smart Chips & Advanced Filtering

When querying thousands of files, you need precision. Velocmd uses a "Smart Chip" system to filter your search context instantly. 

Type either `/` or `@` followed by a filter keyword. Press <kbd>Space</kbd> to lock the chip in place, then type your search query. You can chain multiple chips together (e.g., `/C: /folders work`).

### Exhaustive Filter List

Velocmd supports multiple aliases for the same filter, allowing you to type whatever feels most natural.

| Primary Chip | Supported Aliases | What it does | Example |
| ------------ | ----------------- | ------------ | ------- |
| `/apps` | `/app`, `/application`, `/exe`, `/lnk` | Restricts search to executable apps | `/apps discord` |
| `/folders` | `/folder`, `/dir`, `/directory` | Restricts search to directories | `/dir projects` |
| `/files` | `/file` | Restricts search to standard files | `/files budget` |
| `/drives` | `/drive`, `/disk` | Filters for top-level mounted drives | `/disk` |
| `/settings` | `/setting`, `/config`, `/setup` | Searches Windows system settings | `/settings display` |
| `/velo` | `@velo` | Exclusively shows internal Velo commands | `/velo recents` |

**Drive Targeting:**
Velocmd detects all your active drives. Filter directly by typing the letter (e.g., `/C:`, `/D:`, `/Z:`).

**File Extension Filtering:**
You can filter by *any* specific file extension natively by typing `/` followed by the extension (e.g., `/pdf`, `/png`, `/rs`, `/js`).

!!! tip "Keyboard Shortcut"
    If you type a chip (like `/apps`) and it is highlighted as the first result, pressing <kbd>Enter</kbd> will automatically convert it into a Smart Chip and clear the text box for your actual query!

---

## Instant Terminal Execution (`/cmd`)

You no longer need to open the Windows Run prompt (`Win+R`) or manually launch `cmd.exe`. Simply type `/cmd` (or `@cmd`), enter your terminal command, and press <kbd>Enter</kbd>.

!!! example "Usage Examples"
    * `/cmd ping google.com` – Spawns a terminal and pings the server.
    * `/cmd ipconfig /flushdns` – Instantly flushes your DNS cache.
    * `/cmd code .` – Opens VS Code in your current directory.

---

## Intelligent Web & Question Routing

Velocmd acts as a bridge to your default web browser, allowing you to bypass the address bar entirely.

### Supported Search Engines
Force a search query to a specific engine using these chips:

| Chip | Engine |
|------|--------|
| `/google` | Google Search |
| `/duck` or `/duckduckgo` | DuckDuckGo |
| `/bing` | Microsoft Bing |
| `/search` | Default System Search Engine |

### Natural Language Detection
Velocmd automatically detects if you are asking a question. If your query starts with any of the following words, it will automatically suggest a Web Search as the top result:
**how**, **what**, **why**, **when**, or **who**.

---

## Deep System & Control Panel Integration

Velocmd hardcodes 32 deeply buried Windows settings and legacy tools into its in-memory index. Simply search for what you want to change, and Velocmd will route you directly to the native module.

### Available System Commands

| Category | Available Commands |
| -------- | ------------------ |
| **System Settings** | Display Settings, Sound Settings, Bluetooth & other devices, Wi-Fi Settings, Personalization, Taskbar Settings, Date & Time Settings, Power & Sleep Settings, Storage Settings, Background Apps, Notifications & actions, Default Apps. |
| **App Management** | Startup Apps, Uninstall Program, Apps & Features, Installed Apps, Windows Update. |
| **Legacy OS Tools** | Control Panel, Task Manager, Command Prompt, PowerShell, Registry Editor, Environment Variables, System Properties, Network Connections, Disk Management, Device Manager, Services, Group Policy Editor, Resource Monitor, Event Viewer, System Information. |

---

## Keeping Your Index Updated

Because Velocmd runs entirely in memory to maintain its blazing speed, it needs to periodically sync with your hard drive to learn about new files.

* **Automatic Refresh:** Velocmd silently rescans your drives and updates its index in the background every **15 minutes**.
* **Manual Refresh:** If you just installed a new application or downloaded a file and need it to appear immediately, you can force a resync. Simply type `/velo` and select **Velo: Refresh Index** (or just search `Refresh`), then hit <kbd>Enter</kbd>.

---

## Internal Velo Commands

You can control Velocmd's behavior directly from the search bar. Typing `/velo` (or `@velo`) will reveal the following internal commands:

| Command Name | Action |
| ------------ | ------ |
| **Velo Settings** | Opens the inline configuration panel. |
| **Velo: Toggle Recents** | Turns the intelligent "Recent Files" view on or off. |
| **Velo: Clear Recents** | Wipes your local history from the interface immediately. |
| **Velo: Reset Position** | Snaps the search bar back to the top-center of your primary display. |

---

## Power & Media Controls

Control your environment without leaving your keyboard.

### Media Playback
Search for these commands to control your background music/video natively via the Windows API:

* `Media: Play/Pause`
* `Media: Next Track`
* `Media: Previous Track`

### Safe Power States
Type `Shutdown` or `Restart`. Velocmd provides a built-in safety net: when you hit Enter, it will ask:

* `✅ Yes, I am sure`
* `❌ No, Cancel`

---

## System Tray Background Process

Velocmd runs silently in the background to ensure instantaneous response times. You will find the Velo monkey icon sitting in your Windows System Tray (bottom right corner).

* **Left-Click:** Instantly shows or hides the command palette.
* **Right-Click:** Opens the context menu to quit the application entirely.

---

## The Velo Settings Panel

Press <kbd>Tab</kbd> while the launcher is open to flip down the inline Settings panel. 

### Customizing the Global Shortcut
By default, Velocmd opens with <kbd>Win</kbd> + <kbd>Shift</kbd> + <kbd>.</kbd> (Win+Shift+Period). In the settings panel, you can click the shortcut display to open a dropdown of alternatives. Velocmd will automatically verify if the shortcut is available on your Windows machine before applying it.

**Supported Preset Shortcuts:**
If your desired shortcut is taken by another app, Velocmd provides these tested fallback options:

- `Win + Shift + .` (Default)
- `Alt + Space`
- `Win + Space`
- `Ctrl + Space`
- `Ctrl + Shift + Space`
- `Win + S`
- `Alt + S`
- `Win + /`

!!! note "Fallback Logic"
    If your chosen shortcut (or the default) is already in use by another application upon startup, Velocmd will automatically test the list above and assign the first available hotkey, ensuring you are never locked out of the launcher.

### Autostart Management
Toggle "Start with Windows" directly from the panel to ensure Velocmd's in-memory index is always ready the moment you log in.