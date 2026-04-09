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

let settingsIndex = -1;
let dropdownIndex = -1;
let isAllSelected = false;

let state = {
  results: [],
  recentFiles: [],
  selectedIndex: 0,
  showRecents: true,
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

function getSettingsFocusables() {
  return [
    document.querySelector(".toggle-switch-container"),
    startupToggle,
    clearRecentsBtn,
    resetPosBtn,
    shortcutDisplay
  ];
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
  } else {
    settingsPanel.classList.add("hidden");
    getSettingsFocusables().forEach(el => el.classList.remove("selected"));
    settingsBtn.classList.remove("active");

    const hasInput = input.value.trim().length > 0;

    if (state.showRecents) {
      resultsContainer.classList.remove("hidden");
      await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
      lastWindowHeight = WINDOW_MAX_HEIGHT;
    } else {
      if (hasInput) {
        resultsContainer.classList.remove("hidden");
        await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
        lastWindowHeight = WINDOW_MAX_HEIGHT;
      } else {
        resultsContainer.classList.add("hidden");
        await invoke("reset_window");
        lastWindowHeight = 65;
      }
    }
  }

  render();
  input.focus();
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

clearRecentsBtn.onclick = () => {
  state.recentFiles = [];
  localStorage.setItem("recentFiles", JSON.stringify([]));
  render();
};

resetPosBtn.onclick = async () => {
  await invoke("reset_window");
};

function getFileIcon(path, kind) {
  if (kind === "app") return "🚀";
  if (kind === "folder") return "📁";
  if (kind === "drive") return "💽";
  if (kind === "command") return "⚙️";
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

  await invoke("open_file", { path: url });
}

async function render() {
  const rawInput = input.value.trim();
  const fullQuery = [...state.activeFilters, rawInput].join(" ").trim();
  const hasChips = state.activeFilters.length > 0;
  const isInputEmpty = rawInput.length === 0;

  resultsList.innerHTML = "";
  let items = [];

  const webTriggers = ["@google", "@duck", "@duckduckgo", "@bing", "@search", "/google", "/duck", "/duckduckgo", "/bing", "/search"];
  const questionWords = ["how", "what", "why", "when", "who"];

  let matchedTrigger = webTriggers.find(t => fullQuery.toLowerCase().startsWith(t));
  let isWebIntent = matchedTrigger !== undefined || questionWords.some(w => fullQuery.toLowerCase().startsWith(w));

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
    resultsContainer.classList.add("hidden");
    items = [];
  } else if (isInputEmpty && !hasChips) {
    if (state.showRecents) {
      items = state.recentFiles;
      resultsContainer.classList.remove("hidden");
    } else {
      items = [];
      resultsContainer.classList.add("hidden");
    }
  } else {
    items = state.results;
    resultsContainer.classList.remove("hidden");
  }

  let isCmdIntent = fullQuery.trim().toLowerCase().startsWith("@cmd") || fullQuery.trim().toLowerCase().startsWith("/cmd");

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

    return;
  }

  if (isWebIntent && !isInputEmpty) {
    const webItem = document.createElement("li");
    webItem.className = `result-item web-search-item ${(state.selectedIndex === 0 && !isCmdIntent) ? "selected" : ""}`;

    let engineName = "Web";
    if (activeEngine !== "@search") {
      engineName = activeEngine.substring(1).charAt(0).toUpperCase() + activeEngine.substring(2);
    }

    webItem.innerHTML = `
        <span class="result-icon">🌍</span> 
        <div class="result-content">
          <span class="result-name">Search ${engineName}</span>
          <span class="result-path">"${webQuery}"</span>
        </div>`;

    webItem.onclick = () => openWeb(webQuery, activeEngine);
    webItem.onmouseenter = () => { state.selectedIndex = isCmdIntent ? 1 : 0; renderStyles(); };

    if (!isCmdIntent) resultsList.appendChild(webItem);
  }

  if (items.length === 0 && !isWebIntent && !isCmdIntent && !isInputEmpty) {
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

    const displayPath = kind === 'app' ? "Application" : path;

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
  const validName = name || path.split('\\').pop();
  const newItem = { path, kind, name: validName };
  const filtered = state.recentFiles.filter(p => (typeof p === 'string' ? p : p.path) !== path);
  state.recentFiles = [newItem, ...filtered].slice(0, 10);
  localStorage.setItem("recentFiles", JSON.stringify(state.recentFiles));

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
    settingsPanel.classList.toggle("hidden");
    settingsBtn.classList.toggle("active");
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

  if (path === "velo:reset_position") {
    await invoke("reset_window");
    input.value = "";
    render();
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

  await invoke("open_file", { path });
  input.value = "";
  render();
}

let debounceTimeout;
input.addEventListener("input", async (e) => {
  let val = input.value;

  if (val.endsWith(" ") && val.trim().length > 1) {
    const words = val.split(" ");
    const lastWord = words[words.length - 2];

    if (lastWord.startsWith("@") || lastWord.startsWith("/")) {
      state.activeFilters.push(lastWord);
      renderChips();

      input.value = "";
      val = "";
    }
  }

  deselectChips();

  if (!settingsPanel.classList.contains("hidden")) {
    await toggleSettings();
  }

  clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(async () => {
    const query = [...state.activeFilters, val].join(" ").trim();

    if (query.trim().length > 0) {
      if (lastWindowHeight !== WINDOW_MAX_HEIGHT) {
        await invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
        lastWindowHeight = WINDOW_MAX_HEIGHT;
      }
      resultsContainer.classList.remove("hidden");
    } else {
      if (!state.showRecents) {
        await invoke("reset_window");
        lastWindowHeight = 65;
      }
    }

    state.selectedIndex = 0;

    if (query.trim().length === 0) {
      state.results = [];
      render();
      return;
    }

    if (query.trim() === "@" || query.trim() === "/") {
      const drives = await invoke("get_available_drives");
      const prefix = query.trim();
      const driveItems = drives.map(d => ({
        name: `Drive ${d}`,
        path: `${prefix}${d[0].toLowerCase()}:`,
        kind: "filter",
        score: 97
      }));

      state.results = [
        { name: "Applications", path: `${prefix}apps `, kind: "filter", score: 100 },
        { name: "Folders", path: `${prefix}folders `, kind: "filter", score: 99 },
        { name: "Files", path: `${prefix}files `, kind: "filter", score: 98 },
        ...driveItems,
        { name: "Velo Commands", path: `${prefix}velo `, kind: "filter", score: 95 },
        { name: "Settings", path: `${prefix}settings`, kind: "filter", score: 94 },
        { name: "Run Command", path: `${prefix}cmd `, kind: "filter", score: 94 },
        { name: "Web Search", path: `${prefix}google `, kind: "filter", score: 93 }
      ];
      render();
      return;
    }

    if (resultsContainer.classList.contains("hidden") || (!state.showRecents && state.results.length === 0)) {
      invoke("resize_window", { height: WINDOW_MAX_HEIGHT });
      lastWindowHeight = WINDOW_MAX_HEIGHT;
      resultsContainer.classList.remove("hidden");
    }

    state.results = await invoke("search_files", { query });

    if (!settingsPanel.classList.contains("hidden")) {
      toggleSettings();
    }

    render();
  }, 150);
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

      state.results = [];
      if (!state.showRecents) {
        await invoke("reset_window");
        lastWindowHeight = 65;
      }
      render();
      return;
    }

    if (input.value === "") {
      if (state.activeFilters.length > 0) {
        state.activeFilters.pop();
        renderChips();
        const fullQuery = state.activeFilters.join(" ");
        if (fullQuery.length === 0) {
          state.results = [];
          if (!state.showRecents) {
            await invoke("reset_window");
            lastWindowHeight = 65;
          }
        } else {
          state.results = await invoke("search_files", { query: fullQuery });
        }
        render();
        return;
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

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      settingsIndex = (settingsIndex + 1) % focusables.length;
      renderSettingsFocus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (settingsIndex === -1) {
        settingsIndex = focusables.length - 1;
      } else {
        settingsIndex = (settingsIndex - 1 + focusables.length) % focusables.length;
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
    if ((val.startsWith("@") || val.startsWith("/")) && val.length > 1 && state.selectedIndex === 0) {
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
    if ((val.startsWith("@") || val.startsWith("/")) && val.length > 1 && state.selectedIndex === 0) {
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

listen('reset_state', () => {
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
  updateWindowSize();
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
      // Revert on error
      e.target.checked = !e.target.checked;
    }
  };
}

initAutostart();

let lastWindowHeight = 0;

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