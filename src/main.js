const { invoke } = window.__TAURI__.core;
const { getCurrentWindow } = window.__TAURI__.window;
const { listen } = window.__TAURI__.event;

const input = document.getElementById("search-input");
const container = document.getElementById("container");
const resultsContainer = document.getElementById("results-container");
const resultsList = document.getElementById("results");
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const recentsToggle = document.getElementById("show-recents-toggle");
const clearRecentsBtn = document.getElementById("clear-recents-btn");
const resetPosBtn = document.getElementById("reset-pos-btn");
const shortcutDisplay = document.getElementById("shortcut-display");
const shortcutDropdown = document.getElementById("shortcut-dropdown");
const shortcutMsg = document.getElementById("shortcut-msg");
const startupToggle = document.getElementById("startup-toggle");
const analyticsToggle = document.getElementById("analytics-toggle");
const updateBtn = document.getElementById("update-btn");
const memoryDisplay = document.getElementById("memory-usage");
const helpBtn = document.getElementById("help-btn");
const searchWrapper = document.querySelector(".search-wrapper");
const loaderHtml = `
  <div id="search-loader" class="loader-dots hidden">
    <div class="loader-dot"></div>
    <div class="loader-dot"></div>
    <div class="loader-dot"></div>
  </div>`;
searchWrapper.insertAdjacentHTML('beforeend', loaderHtml);
const searchLoader = document.getElementById("search-loader");
const CURRENT_VERSION = "0.1.5";
let isUpdateAvailable = false;
let latestReleaseUrl = "https://github.com/YashvardhanG/Velocmd/releases/latest";

let settingsIndex = -1;
let dropdownIndex = -1;
let isAllSelected = false;
let currentSearchId = 0;
let lastRenderedSearchId = 0;
let hasCheckedStartupUpdate = false;

let state = {
  results: [],
  recentFiles: [],
  selectedIndex: 0,
  showRecents: false,
  activeFilters: []
};

const PRESET_SHORTCUTS = [
  "Super+Shift+.",
  "Alt+Space",
  "Super+Space",
  "Ctrl+Space",
  "Ctrl+Shift+Space",
  "Super+S",
  "Alt+S",
  "Super+/"
];

const savedRecents = localStorage.getItem("recentFiles");
if (savedRecents) state.recentFiles = JSON.parse(savedRecents);

const savedShowRecents = localStorage.getItem("showRecentsSetting");
if (savedShowRecents !== null) {
  state.showRecents = JSON.parse(savedShowRecents);
  recentsToggle.checked = state.showRecents;
}

const savedAnalytics = localStorage.getItem("analyticsSetting");
let showAnalytics = savedAnalytics === "true";
if (analyticsToggle) {
  analyticsToggle.checked = showAnalytics;
  if (showAnalytics) memoryDisplay.classList.remove("hidden");
}

async function updateMemoryUsage() {
  if (!showAnalytics) return;
  try {
    const bytes = await invoke("get_memory_usage");
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    memoryDisplay.textContent = `RAM: ${mb}MB`;
  } catch (e) {
    console.error("Failed to get memory usage:", e);
  }
}

setInterval(updateMemoryUsage, 2000);

function getSettingsFocusables() {
  const base = [
    recentsToggle.parentElement,
    startupToggle.parentElement,
    clearRecentsBtn,
    resetPosBtn,
    shortcutDisplay,
    updateBtn,
    helpBtn,
    analyticsToggle.parentElement
  ];
  return base.filter(el => el !== null);
}

function renderSettingsFocus() {
  const items = getSettingsFocusables();
  items.forEach((item, idx) => {
    if (idx === settingsIndex) {
      item.classList.add("selected");
    } else {
      item.classList.remove("selected");
    }
  });
}

function renderDropdownFocus() {
  const options = document.querySelectorAll(".shortcut-option");
  options.forEach((opt, idx) => {
    if (idx === dropdownIndex) {
      opt.classList.add("selected");
      opt.scrollIntoView({ block: "nearest" });
    } else {
      opt.classList.remove("selected");
    }
  });
}

invoke("set_recents_state", { show: state.showRecents });

const WINDOW_MAX_HEIGHT = 400;

async function toggleSettings() {
  const isOpening = settingsPanel.classList.contains("hidden");

  if (isOpening) {
    await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
    lastWindowHeight = WINDOW_MAX_HEIGHT;

    settingsIndex = -1;
    renderSettingsFocus();

    settingsPanel.classList.remove("hidden");
    settingsBtn.classList.add("active");
    resultsContainer.classList.add("hidden");

    if (!state.activeFilters.includes("/settings")) {
      state.activeFilters.push("/settings");
      renderChips();
    }
  } else {
    settingsPanel.classList.add("hidden");
    getSettingsFocusables().forEach(el => el.classList.remove("selected"));
    settingsBtn.classList.remove("active");

    state.activeFilters = state.activeFilters.filter(f => f !== "/settings");
    renderChips();

    const hasInput = input.value.trim().length > 0;

    if (state.showRecents) {
      resultsContainer.classList.remove("hidden");
      await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
      lastWindowHeight = WINDOW_MAX_HEIGHT;
    } else {
      if (hasInput || state.activeFilters.length > 0) {
        resultsContainer.classList.remove("hidden");
        await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
        lastWindowHeight = WINDOW_MAX_HEIGHT;
      } else {
        state.results = [];
        resultsContainer.classList.add("hidden");
        await invoke("reset_window");
        lastWindowHeight = 65;
      }
    }
  }

  render();
  setTimeout(() => input.focus(), 10);
}

settingsBtn.onclick = (e) => {
  e.stopPropagation();
  toggleSettings();
};

recentsToggle.onchange = (e) => {
  state.showRecents = e.target.checked;
  localStorage.setItem("showRecentsSetting", state.showRecents);
  invoke("set_recents_state", { show: state.showRecents });
  render();
};

if (analyticsToggle) {
  analyticsToggle.onchange = (e) => {
    showAnalytics = e.target.checked;
    localStorage.setItem("analyticsSetting", showAnalytics);
    if (showAnalytics) {
      memoryDisplay.classList.remove("hidden");
      updateMemoryUsage();
    } else {
      memoryDisplay.classList.add("hidden");
    }
  };
}

clearRecentsBtn.onclick = () => {
  state.recentFiles = [];
  localStorage.setItem("recentFiles", JSON.stringify([]));

  clearRecentsBtn.textContent = "Recents Cleared!";
  clearRecentsBtn.style.backgroundColor = "#4caf50";
  setTimeout(() => {
    clearRecentsBtn.textContent = "Clear Recents";
    clearRecentsBtn.style.backgroundColor = "";
  }, 1000);

  render();
};

resetPosBtn.onclick = async () => {
  state.showRecents = false;
  recentsToggle.checked = false;
  localStorage.setItem("showRecentsSetting", false);
  invoke("set_recents_state", { show: false });

  showAnalytics = false;
  localStorage.setItem("analyticsSetting", false);
  if (analyticsToggle) analyticsToggle.checked = false;
  if (memoryDisplay) memoryDisplay.classList.add("hidden");

  try {
    await invoke("plugin:autostart|enable");
    if (startupToggle) startupToggle.checked = true;
  } catch (err) {
    console.error("Reset autostart error:", err);
  }

  const defaultShortcut = PRESET_SHORTCUTS[0];
  await applyShortcut(defaultShortcut);

  await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
  lastWindowHeight = WINDOW_MAX_HEIGHT;
};

async function checkUpdates(isAuto = false) {
  try {
    if (!isAuto && updateBtn) {
      updateBtn.textContent = "Checking...";
      updateBtn.classList.remove("btn-success", "btn-update-available");
      updateBtn.classList.add("btn-secondary");
    }

    const response = await fetch("https://api.github.com/repos/YashvardhanG/Velocmd/releases/latest");
    const data = await response.json();

    if (!data.tag_name) return;

    latestReleaseUrl = data.html_url;

    const latestVersion = data.tag_name.replace("v", "");

    if (latestVersion !== CURRENT_VERSION) {
      isUpdateAvailable = true;
      if (isAuto) {
        input.placeholder = "⚡A Newer version is available, download now!";
        setTimeout(() => {
          input.placeholder = "⚡Velocmd running...";
        }, 2000);
      }

      if (updateBtn) {
        updateBtn.textContent = "Download Update";
        updateBtn.classList.remove("btn-secondary", "btn-success");
        updateBtn.classList.add("btn-update-available");
      }
    } else {
      if (!isAuto && updateBtn) {
        updateBtn.textContent = "Up to Date!";
        updateBtn.classList.remove("btn-secondary");
        updateBtn.classList.add("btn-success");
        setTimeout(() => {
          updateBtn.textContent = "Check for Updates";
          updateBtn.classList.remove("btn-success");
          updateBtn.classList.add("btn-secondary");
        }, 3000);
      }
    }
  } catch (err) {
    console.error("Update check failed:", err);
    if (!isAuto && updateBtn) {
      updateBtn.textContent = "Check Failed";
      setTimeout(() => {
        updateBtn.textContent = "Check for Updates";
      }, 3000);
    }
  }
}

if (updateBtn) {
  updateBtn.onclick = async (e) => {
    e.stopPropagation();
    if (isUpdateAvailable) {
      updateBtn.textContent = "Verifying...";
      try {
        const response = await fetch("https://api.github.com/repos/YashvardhanG/Velocmd/releases/latest");
        const data = await response.json();
        const latestVersion = data.tag_name?.replace("v", "");

        if (latestVersion && latestVersion !== CURRENT_VERSION) {
          updateBtn.textContent = "Download Update";
          await invoke("open_file", { path: data.html_url });
        } else {
          isUpdateAvailable = false;
          updateBtn.textContent = "Up to Date!";
          updateBtn.classList.remove("btn-update-available");
          updateBtn.classList.add("btn-success");
          setTimeout(() => {
            updateBtn.textContent = "Check for Updates";
            updateBtn.classList.remove("btn-success");
            updateBtn.classList.add("btn-secondary");
          }, 3000);
        }
      } catch (err) {
        updateBtn.textContent = "Download Update";
        await invoke("open_file", { path: latestReleaseUrl });
      }
    } else {
      checkUpdates(false);
    }
  };
}

function getFileIcon(path, kind) {
  const tpath = path.toLowerCase().replace(/\//g, '\\');
  const isUserProfile = /^c:\\users\\[^\\]+\\[^\\]+$/.test(tpath) || /^c:\\users\\[^\\]+$/.test(tpath) || /^c:\\documents and settings\\[^\\]+\\[^\\]+$/.test(tpath);

  if (isUserProfile) {
    if (tpath.endsWith("\\downloads")) return "📥";
    if (tpath.endsWith("\\pictures") || tpath.endsWith("\\gallery")) return "🏞️";
    if (tpath.endsWith("\\documents")) return "📝";
    if (tpath.endsWith("\\music")) return "🎵";
    if (tpath.endsWith("\\videos")) return "🎬";
    if (tpath.endsWith("\\desktop")) return "🖥️";
  }

  if (tpath.includes("recyclebinfolder")) return "🗑️";

  if (kind === "app") return "🚀";
  if (kind === "folder") return "📁";
  if (kind === "drive") return "💽";
  if (kind === "command") return "⚙️";
  if (kind === "website") return "🌐";
  if (kind === "filter") return "🔍";
  if (kind === "terminal_command") return "💻";

  const ext = path.split('.').pop().toLowerCase();

  if (['rs', 'go', 'py', 'js', 'ts', 'html', 'css', 'cpp', 'c'].includes(ext)) return "💻";
  if (['json', 'yaml', 'xml', 'toml'].includes(ext)) return "⚙️";
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'].includes(ext)) return "🖼️";
  if (['mp4', 'mkv', 'mov', 'avi'].includes(ext)) return "🎥";
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return "🎵";
  if (['pdf'].includes(ext)) return "📕";
  if (['doc', 'docx'].includes(ext)) return "📘";
  if (['xls', 'xlsx', 'csv'].includes(ext)) return "📊";
  if (['txt', 'md'].includes(ext)) return "📝";
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) return "📦";

  return "📄";
}

function selectAllChips() {
  isAllSelected = true;
  document.querySelectorAll(".chip").forEach(el => el.classList.add("selected"));
  input.select();
}

function deselectChips() {
  input.setSelectionRange(input.value.length, input.value.length);

  if (!isAllSelected) return;
  isAllSelected = false;
  document.querySelectorAll(".chip").forEach(el => el.classList.remove("selected"));
}

function renderChips() {
  const chipsArea = document.getElementById("chips-area");
  chipsArea.innerHTML = "";

  state.activeFilters.forEach((filter, index) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `
      ${filter}
      <span class="chip-close">×</span>
    `;

    chip.querySelector(".chip-close").onclick = (e) => {
      e.stopPropagation();
      removeFilter(index);
    };

    chipsArea.appendChild(chip);
  });

  const hasPrivate = state.activeFilters.some(f => f.toLowerCase() === "/p" || f.toLowerCase() === "@p");
  if (hasPrivate) {
    input.placeholder = "🕶️ Private mode | Browsing Incognito";
  } else if (input.placeholder.includes("Private mode") || input.placeholder.includes("🕶")) {
    input.placeholder = "⚡Velocmd running...";
  }
}

function removeFilter(index) {
  state.activeFilters.splice(index, 1);
  renderChips();
  input.dispatchEvent(new Event('input'));
  input.focus();
}

async function openWeb(query, engine) {
  let url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  if (engine === "@bing") {
    url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  } else if (engine === "@duck" || engine === "@duckduckgo") {
    url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  }

  const isPrivate = state.activeFilters.some(f => f.toLowerCase() === "/p" || f.toLowerCase() === "@p");

  if (isPrivate) {
    await invoke("open_url_private", { url });
  } else {
    await invoke("open_file", { path: url });
  }
}

async function render() {
  const rawInput = input.value.trim();
  const nonPrivateFilters = state.activeFilters.filter(f => f.toLowerCase() !== "/p" && f.toLowerCase() !== "@p");
  const fullQuery = [...nonPrivateFilters, rawInput].join(" ").trim();
  const hasChips = state.activeFilters.length > 0;
  const isInputEmpty = rawInput.length === 0;

  if (isInputEmpty && !hasChips && !state.showRecents) {
    resultsContainer.classList.add("hidden");
    searchLoader.classList.add("hidden");
    resultsList.innerHTML = "";
    updateContainerMinimalState();
    return;
  }

  resultsList.innerHTML = "";
  let items = [];

  const isPrivateMode = state.activeFilters.some(f => f.toLowerCase() === "/p" || f.toLowerCase() === "@p");

  const webTriggers = ["@google", "@duck", "@duckduckgo", "@bing", "@search", "/google", "/duck", "/duckduckgo", "/bing", "/search"];
  const questionWords = ["how", "what", "why", "when", "who"];

  let matchedTrigger = webTriggers.find(t => fullQuery.toLowerCase().startsWith(t));
  let lowQuery = fullQuery.toLowerCase().trim();
  let isWebIntent = matchedTrigger !== undefined ||
    questionWords.some(w => lowQuery === w || lowQuery.startsWith(w + " "));

  let webQuery = fullQuery;
  let activeEngine = "@search";

  if (matchedTrigger) {
    if (matchedTrigger.startsWith("/")) {
      activeEngine = "@" + matchedTrigger.substring(1);
    } else {
      activeEngine = matchedTrigger;
    }
    webQuery = webQuery.substring(matchedTrigger.length).trim();
  }

  if (!settingsPanel.classList.contains("hidden")) {
    items = [];
  } else if (isInputEmpty && !hasChips && state.results.length === 0) {
    if (state.showRecents) {
      items = state.recentFiles;
    } else {
      items = [];
    }
  } else {
    items = state.results;
  }

  const fullQ = fullQuery.trim().toLowerCase();
  let isCmdIntent = fullQ.startsWith("@cmd") || fullQ.startsWith("/cmd") || fullQ.startsWith("!cmd");

  if (isCmdIntent && !isInputEmpty) {
    const command = fullQuery.substring(4).trim();
    const cmdItem = document.createElement("li");
    cmdItem.className = `result-item cmd-item ${state.selectedIndex === 0 ? "selected" : ""}`;
    cmdItem.innerHTML = `
        <span class="result-icon">💻</span> 
        <div class="result-content">
          <span class="result-name">Run Command</span>
          <span class="result-path">${command.length > 0 ? `"${command}"` : '(type your command...)'}</span>
        </div>`;

    if (command.length > 0) {
      cmdItem.onclick = () => openFile(command, "terminal_command", "Run: " + command);
    }
    cmdItem.onmouseenter = () => { state.selectedIndex = 0; renderStyles(); };
    resultsList.appendChild(cmdItem);

    updateContainerMinimalState();
    return;
  }

  if (isWebIntent && !isInputEmpty) {
    const webItem = document.createElement("li");
    webItem.className = `result-item web-search-item ${(state.selectedIndex === 0 && !isCmdIntent) ? "selected" : ""}`;

    let engineName = "Web";
    if (activeEngine !== "@search") {
      engineName = activeEngine.substring(1).charAt(0).toUpperCase() + activeEngine.substring(2);
    }

    const searchIcon = isPrivateMode ? "🕶️" : "🌍";
    const searchLabel = isPrivateMode ? `Search Incognito` : `Search ${engineName}`;

    webItem.innerHTML = `
        <span class="result-icon">${searchIcon}</span> 
        <div class="result-content">
          <span class="result-name">${searchLabel}</span>
          <span class="result-path">"${webQuery}"</span>
        </div>`;

    webItem.onclick = () => openWeb(webQuery, activeEngine);
    webItem.onmouseenter = () => { state.selectedIndex = isCmdIntent ? 1 : 0; renderStyles(); };

    if (!isCmdIntent) resultsList.appendChild(webItem);
  }

  if (items.length === 0 && !isWebIntent && !isCmdIntent && (!isInputEmpty || hasChips)) {
    const noResults = document.createElement("div");
    noResults.className = "empty-state";
    if (hasChips && isInputEmpty) {
      noResults.innerHTML = `
        <span>Nothing found with these filters, try changing your chips</span>
      `;
    } else {
      noResults.innerHTML = `
        <span>No results found for "${rawInput}"</span>
      `;
    }
    resultsList.appendChild(noResults);
    updateContainerMinimalState();
    return;
  }

  items.forEach((item, index) => {
    const effectiveOffset = isWebIntent ? 1 : 0;
    const visualIndexCorrect = index + effectiveOffset;
    const isSelected = visualIndexCorrect === state.selectedIndex;

    const path = typeof item === 'string' ? item : item.path;
    const kind = typeof item === 'string' ? 'file' : item.kind;
    const name = typeof item === 'string' ? path.split('\\').pop() : (item.name || path.split('\\').pop());
    const iconData = (typeof item !== 'string' && item.icon_data) ? item.icon_data : null;

    const li = document.createElement("li");
    li.className = `result-item ${isSelected ? "selected" : ""}`;

    let iconHtml;
    if (iconData) {
      iconHtml = `<img src="${iconData}" class="app-icon" alt="icon" />`;
    } else {
      iconHtml = `<span class="result-icon">${getFileIcon(path, kind)}</span>`;
    }

    let displayPath = path;
    if (kind === 'app') {
      displayPath = "Application";
    } else if (kind === 'active_tab') {
      const parts = path.split('|');
      if (parts.length > 1) {
        displayPath = `${parts[1]} (${parts[0]})`;
      }
    }

    // if (kind !== 'app' && (displayPath === "Application" || path.startsWith("shell:AppsFolder") || path.toLowerCase().endsWith(".exe") || path.toLowerCase().endsWith(".lnk"))) {
    //   kind = 'app';
    // }

    li.innerHTML = `
      ${iconHtml}
      <div class="result-content">
        <span class="result-name">${name}</span>
        <span class="result-path">${displayPath}</span>
      </div>`;

    li.onclick = () => openFile(path, kind, name);
    li.onmouseenter = () => {
      state.selectedIndex = visualIndexCorrect;
      renderStyles();
    };
    resultsList.appendChild(li);
  });

  const renderedAnyItems = items.length > 0;
  let showedEmptyRecentMessage = false;

  if (isInputEmpty && state.showRecents && items.length === 0 && !hasChips) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-recents-message";
    emptyMessage.innerHTML = `
      <span class="result-icon">ℹ️</span>
      <div class="result-content">
        <span class="result-name">Recents will show here</span>
        <span class="result-path">Toggle on/off from settings</span>
      </div>`;
    resultsList.appendChild(emptyMessage);
    showedEmptyRecentMessage = true;
  }

  const hasContent = renderedAnyItems || isWebIntent || isCmdIntent || showedEmptyRecentMessage || (items.length === 0 && !isWebIntent && !isCmdIntent && !isInputEmpty);

  if (hasContent && settingsPanel.classList.contains("hidden")) {
    resultsContainer.classList.remove("hidden");
  } else {
    resultsContainer.classList.add("hidden");
  }

  updateContainerMinimalState();
}

function updateContainerMinimalState() {
  const isSettingsHidden = settingsPanel.classList.contains("hidden");
  const isResultsHidden = resultsContainer.classList.contains("hidden");

  if (isSettingsHidden && isResultsHidden) {
    container.classList.add("minimal-state");
  } else {
    container.classList.remove("minimal-state");
  }
}

function renderStyles() {
  const items = document.querySelectorAll(".result-item");
  items.forEach((item, index) => {
    if (index === state.selectedIndex) {
      item.classList.add("selected");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("selected");
    }
  });
}

async function openFile(path, kind, name) {
  if (path.startsWith("nox:")) {
    const action = path.replace("nox:", "");
    if (action === "install" || action === "check_updates") {
      await invoke("open_file", { path: "https://github.com/YashvardhanG/Nox-Dimmer/releases/latest" });
    } else if (action === "help") {
      await invoke("open_file", { path: "https://github.com/YashvardhanG/Nox-Dimmer" });
    } else {
      await invoke("execute_nox_command", { action, value: null });
    }

    input.value = "";
    state.activeFilters = [];
    renderChips();
    state.results = [];

    if (!state.showRecents) {
      await invoke("reset_window");
      lastWindowHeight = 65;
    }
    render();
    return;
  }

  const isPrivateMode = state.activeFilters.some(f => f.toLowerCase() === "/p" || f.toLowerCase() === "@p");

  if (!isPrivateMode) {
    const validName = name || path.split('\\').pop();
    const newItem = { path, kind, name: validName };
    const filtered = state.recentFiles.filter(p => (typeof p === 'string' ? p : p.path) !== path);
    state.recentFiles = [newItem, ...filtered].slice(0, 10);
    localStorage.setItem("recentFiles", JSON.stringify(state.recentFiles));
  }

  if (path === "velo:request_shutdown") {
    input.value = "";

    state.results = [
      { name: "✅ Yes, I am sure (Shutdown)", path: "cmd:shutdown /s /t 0", kind: "command", score: 10 },
      { name: "❌ No, Cancel", path: "velo:cancel_power", kind: "command", score: 9 }
    ];

    state.selectedIndex = 0;
    render();
    return;
  }

  if (path === "velo:request_restart") {
    input.value = "";

    state.results = [
      { name: "✅ Yes, I am sure (Restart)", path: "cmd:shutdown /r /t 0", kind: "command", score: 10 },
      { name: "❌ No, Cancel", path: "velo:cancel_power", kind: "command", score: 9 }
    ];
    state.selectedIndex = 0;
    render();
    return;
  }

  if (path === "velo:cancel_power") {
    input.value = "";
    state.results = [];

    if (!state.showRecents) {
      await invoke("reset_window");
      lastWindowHeight = 65;
    }

    render();
    input.focus();
    return;
  }

  if (path === "velo:settings") {
    await toggleSettings();
    input.value = "";
    state.results = [];
    render();
    input.focus();
    return;
  }

  if (path === "velo:clear_recents") {
    state.recentFiles = [];
    localStorage.setItem("recentFiles", JSON.stringify([]));
    input.value = "";
    render();
    return;
  }

  if (path === "velo:toggle_recents") {
    state.showRecents = !state.showRecents;
    localStorage.setItem("showRecentsSetting", state.showRecents);
    recentsToggle.checked = state.showRecents;
    input.value = "";

    if (!state.showRecents) {
      await invoke("reset_window");
      lastWindowHeight = 65;
    } else {
      await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
      lastWindowHeight = WINDOW_MAX_HEIGHT;
    }

    render();
    return;
  }

  if (path === "velo:help") {
    await invoke("open_file", { path: "https://yashvardhang.github.io/Velocmd/" });
    input.value = "";
    state.results = [];
    render();
    return;
  }

  if (path === "velo:reset_position") {
    await invoke("reset_window");
    input.value = "";
    render();
    return;
  }

  if (path === "velo:quit") {
    await invoke("quit_app");
    return;
  }

  if (path === "velo:close_window") {
    await invoke("close_active_window");
    input.value = "";
    render();
    return;
  }

  if (path === "velo:show_desktop") {
    await invoke("show_desktop");
    input.value = "";
    render();
    return;
  }

  if (path === "velo:active_tabs") {
    state.activeFilters.push("/tabs");
    renderChips();
    input.value = "";
    input.focus();
    input.dispatchEvent(new Event('input'));
    return;
  }

  if (path.startsWith("hwnd:")) {
    const hwndVal = parseInt(path.split(":")[1].split("|")[0]);
    await invoke("focus_window", { hwndVal });
    input.value = "";
    render();
    return;
  }

  if (path === "velo:refresh") {
    input.disabled = true;
    input.value = "";
    input.placeholder = "⌛ Refreshing index...";
    state.results = [];
    state.activeFilters = [];
    renderChips();

    resultsList.innerHTML = `
      <div class="empty-recents-message">
        <span class="result-icon" style="animation: spin 2s linear infinite;">⏳</span>
        <div class="result-content">
          <span class="result-name">Refreshing File Index...</span>
          <span class="result-path">This will just take a moment</span>
        </div>
      </div>`;
    resultsContainer.classList.remove("hidden");
    await invoke("trigger_index_refresh");
    return;
  }

  if (kind === "filter") {
    // input.value = path;
    // input.focus();
    // input.dispatchEvent(new Event('input'));
    // return;

    state.activeFilters.push(path.trim());
    renderChips();

    input.value = "";
    input.focus();
    input.dispatchEvent(new Event('input'));
    return;
  }

  if (path.startsWith("velo:media_")) {
    const action = path.replace("velo:media_", "");
    await invoke("execute_media_key", { action });

    input.value = "";
    state.activeFilters = [];
    renderChips();
    state.results = [];
    render();

    return;
  }

  if (kind === "terminal_command") {
    await invoke("run_terminal_command", { command: path });
    input.value = "";
    state.results = [];
    render();
    return;
  }

  const isPrivate = state.activeFilters.some(f => f.toLowerCase() === "/p" || f.toLowerCase() === "@p");

  if (isPrivate && (path.startsWith("http://") || path.startsWith("https://"))) {
    await invoke("open_url_private", { url: path });
  } else {
    await invoke("open_file", { path });
  }
  input.value = "";
  render();
}

// let debounceTimeout;
input.addEventListener("input", async (e) => {
  let val = input.value;

  if (val.endsWith(" ") && val.trim().length > 1) {
    const words = val.split(" ");
    const lastWord = words[words.length - 2];

    if (lastWord.startsWith("@") || lastWord.startsWith("/") || lastWord.startsWith("!")) {
      state.activeFilters.push(lastWord);
      renderChips();

      input.value = "";
      val = "";
    }
  }

  deselectChips();

  const isSettingsOpen = !settingsPanel.classList.contains("hidden");
  const hasSettingsFilter = state.activeFilters.includes("/settings");
  if (isSettingsOpen && (val.trim().length > 0 || !hasSettingsFilter)) {
    await toggleSettings();
  }

  // clearTimeout(debounceTimeout);

  // debounceTimeout = setTimeout(async () => {
  const query = [...state.activeFilters.filter(f => f.toLowerCase() !== "/p" && f.toLowerCase() !== "@p"), val].join(" ").trim();

  currentSearchId++;
  const thisSearchId = currentSearchId;
  state.selectedIndex = 0;

  const hasPrivateChip = state.activeFilters.some(f => f.toLowerCase() === "/p" || f.toLowerCase() === "@p");

  if (query.trim().length === 0 && !hasPrivateChip) {
    state.results = [];
    lastRenderedSearchId = thisSearchId;
    searchLoader.classList.add("hidden");
    resultsContainer.classList.add("hidden");
    if (!state.showRecents && settingsPanel.classList.contains("hidden")) {
      await invoke("reset_window");
      lastWindowHeight = 65;
    }
    render();
    return;
  }

  if (query.trim().length > 0) {
    if (lastWindowHeight !== WINDOW_MAX_HEIGHT) {
      await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
      lastWindowHeight = WINDOW_MAX_HEIGHT;
    }
    resultsContainer.classList.remove("hidden");
  }

  const valTrimmed = val.trim();
  const isFilterTrigger = valTrimmed.startsWith("@") || valTrimmed.startsWith("/") || valTrimmed.startsWith("!");

  if (isFilterTrigger && valTrimmed.indexOf(" ") === -1) {
    const drives = await invoke("get_available_drives");
    const prefix = valTrimmed[0];
    const searchTerm = valTrimmed.substring(1).toLowerCase();

    const driveItems = drives.map(d => ({
      name: `Drive ${d}`,
      path: `${prefix}${d[0].toLowerCase()}:`,
      kind: "filter",
      score: 97
    }));

    const allFilters = [
      { name: "Applications", path: `${prefix}apps `, kind: "filter", score: 100 },
      { name: "Folders", path: `${prefix}folders `, kind: "filter", score: 99 },
      { name: "Files", path: `${prefix}files `, kind: "filter", score: 98 },
      ...driveItems,
      { name: "Active Tabs", path: `${prefix}tabs `, kind: "filter", score: 95 },
      { name: "Velo Commands", path: `${prefix}velo `, kind: "filter", score: 94 },
      { name: "This PC", path: `${prefix}pc `, kind: "filter", score: 93 },
      { name: "Websites", path: `${prefix}web `, kind: "filter", score: 92 },
      { name: "Settings", path: `${prefix}settings`, kind: "filter", score: 91 },
      { name: "Run Command", path: `${prefix}cmd `, kind: "filter", score: 90 },
      { name: "Web Search", path: `${prefix}search `, kind: "filter", score: 89 }
    ];

    const matchedFilters = allFilters.filter(f => {
      const cleanPath = f.path.toLowerCase().substring(1).trim();
      return cleanPath.startsWith(searchTerm) || f.name.toLowerCase().includes(searchTerm);
    });

    if (matchedFilters.length > 0) {
      state.results = matchedFilters.sort((a, b) => b.score - a.score);
      if (resultsContainer.classList.contains("hidden")) {
        invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
        lastWindowHeight = WINDOW_MAX_HEIGHT;
        resultsContainer.classList.remove("hidden");
      }
      render();
      return;
    }
  }

  if (resultsContainer.classList.contains("hidden") || (!state.showRecents && state.results.length === 0)) {
    invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
    lastWindowHeight = WINDOW_MAX_HEIGHT;
    resultsContainer.classList.remove("hidden");
  }

  searchLoader.classList.remove("hidden");
  const searchQuery = [...state.activeFilters, val].join(" ").trim();
  const results = await invoke("search_files", { query: searchQuery || "/p" });

  if (thisSearchId < lastRenderedSearchId) {
    return;
  }

  lastRenderedSearchId = thisSearchId;

  if (thisSearchId === currentSearchId) {
    searchLoader.classList.add("hidden");
  }

  state.results = results;

  render();
  // }, 150);
});

document.addEventListener('keydown', async (e) => {
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
    return;
  }

  if (isAllSelected && e.key !== "Backspace" && !(e.ctrlKey && e.key.toLowerCase() === 'a')) {
    const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey;
    const isPasteOrCut = e.ctrlKey && (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'x');
    const isCopy = e.ctrlKey && e.key.toLowerCase() === 'c';

    if (isCopy) {
      return;
    }

    if (isPrintable || isPasteOrCut) {
      state.activeFilters = [];
      renderChips();
      input.value = "";
      isAllSelected = false;
      return;
    }

    deselectChips();
  }

  if (e.ctrlKey && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    if (input.value.length > 0 || state.activeFilters.length > 0) {
      selectAllChips();
    }
    return;
  }

  if (e.key === "Escape") {
    e.preventDefault();
    deselectChips();

    const isInputEmpty = input.value === "";
    const isSettingsHidden = settingsPanel.classList.contains("hidden");
    const isDropdownHidden = shortcutDropdown.classList.contains("hidden");
    const areChipsEmpty = state.activeFilters.length === 0;

    if (isInputEmpty && isSettingsHidden && isDropdownHidden && areChipsEmpty) {
      await getCurrentWindow().hide();
      return;
    }

    input.value = "";
    state.activeFilters = [];
    renderChips();
    state.results = [];

    settingsPanel.classList.add("hidden");
    settingsBtn.classList.remove("active");
    shortcutDropdown.classList.add("hidden");

    render();
    input.focus();

    if (state.showRecents) {
      await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
      lastWindowHeight = WINDOW_MAX_HEIGHT;
    } else {
      await invoke("reset_window");
      lastWindowHeight = 65;
    }
    return;
  }

  if (e.key === "Backspace") {
    if (isAllSelected) {
      e.preventDefault();
      state.activeFilters = [];
      input.value = "";
      renderChips();
      deselectChips();

      input.dispatchEvent(new Event('input'));
      return;

      // state.results = [];
      // if (!state.showRecents) {
      //   await invoke("reset_window");
      //   lastWindowHeight = 65;
      // }
      // render();
      // return;
    }

    if (input.value === "") {
      if (state.activeFilters.length > 0) {
        state.activeFilters.pop();
        renderChips();

        input.dispatchEvent(new Event('input'));
        return;
        // const fullQuery = state.activeFilters.join(" ");
        // if (fullQuery.length === 0) {
        //   state.results = [];
        //   if (!state.showRecents) {
        //     await invoke("reset_window");
        //     lastWindowHeight = 65;
        //   }
        // } else {
        //   const results = await invoke("search_files", { query: fullQuery });
        //   state.results = results;
        // }
        // render();
        // return;
      }
    }
  }

  if (!shortcutDropdown.classList.contains("hidden")) {
    const options = document.querySelectorAll(".shortcut-option");
    if (options.length === 0) return;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      dropdownIndex = (dropdownIndex + 1) % options.length;
      renderDropdownFocus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      dropdownIndex = (dropdownIndex - 1 + options.length) % options.length;
      renderDropdownFocus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (dropdownIndex >= 0 && options[dropdownIndex]) {
        options[dropdownIndex].click();
      }
    }
    return;
  }

  if (!settingsPanel.classList.contains("hidden")) {
    const focusables = getSettingsFocusables();

    if (e.key === "Tab") {
      e.preventDefault();
      toggleSettings();
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      settingsIndex = (settingsIndex + 1) % focusables.length;
      renderSettingsFocus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (settingsIndex === -1) {
        settingsIndex = focusables.length - 1;
      } else {
        settingsIndex = (settingsIndex - 1 + focusables.length) % focusables.length;
      }
      renderSettingsFocus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (settingsIndex >= 0 && settingsIndex <= 3) {
        settingsIndex = (settingsIndex <= 1) ? 4 : 5;
      } else if (settingsIndex === 4 || settingsIndex === 5) {
        settingsIndex = (settingsIndex === 4) ? 6 : 7;
      } else if (settingsIndex === 6 || settingsIndex === 7) {
        settingsIndex = settingsIndex - 6;
      } else {
        settingsIndex = 0;
      }
      renderSettingsFocus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (settingsIndex >= 0 && settingsIndex <= 3) {
        settingsIndex = (settingsIndex <= 1) ? 6 : 7;
      } else if (settingsIndex === 4 || settingsIndex === 5) {
        settingsIndex = (settingsIndex === 4) ? 0 : 2;
      } else if (settingsIndex === 6 || settingsIndex === 7) {
        settingsIndex = (settingsIndex === 6) ? 4 : 5;
      } else {
        settingsIndex = focusables.length - 1;
      }
      renderSettingsFocus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();

      if (settingsIndex >= 0) {
        const item = focusables[settingsIndex];
        if (item === shortcutDisplay) {
          item.click();
          dropdownIndex = 0;
          setTimeout(renderDropdownFocus, 50);
        } else if (item.classList.contains("toggle-switch-container")) {
          const checkbox = item.querySelector('input[type="checkbox"]');
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
          }
        } else {
          item.click();
        }
      }
    }
    return;
  }

  if (e.key === " " && input.value.length === 0) {
    e.preventDefault();
    return;
  }

  // let useResults = input.value.trim() !== "" || state.activeFilters.length > 0;
  // let items = (useResults) ? state.results : (state.showRecents ? state.recentFiles : []);

  // if (items.length === 0) {
  //   if (e.key === "Tab") {
  //     e.preventDefault();
  //     toggleSettings();
  //   }
  //   return;
  // }

  const items = document.querySelectorAll(".result-item");

  if (items.length === 0) {
    if (e.key === "Tab") {
      e.preventDefault();
      toggleSettings();
    }
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    state.selectedIndex = (state.selectedIndex + 1) % items.length;
    renderStyles();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    state.selectedIndex = (state.selectedIndex - 1 + items.length) % items.length;
    renderStyles();
  } else if (e.key === "Enter") {
    e.preventDefault();

    const val = input.value.trim();
    if ((val.startsWith("@") || val.startsWith("/") || val.startsWith("!")) && val.length > 1 && state.selectedIndex === 0) {
      state.activeFilters.push(val);
      renderChips();
      input.value = "";
      input.dispatchEvent(new Event('input'));
      return;
    }

    const selectedEl = items[state.selectedIndex];
    if (selectedEl) {
      selectedEl.click();
    }

    // const item = items[state.selectedIndex];
    // if (item) {
    //   const path = typeof item === 'string' ? item : item.path;
    //   const kind = typeof item === 'string' ? 'file' : item.kind;
    //   const name = typeof item === 'string' ? path.split('\\').pop() : (item.name || path.split('\\').pop());
    //   openFile(path, kind, name);
    // }

  } else if (e.key === "Tab") {
    e.preventDefault();
    const val = input.value.trim();
    if ((val.startsWith("@") || val.startsWith("/") || val.startsWith("!")) && val.length > 1 && state.selectedIndex === 0) {
      state.activeFilters.push(val);
      renderChips();

      input.value = "";
      input.dispatchEvent(new Event('input'));
      return;
    }
    toggleSettings();
  }
});

render();

window.addEventListener('focus', () => {
  input.focus();
});

listen('reset_state', async () => {
  input.value = "";
  state.activeFilters = [];
  renderChips();

  state.results = [];
  state.selectedIndex = 0;
  settingsPanel.classList.add("hidden");
  settingsBtn.classList.remove("active");
  shortcutDropdown.classList.add("hidden");
  render();
  input.focus();

  if (state.showRecents) {
    await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
    lastWindowHeight = WINDOW_MAX_HEIGHT;
  } else {
    await invoke("reset_window");
    lastWindowHeight = 65;
  }
});

let recordedShortcut = "";

function formatShortcutForDisplay(str) {
  return str.replace("Super", "Win")
    .replace("CommandOrControl", "Ctrl")
    .replace(/\+/g, " + ");
}

async function loadCurrentShortcut() {
  const current = await invoke("get_current_shortcut");
  shortcutDisplay.textContent = formatShortcutForDisplay(current);
  shortcutDisplay.dataset.value = current;
}

function checkDropdownSize() {
  if (!shortcutDropdown.classList.contains("hidden")) {
    const dropdownHeight = shortcutDropdown.scrollHeight + shortcutDropdown.offsetTop + 20;
    if (dropdownHeight > WINDOW_MAX_HEIGHT) {
      invoke("resize_window", { height: dropdownHeight });
      return;
    }
  }
  invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
}

shortcutDisplay.onclick = async (e) => {
  e.stopPropagation();
  if (shortcutDropdown.classList.contains("hidden")) {
    shortcutDropdown.classList.remove("hidden");
    await renderDropdown();
  } else {
    shortcutDropdown.classList.add("hidden");
  }
  checkDropdownSize();
};

async function renderDropdown() {
  shortcutDropdown.innerHTML = '<div class="shortcut-option" style="cursor: default;">Checking availability...</div>';
  const currentVal = shortcutDisplay.dataset.value;

  let availableShortcuts = [];
  try {
    availableShortcuts = await invoke("check_shortcuts_availability", { shortcuts: PRESET_SHORTCUTS });
  } catch (e) {
    console.error(e);
    availableShortcuts = PRESET_SHORTCUTS.map(() => true);
  }

  shortcutDropdown.innerHTML = "";

  let sortedShortcuts = PRESET_SHORTCUTS.map((sc, i) => ({
    shortcut: sc,
    available: availableShortcuts[i]
  }));

  sortedShortcuts.sort((a, b) => {
    if (a.available === b.available) return 0;
    return a.available ? -1 : 1;
  });

  sortedShortcuts.forEach(({ shortcut, available }) => {
    const div = document.createElement("div");
    div.className = "shortcut-option";
    div.textContent = formatShortcutForDisplay(shortcut);

    if (shortcut === currentVal) {
      div.classList.add("active");
    }

    if (!available) {
      div.classList.add("unavailable");
      div.innerHTML += ' <span style="float: right;">🔒</span>';
      div.style.opacity = '0.5';
      div.style.cursor = 'not-allowed';
    } else {
      div.onclick = () => applyShortcut(shortcut);
    }

    shortcutDropdown.appendChild(div);
  });

  checkDropdownSize();
}

async function applyShortcut(newShortcut) {
  shortcutDropdown.classList.add("hidden");
  updateWindowSize();
  shortcutDisplay.textContent = "Updating...";
  shortcutMsg.textContent = "";

  try {
    const success = await invoke("update_shortcut", { newShortcut });

    if (success) {
      shortcutDisplay.textContent = formatShortcutForDisplay(newShortcut);
      shortcutDisplay.dataset.value = newShortcut;
      shortcutMsg.textContent = "Shortcut Updated!";
      shortcutMsg.style.color = "#4caf50";
      shortcutMsg.style.fontSize = "12px";

      setTimeout(() => {
        if (shortcutMsg.textContent === "Shortcut Updated!") shortcutMsg.textContent = "";
      }, 2000);

    } else {
      const current = await invoke("get_current_shortcut");
      shortcutDisplay.textContent = formatShortcutForDisplay(current);
      shortcutDisplay.dataset.value = current;
      shortcutMsg.textContent = "Shortcut Taken or Invalid";
      shortcutMsg.style.color = "#ff5555";
      shortcutMsg.style.fontSize = "12px";
    }
  } catch (err) {
    console.error(err);
    shortcutMsg.textContent = "Error updating shortcut";
    loadCurrentShortcut();
  }
}

input.addEventListener("click", () => {
  deselectChips();
});

document.addEventListener("click", (e) => {
  if (!shortcutDisplay.contains(e.target) && !shortcutDropdown.contains(e.target)) {
    shortcutDropdown.classList.add("hidden");
    updateWindowSize();
  }

  if (!e.target.closest("#search-wrapper")) {
    deselectChips();
  }
});

loadCurrentShortcut();

async function initAutostart() {
  try {
    const isEnabled = await invoke("plugin:autostart|is_enabled");
    if (startupToggle) startupToggle.checked = isEnabled;
  } catch (err) {
    console.error("Autostart init error:", err);
  }
}

if (startupToggle) {
  startupToggle.onchange = async (e) => {
    try {
      if (e.target.checked) {
        await invoke("plugin:autostart|enable");
      } else {
        await invoke("plugin:autostart|disable");
      }
    } catch (err) {
      console.error("Autostart toggle error:", err);
      e.target.checked = !e.target.checked;
    }
  };
}

initAutostart();

if (helpBtn) {
  helpBtn.onclick = async (e) => {
    e.stopPropagation();
    await invoke("open_file", { path: "https://yashvardhang.github.io/Velocmd/" });
  };
}

let lastWindowHeight = 0;

if (!state.showRecents) {
  invoke("reset_window");
  lastWindowHeight = 65;
} else {
  invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
  lastWindowHeight = WINDOW_MAX_HEIGHT;
}

function updateWindowSize() {
  let height = container.offsetHeight;

  height = Math.ceil(height);

  if (height !== lastWindowHeight) {
    lastWindowHeight = height;
    invoke("resize_window", { height });
  }
}

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

input.focus();

listen("index_refreshed", async () => {
  input.disabled = false;
  input.value = "";
  input.placeholder = "⚡Velocmd running...";
  state.results = [];
  input.focus();

  if (!state.showRecents) {
    resultsContainer.classList.add("hidden");
    await invoke("reset_window");
    lastWindowHeight = 65;
  } else {
    await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
    lastWindowHeight = WINDOW_MAX_HEIGHT;
  }

  render();

  if (!hasCheckedStartupUpdate) {
    hasCheckedStartupUpdate = true;
    setTimeout(() => {
      checkUpdates(true);
    }, 500);
  }
});

async function checkInitialIndexing() {
  const isIndexing = await invoke("get_indexing_state");

  if (isIndexing) {
    input.disabled = true;
    input.value = "";
    input.placeholder = "⌛ Building initial file index...";
    state.results = [];
    state.activeFilters = [];
    renderChips();

    if (state.showRecents) {
      resultsList.innerHTML = `
        <div class="empty-recents-message">
          <span class="result-icon" style="animation: spin 2s linear infinite;">⏳</span>
          <div class="result-content">
            <span class="result-name">Building File Index...</span>
            <span class="result-path">This will just take a moment on startup</span>
          </div>
        </div>`;
      resultsContainer.classList.remove("hidden");
      await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
      lastWindowHeight = WINDOW_MAX_HEIGHT;
    } else {
      resultsContainer.classList.add("hidden");
      await invoke("reset_window");
      lastWindowHeight = 65;
    }
    updateContainerMinimalState();

    return true;
  }

  return false;
}

checkInitialIndexing().then((isIndexing) => {
  if (!isIndexing) {
    hasCheckedStartupUpdate = true;
    checkUpdates(true);
  }
});