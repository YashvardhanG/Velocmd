---
authors:
  - yashvardhang
description: "Frequently asked questions about Velocmd — installation, system requirements, privacy, performance, and how it compares to PowerToys Run, Flow Launcher, Everything, and Mac Spotlight."
---

<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; margin-top: 0rem;">
  <img src="https://avatars.githubusercontent.com/YashvardhanG" alt="Yashvardhan Gupta" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
  <div style="line-height: 1.2;">
    <strong>Yashvardhan Gupta</strong><br>
    <span style="font-size: 0.85em; color: var(--md-default-fg-color--light);">Creator of Velocmd</span>
  </div>
</div>

## What is Velocmd?
Velocmd is a lightning-fast command palette and native launcher built specifically for Windows. It is designed to be a lightweight, highly optimized replacement for the default Windows search bar, indexing millions of files in seconds and giving users a seamless "Mac Spotlight for Windows" experience.

Windows power users have long suffered through a native search experience that is notoriously slow, bloated with web results, and visually cumbersome. Velocmd was built with a single philosophy: Zero latency, zero bloat, and total keyboard control.

---
## Frequently Asked Questions
### How does Velocmd differ from native Windows Search?
The default Windows search bar often includes web results, causing lag and clutter. Velocmd focuses strictly on local file and application indexing, stripping away the bloat to ensure zero-latency, keystroke-level results.

### Is Velocmd optimized for Windows 11?
Yes, Velocmd is fully optimized for both Windows 10 and Windows 11. It specifically targets the bloated web integration of the native Windows 11 search bar, bypassing it entirely to bring back the instant, locally-focused search experience that power users expect.

### How do I install Velocmd?
You can download Velocmd by visiting the [Releases](https://github.com/YashvardhanG/Velocmd/releases) page on GitHub and downloading the latest release. To know more about the installation process, you can head on to the [Installation & Setup guide](../getting-started/installation/).

### What is the minimum system requirement to run Velocmd?
Velocmd is built to be lightweight and efficient. It requires:

* Windows 10 or later
* 4GB of RAM (8GB recommended for optimal performance)
* 100MB of disk space

### Why did Windows Defender or SmartScreen flag the installation?
Velocmd is 100% safe, open-source, and runs entirely locally on your machine. Because it is a newly released, independent executable without a costly corporate enterprise certificate, Windows SmartScreen may occasionally flag it as an "unrecognized app" during the initial installation. You can safely bypass this by clicking "More info" and then "Run anyway," or you can verify the entire codebase yourself on our GitHub repository.

### What is the default global hotkey to open Velocmd?
```Win + Shift + . (period)``` | But, it can be customized in the settings to fit your workflow.

### What happens if I forget my custom hotkey?
If you forget your hotkey, you can always open the Velocmd settings by finding its icon in the Windows System Tray (the area next to your clock on the taskbar) and right-clicking it. From there, when you go to settings, you can view your current hotkey and even reset it to the default or set a new one.

### Can Velocmd completely replace my Start Menu search?
Absolutely! By binding Velocmd to a global hotkey, you can instantly summon the launcher over any application, completely bypassing the need to open the standard Windows Start Menu.

### What exactly can Velocmd search and launch?
Velocmd is designed to be your central hub. It instantly indexes and launches executable applications (.exe, .lnk), documents, and local files, folders, settings, and more across your drives. (even the small and pesky node_modules!)

### Does Velocmd support search filtering or smart chips?
Yes! To help you refine your search instantly, Velocmd features an intelligent filtering system using smart chips. By typing specific prefixes or syntax, you can instantly narrow down your search results exclusively to applications, folders, or specific file extensions without digging through global, unorganized results.

### What other advanced features does Velocmd offer?
Velocmd is packed with features designed for power users. It supports direct terminal execution, allowing you to run commands directly from the search bar. Additionally, it includes native system state controls, enabling you to toggle system-wide settings like Dark Mode, Bluetooth, and Wi-Fi with simple keyboard shortcuts. To know more about the features, you can head on to the [Feature Deep Dive](../features/).

### Does Velocmd collect my search data or telemetry?
Never! Velocmd is built with absolute privacy in mind. All indexing and searching happen 100% locally on your machine. We do not collect telemetry, track your search queries, or send any of your data to the cloud.

### How fast is the Velocmd local file indexer?
Velocmd's local file indexer is capable of indexing over a million files in under four seconds, making it one of the fastest file indexers available for Windows. Additionally, Velocmd allows the UI to return results the moment you type, making it feel like you're typing in a search-bar.

### Does Velocmd run heavy background processes?
Not at all, Velocmd is built for maximum efficiency. It utilizes a highly optimized local indexing methodology that caches directories without keeping heavy, persistent scanning processes alive in the background, ensuring your CPU and RAM remain free. It does however store your entire index on your RAM, which does cause it to consume a few hundred MBs of RAM, but this is a worthy trade-off for the speed it provides.

### Is Velocmd a faster alternative to PowerToys Run or Flow Launcher?
Yes, while tools like PowerToys Run offer extensive plugin ecosystems, they can sometimes consume significant background resources. Velocmd is engineered with a singular focus on raw speed, providing the fastest command palette experience without background CPU drain.

### Is Velocmd an alternative to the "Everything" app?
Yes, While Voidtools' "Everything" is a powerful search utility, it functions as a traditional windowed application. Velocmd brings that same instant local-indexing speed directly into a sleek, keyboard-driven command palette, acting as a true native launcher rather than just a file explorer.

### Is Velocmd a Mac Spotlight or Raycast alternative for Windows?
Yes, Velocmd is explicitly designed to bring the sleek, keyboard-centric productivity of Mac Spotlight and Raycast to the Windows ecosystem. While native Windows search feels clunky and traditional file explorers slow you down, Velocmd acts as an unobtrusive, instant command palette. It gives you the same premium, zero-friction experience—allowing you to launch apps, find files, and control your system without your hands ever leaving the keyboard.

### How does Velocmd compare to Flow Launcher?
Flow Launcher is a fantastic, highly customizable tool with a massive ecosystem of third-party plugins. However, that reliance on external plugins and a heavier .NET/C# runtime can occasionally lead to micro-stutters or higher background resource consumption.

Velocmd takes a fundamentally different approach. Instead of focusing on a plugin ecosystem, Velocmd is a strictly native, systems-level utility written in Rust. It utilizes a highly optimized, zero-allocation memory arena to index your files directly into RAM. If you want endless third-party extensions, Flow Launcher is a great choice. If you want absolute, zero-latency speed and a minimal CPU footprint straight out of the box, Velocmd is built for you.

### Can I remap Caps Lock to open Velocmd?
A popular workflow for Mac Spotlight and Raycast users is mapping the launcher to the ```Caps Lock key```. While Velocmd allows you to set any standard global hotkey combination (like ```Alt + Space``` or ```Win + Shift + .```), remapping a single hardware key like Caps Lock requires a lightweight routing utility like PowerToys Keyboard Manager or AutoHotkey to trigger your chosen Velocmd shortcut.

### Is Velocmd free and open-source?
Yes, Velocmd is completely free and open-source. You can view the source code on GitHub [here](https://github.com/YashvardhanG/Velocmd).

---
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Velocmd?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Velocmd is a lightning-fast command palette and native launcher built specifically for Windows. It is designed to be a lightweight, highly optimized replacement for the default Windows search bar, indexing millions of files in seconds and giving users a seamless \"Mac Spotlight for Windows\" experience."
      }
    },
    {
      "@type": "Question",
      "name": "How does Velocmd differ from native Windows Search?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The default Windows search bar often includes web results, causing lag and clutter. Velocmd focuses strictly on local file and application indexing, stripping away the bloat to ensure zero-latency, keystroke-level results."
      }
    },
    {
      "@type": "Question",
      "name": "Is Velocmd optimized for Windows 11?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Velocmd is fully optimized for both Windows 10 and Windows 11. It specifically targets the bloated web integration of the native Windows 11 search bar, bypassing it entirely to bring back the instant, locally-focused search experience that power users expect."
      }
    },
    {
      "@type": "Question",
      "name": "How do I install Velocmd?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can download Velocmd by visiting the Releases page on GitHub and downloading the latest release. To know more about the installation process, you can head on to the Installation & Setup guide."
      }
    },
    {
      "@type": "Question",
      "name": "What is the minimum system requirement to run Velocmd?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Velocmd is built to be lightweight and efficient. It requires Windows 10 or later, 4GB of RAM (8GB recommended for optimal performance), and 100MB of disk space."
      }
    },
    {
      "@type": "Question",
      "name": "Why did Windows Defender or SmartScreen flag the installation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Velocmd is 100% safe, open-source, and runs entirely locally on your machine. Because it is a newly released, independent executable without a costly corporate enterprise certificate, Windows SmartScreen may occasionally flag it as an \"unrecognized app\" during the initial installation."
      }
    },
    {
      "@type": "Question",
      "name": "What is the default global hotkey to open Velocmd?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Win + Shift + . (period) | But, it can be customized in the settings to fit your workflow."
      }
    },
    {
      "@type": "Question",
      "name": "What happens if I forget my custom hotkey?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "If you forget your hotkey, you can always open the Velocmd settings by finding its icon in the Windows System Tray and right-clicking it. From there, you can view your current hotkey and reset it."
      }
    },
    {
      "@type": "Question",
      "name": "Can Velocmd completely replace my Start Menu search?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely! By binding Velocmd to a global hotkey, you can instantly summon the launcher over any application, completely bypassing the need to open the standard Windows Start Menu."
      }
    },
    {
      "@type": "Question",
      "name": "What exactly can Velocmd search and launch?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Velocmd is designed to be your central hub. It instantly indexes and launches executable applications (.exe, .lnk), documents, and local files, folders, settings, and more across your drives."
      }
    },
    {
      "@type": "Question",
      "name": "Does Velocmd support search filtering or smart chips?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! To help you refine your search instantly, Velocmd features an intelligent filtering system using smart chips. By typing specific prefixes or syntax, you can instantly narrow down your search results."
      }
    },
    {
      "@type": "Question",
      "name": "What other advanced features does Velocmd offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Velocmd supports direct terminal execution and includes native system state controls for toggling settings like Dark Mode, Bluetooth, and Wi-Fi with keyboard shortcuts."
      }
    },
    {
      "@type": "Question",
      "name": "Does Velocmd collect my search data or telemetry?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Never! Velocmd is built with absolute privacy in mind. All indexing and searching happen 100% locally on your machine. We do not collect telemetry or send any data to the cloud."
      }
    },
    {
      "@type": "Question",
      "name": "How fast is the Velocmd local file indexer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Velocmd's local file indexer is capable of indexing over a million files in under four seconds, making it one of the fastest file indexers available for Windows."
      }
    },
    {
      "@type": "Question",
      "name": "Does Velocmd run heavy background processes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Not at all, Velocmd is built for maximum efficiency. It utilizes a highly optimized local indexing methodology that caches directories without keeping heavy, persistent scanning processes alive in the background."
      }
    },
    {
      "@type": "Question",
      "name": "Is Velocmd a faster alternative to PowerToys Run or Flow Launcher?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, while tools like PowerToys Run offer extensive plugin ecosystems, they can sometimes consume significant background resources. Velocmd is engineered with a singular focus on raw speed."
      }
    },
    {
      "@type": "Question",
      "name": "Is Velocmd an alternative to the \"Everything\" app?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, while Voidtools' \"Everything\" is a powerful search utility, it functions as a traditional windowed application. Velocmd brings that same instant local-indexing speed into a sleek, keyboard-driven command palette."
      }
    },
    {
      "@type": "Question",
      "name": "Is Velocmd a Mac Spotlight or Raycast alternative for Windows?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Velocmd is explicitly designed to bring the sleek, keyboard-centric productivity of Mac Spotlight and Raycast to the Windows ecosystem."
      }
    },
    {
      "@type": "Question",
      "name": "How does Velocmd compare to Flow Launcher?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Velocmd takes a fundamentally different approach. If you want endless third-party extensions, Flow Launcher is a great choice. If you want absolute, zero-latency speed and a minimal CPU footprint straight out of the box, Velocmd is built for you."
      }
    },
    {
      "@type": "Question",
      "name": "Can I remap Caps Lock to open Velocmd?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While Velocmd allows you to set any standard global hotkey combination, remapping a single hardware key like Caps Lock requires a lightweight routing utility like PowerToys Keyboard Manager or AutoHotkey."
      }
    },
    {
      "@type": "Question",
      "name": "Is Velocmd free and open-source?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Velocmd is completely free and open-source. You can view the source code on GitHub."
      }
    }
  ]
}
</script>