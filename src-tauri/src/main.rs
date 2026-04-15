#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use jwalk::WalkDir;
use once_cell::sync::Lazy;
use std::collections::HashSet;
use std::io::Cursor;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::sync::RwLock;
use std::time::Instant;
use systemicons::get_icon;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Clone, serde::Serialize)]
struct SearchResult {
    path: String,
    name: String,
    kind: String,
    score: u16,
    icon_data: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "lowercase")]
enum ItemKind {
    App,
    Folder,
    File,
    Drive,
    Command,
}

impl ItemKind {
    fn as_str(&self) -> &'static str {
        match self {
            ItemKind::App => "app",
            ItemKind::Folder => "folder",
            ItemKind::File => "file",
            ItemKind::Drive => "drive",
            ItemKind::Command => "command",
        }
    }
}

struct IndexedItem {
    path: Box<str>,
    // path_lower: Box<str>,
    name: Box<str>,
    name_lower: Box<str>,
    kind: ItemKind,
}

static CURRENT_SHORTCUT: Lazy<Mutex<String>> =
    Lazy::new(|| Mutex::new("Super+Shift+.".to_string()));
// static FILE_INDEX: Lazy<Mutex<Vec<IndexedItem>>> = Lazy::new(|| Mutex::new(Vec::new()));
static FILE_INDEX: Lazy<RwLock<Vec<IndexedItem>>> = Lazy::new(|| RwLock::new(Vec::new()));
static SHOW_RECENTS: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(true));
static REFOCUS_ON_BLUR: AtomicBool = AtomicBool::new(false);
static IS_INDEXING: AtomicBool = AtomicBool::new(false);

const PRESET_SHORTCUTS: &[&str] = &[
    "Super+Shift+.",
    "Alt+Space",
    "Super+Space",
    "Ctrl+Space",
    "Ctrl+Shift+Space",
    "Super+S",
    "Alt+S",
    "Super+/"
];

fn get_config_path(app: &AppHandle) -> std::path::PathBuf {
    let mut path = app.path().app_config_dir().unwrap_or_default();
    std::fs::create_dir_all(&path).unwrap_or_default();
    path.push("settings.json");
    path
}

fn load_shortcut(app: &AppHandle) -> String {
    let path = get_config_path(app);
    if let Ok(content) = std::fs::read_to_string(&path) {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(shortcut) = v.get("shortcut").and_then(|s| s.as_str()) {
                return shortcut.to_string();
            }
        }
    }
    "Super+Shift+.".to_string()
}

fn save_shortcut(app: &AppHandle, shortcut: &str) {
    let path = get_config_path(app);
    let mut data = serde_json::json!({});
    if let Ok(content) = std::fs::read_to_string(&path) {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&content) {
            data = v;
        }
    }
    if let Some(obj) = data.as_object_mut() {
        obj.insert("shortcut".to_string(), serde_json::json!(shortcut));
    } else {
        data = serde_json::json!({ "shortcut": shortcut });
    }
    let _ = std::fs::write(&path, serde_json::to_string_pretty(&data).unwrap_or_default());
}

fn get_file_icon_base64(path: &str) -> Option<String> {
    match get_icon(path, 32) {
        Ok(icon_vec) => {
            if let Ok(img) = image::load_from_memory(&icon_vec) {
                let mut buf = Vec::new();
                if img
                    .write_to(&mut Cursor::new(&mut buf), image::ImageFormat::Png)
                    .is_ok()
                {
                    use base64::{engine::general_purpose, Engine as _};
                    let b64 = general_purpose::STANDARD.encode(&buf);
                    return Some(format!("data:image/png;base64,{}", b64));
                }
            }

            const SIZE: usize = 32;
            let expected = SIZE * SIZE * 4;
            if icon_vec.len() == expected {
                if let Some(img_buf) = image::ImageBuffer::<image::Rgba<u8>, _>::from_raw(
                    SIZE as u32,
                    SIZE as u32,
                    icon_vec,
                ) {
                    let img = image::DynamicImage::ImageRgba8(img_buf);
                    let mut buf = Vec::new();
                    if img
                        .write_to(&mut Cursor::new(&mut buf), image::ImageFormat::Png)
                        .is_ok()
                    {
                        use base64::{engine::general_purpose, Engine as _};
                        let b64 = general_purpose::STANDARD.encode(&buf);
                        return Some(format!("data:image/png;base64,{}", b64));
                    }
                }
            }

            None
        }
        Err(e) => {
            eprintln!("get_icon error for {}: {:?}", path, e);
            None
        }
    }
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let show_recents = *SHOW_RECENTS.lock().unwrap();

        if show_recents {
            let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                width: 800.0,
                height: 400.0,
            }));
        } else {
            let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                width: 800.0,
                height: 70.0,
            }));
        }

        let _ = window.center();
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: window.outer_position().unwrap().x,
            y: 100,
        }));
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.emit("reset_state", ());

        REFOCUS_ON_BLUR.store(true, Ordering::SeqCst);
    }
}

fn toggle_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) && !window.is_minimized().unwrap_or(false) {
            let _ = window.hide();
        } else {
            show_main_window(app);
        }
    }
}

#[tauri::command]
fn get_current_shortcut() -> String {
    CURRENT_SHORTCUT.lock().unwrap().clone()
}

#[tauri::command]
fn set_recents_state(show: bool) {
    *SHOW_RECENTS.lock().unwrap() = show;
}

#[tauri::command]
fn update_shortcut(app: AppHandle, new_shortcut: String) -> bool {
    let mut current = CURRENT_SHORTCUT.lock().unwrap();
    let _ = app.global_shortcut().unregister(current.as_str());

    match app.global_shortcut().register(new_shortcut.as_str()) {
        Ok(_) => {
            println!("Shortcut updated to: {}", new_shortcut);
            *current = new_shortcut.clone();
            save_shortcut(&app, &new_shortcut);
            true
        }
        Err(e) => {
            eprintln!("Failed to register {}: {:?}", new_shortcut, e);
            let _ = app.global_shortcut().register(current.as_str());
            false
        }
    }
}

#[tauri::command]
fn check_shortcuts_availability(app: AppHandle, shortcuts: Vec<String>) -> Vec<bool> {
    let current = CURRENT_SHORTCUT.lock().unwrap().clone();
    let _ = app.global_shortcut().unregister(current.as_str());

    let mut results = Vec::new();
    for sc in shortcuts {
        if sc == current {
            results.push(true);
        } else {
            match app.global_shortcut().register(sc.as_str()) {
                Ok(_) => {
                    let _ = app.global_shortcut().unregister(sc.as_str());
                    results.push(true);
                }
                Err(_) => {
                    results.push(false);
                }
            }
        }
    }

    let _ = app.global_shortcut().register(current.as_str());
    results
}

#[tauri::command]
async fn search_files(query: String) -> Vec<SearchResult> {
    // let index = FILE_INDEX.lock().unwrap();
    let index = FILE_INDEX.read().unwrap();
    let query_trim = query.trim();

    if query_trim.is_empty() {
        return vec![];
    }

    let parts: Vec<&str> = query_trim.split_whitespace().collect();
    let mut filters = Vec::new();
    let mut search_terms = Vec::new();

    for part in parts {
        if (part.starts_with('@') || part.starts_with('/')) && part.len() > 1 {
            filters.push(part.to_lowercase());
        } else {
            search_terms.push(part);
        }
    }

    let search_text = search_terms.join(" ").to_lowercase();

    let has_tabs_filter = filters.iter().any(|f| {
        let content = &f[1..];
        content == "tabs" || content == "active" || content == "window" || content == "windows"
    });

    if has_tabs_filter
        || query_trim.to_lowercase().starts_with("@tabs")
        || query_trim.to_lowercase().starts_with("/tabs")
        || query_trim.to_lowercase().starts_with("@active")
        || query_trim.to_lowercase().starts_with("/active")
    {
        let mut active = get_active_windows();
        if !search_text.is_empty() {
            active.retain(|res| res.name.to_lowercase().contains(&search_text));
        }
        return active;
    }

    let has_velo_filter = filters.iter().any(|f| {
        let content = &f[1..];
        content == "velo" || content == "settings"
    });

    if has_velo_filter
        || query_trim.to_lowercase().starts_with("@settings")
        || query_trim.to_lowercase().starts_with("/settings")
        || query_trim.to_lowercase().starts_with("@velo")
        || query_trim.to_lowercase().starts_with("/velo")
    {
        let all_velo_commands = vec![
            ("velo:help", "Velo: Help", 201u16),
            ("velo:settings", "Velo Settings", 200),
            ("velo:toggle_recents", "Velo: Toggle Recents", 199),
            ("velo:clear_recents", "Velo: Clear Recents", 198),
            ("velo:reset_position", "Velo: Reset Position", 197),
            ("velo:refresh", "Velo: Refresh Index", 195),
            ("velo:show_desktop", "Show Desktop", 194),
            ("velo:active_tabs", "Active Tabs", 193),
            ("velo:request_shutdown", "Shutdown", 190),
            ("velo:media_play", "Media: Play/Pause", 189),
            ("velo:media_next", "Media: Next Track", 188),
            ("velo:media_prev", "Media: Previous Track", 187),
            ("velo:request_restart", "Restart", 180),
            ("ms-settings:startupapps", "Startup Apps", 175),
            ("ms-settings:appsfeatures", "Apps & Features (Uninstall)", 174),
            ("ms-settings:sound", "Sound Settings (Volume)", 170),
            ("ms-settings:display", "Display Settings (Brightness)", 160),
            ("ms-settings:windowsupdate", "Windows Update", 150),
        ];

        let settings_results: Vec<SearchResult> = all_velo_commands
            .into_iter()
            .filter(|(_, name, _)| {
                if search_text.is_empty() {
                    true
                } else {
                    name.to_lowercase().contains(&search_text)
                }
            })
            .map(|(path, name, score)| SearchResult {
                path: path.to_string(),
                name: name.to_string(),
                kind: "command".to_string(),
                score,
                icon_data: None,
            })
            .collect();

        return settings_results;
    }

    let mut results: Vec<SearchResult> = index
        .iter()
        .filter_map(|item| {
            for filter in &filters {
                let f_content = &filter[1..];
                match f_content {
                    "app" | "apps" | "application" | "applications" | "exe" | "lnk" => {
                        let path_lower = item.path.to_ascii_lowercase();
                        let is_exe = path_lower.ends_with(".exe") || path_lower.ends_with(".lnk");
                        if item.kind != ItemKind::App && !is_exe {
                            return None;
                        }
                    }
                    "folder" | "folders" | "directory" | "directories" | "dir" | "dirs" => {
                        if item.kind != ItemKind::Folder {
                            return None;
                        }
                    }
                    "file" | "files" => {
                        if item.kind != ItemKind::File {
                            return None;
                        }
                    }
                    "drive" | "disk" | "drives" | "disks" => {
                        if item.kind != ItemKind::Drive {
                            return None;
                        }
                    }
                    d if (d.len() == 1 && d.chars().next().unwrap().is_alphabetic())
                        || (d.len() == 2 && d.ends_with(':')) =>
                    {
                        let letter = d.chars().next().unwrap().to_ascii_uppercase();
                        let drive_prefix = format!("{}:", letter);
                        if !item.path.to_ascii_uppercase().starts_with(&drive_prefix) {
                            return None;
                        }
                    }
                    "setting" | "settings" | "config" | "setup" => {
                        if item.kind != ItemKind::Command {
                            return None;
                        }
                    }
                    ext => {
                        if !item.path.to_ascii_lowercase().ends_with(&format!(".{}", ext)) {
                            return None;
                        }
                    }
                }
            }

            let name = &item.name;
            let name_lower = &item.name_lower;

            if !search_text.is_empty() {
                if !name_lower.contains(&search_text) && !item.path.to_ascii_lowercase().contains(&search_text) {
                    return None;
                }
            }

            let mut score: u16 = 1;

            if item.kind == ItemKind::Command {
                score += 500;
            } else if item.kind == ItemKind::App {
                score += 250;
            }

            if item.path.starts_with("shell:") {
                score -= 10;
            }

            if item.kind == ItemKind::Drive {
                score += 80;
            }

            if name_lower.as_ref() == search_text {
                score += 50;
            } else if name_lower.starts_with(&search_text) {
                score += 20;
            } else if name_lower.contains(&search_text) {
                score += 10;
            }

            if item.path.len() < 50 {
                score += 5;
            }

            Some(SearchResult {
                path: item.path.to_string(),
                name: name.to_string(),
                kind: item.kind.as_str().to_string(),
                score,
                icon_data: None,
            })
        })
        .collect();

    results.sort_by(|a, b| b.score.cmp(&a.score));

    let mut unique_results = Vec::new();
    let mut seen_names = HashSet::new();

    for mut res in results {
        if res.kind == "app" {
            if !seen_names.contains(&res.name) {
                seen_names.insert(res.name.clone());

                if res.path.to_lowercase().ends_with(".exe")
                    || res.path.to_lowercase().ends_with(".lnk")
                {
                    res.icon_data = get_file_icon_base64(&res.path);
                }

                unique_results.push(res);
            }
        } else {
            unique_results.push(res);
        }

        if unique_results.len() >= 50 {
            break;
        }
    }

    unique_results
}

#[tauri::command]
fn open_file(app: tauri::AppHandle, path: String) {
    let mut success = false;

    if path.starts_with("http://")
        || path.starts_with("https://")
        || path.starts_with("ms-settings:")
        || path.starts_with("shell:")
    {
        #[cfg(target_os = "windows")]
        {
            if std::process::Command::new("explorer.exe")
                .args([&path])
                .spawn()
                .is_ok()
            {
                success = true;
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            if tauri_plugin_opener::open_path(&path, None::<&str>).is_ok() {
                success = true;
            }
        }
    } else if path.starts_with("cmd:") {
        let cmd = &path[4..];
        #[cfg(target_os = "windows")]
        {
            let mut command = std::process::Command::new("cmd.exe");
            command.args(["/C", cmd])
                .creation_flags(CREATE_NO_WINDOW);

            if let Err(e) = command.spawn() {
                eprintln!("Failed to execute command '{}': {}", cmd, e);
            } else {
                success = true;
            }
        }
    } else {
        if let Err(e) = tauri_plugin_opener::open_path(&path, None::<&str>) {
            eprintln!("Failed to open item: {}", e);
        } else {
            success = true;
        }
    }

    if success {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.hide();
        }
    }
}

#[tauri::command]
fn reset_window(window: tauri::Window) {
    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
        width: 800.0,
        height: 70.0,
    }));

    let _ = window.center();
    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
        x: window.outer_position().unwrap().x,
        y: 100,
    }));
}

#[tauri::command]
fn resize_window(window: tauri::Window, height: f64) {
    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
        width: 800.0,
        height,
    }));
}

#[tauri::command]
fn get_available_drives() -> Vec<String> {
    let mut drives = Vec::new();
    for letter in b'C'..=b'Z' {
        let drive = format!("{}:\\", letter as char);
        if Path::new(&drive).exists() {
            drives.push(drive);
        }
    }
    drives
}

#[tauri::command]
fn execute_media_key(action: String) {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::Input::KeyboardAndMouse::{
            keybd_event, KEYEVENTF_EXTENDEDKEY, KEYEVENTF_KEYUP, VK_MEDIA_NEXT_TRACK,
            VK_MEDIA_PLAY_PAUSE, VK_MEDIA_PREV_TRACK,
        };

        let vk = match action.as_str() {
            "next" => VK_MEDIA_NEXT_TRACK,
            "prev" => VK_MEDIA_PREV_TRACK,
            "play" => VK_MEDIA_PLAY_PAUSE,
            _ => return,
        };

        unsafe {
            keybd_event(vk.0 as u8, 0, KEYEVENTF_EXTENDEDKEY, 0);
            keybd_event(vk.0 as u8, 0, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, 0);
        }
    }
}

#[tauri::command]
fn show_desktop(app: tauri::AppHandle) {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::Input::KeyboardAndMouse::{
            keybd_event, KEYEVENTF_EXTENDEDKEY, KEYEVENTF_KEYUP,
        };
        unsafe {
            keybd_event(0x5B, 0, KEYEVENTF_EXTENDEDKEY, 0); 
            keybd_event(0x44, 0, KEYEVENTF_EXTENDEDKEY, 0);
            keybd_event(0x44, 0, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, 0);
            keybd_event(0x5B, 0, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, 0);
        }
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn get_active_windows() -> Vec<SearchResult> {
    let mut windows_list: Vec<SearchResult> = Vec::new();

    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::{BOOL, HWND, LPARAM};
        use windows::Win32::UI::WindowsAndMessaging::{
            EnumWindows, GetWindowTextLengthW, GetWindowTextW, IsWindowVisible,
        };

        unsafe extern "system" fn enum_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
            if IsWindowVisible(hwnd).as_bool() {
                let len = GetWindowTextLengthW(hwnd);
                if len > 0 {
                    let mut buf = vec![0u16; (len + 1) as usize];
                    GetWindowTextW(hwnd, &mut buf);
                    let title = String::from_utf16_lossy(&buf[..len as usize]);
                    let title_trimmed = title.trim().to_string();

                    if !title_trimmed.is_empty() && title_trimmed != "Velocmd" {
                        let list = &mut *(lparam.0 as *mut Vec<(String, isize)>);
                        list.push((title_trimmed, hwnd.0 as isize));
                    }
                }
            }
            BOOL(1)
        }

        let mut raw_list: Vec<(String, isize)> = Vec::new();
        unsafe {
            let _ = EnumWindows(
                Some(enum_callback),
                LPARAM(&mut raw_list as *mut Vec<(String, isize)> as isize),
            );
        }

        for (i, (title, hwnd_val)) in raw_list.into_iter().enumerate() {
            let t_lower = title.to_lowercase();
            let mut app_type = "Application";

            if t_lower.ends_with("- google chrome") {
                app_type = "Chrome Tab";
            } else if t_lower.ends_with("- brave") {
                app_type = "Brave Tab";
            } else if t_lower.ends_with("- microsoft edge") || t_lower.ends_with("- microsoft\u{200b} edge") {
                app_type = "Edge Tab";
            } else if t_lower.ends_with("- mozilla firefox") {
                app_type = "Firefox Tab";
            } else if t_lower.ends_with("- visual studio code") {
                app_type = "VS Code";
            } else if t_lower.contains("discord") {
                app_type = "Discord";
            } else if t_lower.contains("whatsapp") {
                app_type = "WhatsApp";
            }

            windows_list.push(SearchResult {
                path: format!("hwnd:{}|{}", hwnd_val, app_type),
                name: title,
                kind: "active_tab".to_string(),
                score: (200 - i as u16).max(1),
                icon_data: None,
            });
        }
    }

    windows_list
}

#[tauri::command]
fn focus_window(app: tauri::AppHandle, hwnd_val: isize) {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{
            IsIconic, SetForegroundWindow, ShowWindow, SW_RESTORE,
        };

        unsafe {
            let hwnd = HWND(hwnd_val);
            if IsIconic(hwnd).as_bool() {
                let _ = ShowWindow(hwnd, SW_RESTORE);
            }
            let _ = SetForegroundWindow(hwnd);
        }
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn run_terminal_command(command: String) {
    let _ = std::process::Command::new("cmd")
        .args(["/C", "start", "cmd", "/K", &command])
        .spawn();
}

fn scan_folder(path: &str, kind_override: Option<&str>, index: &mut Vec<IndexedItem>) {
    let walker = WalkDir::new(path)
        .skip_hidden(true)
        .min_depth(1)
        .process_read_dir(|_, _, _, children| {
            children.retain(|result| {
                if let Ok(entry) = result {
                    let name = entry.file_name().to_string_lossy().to_ascii_lowercase();
                    
                    if name == "$recycle.bin" || name == "system volume information"
                    {
                        return false; 
                    }
                }
                true
            });
    });
        
    for entry in walker {
        if let Ok(entry) = entry {
            let path_str = entry.path().to_string_lossy().to_string();
            let is_dir = entry.file_type().is_dir();

            let kind;

            if kind_override == Some("app") {
                if is_dir {
                    continue;
                }

                let ext = entry
                    .path()
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase();

                if ["exe", "lnk", "url"].contains(&ext.as_str()) {
                    let file_name = entry.file_name().to_string_lossy().to_lowercase();

                    let is_unwanted = file_name.contains("uninstall")
                        || file_name.starts_with("unins")
                        || file_name.contains("updater")
                        || file_name.contains("reporter")
                        || file_name.contains("setup")
                        || file_name.contains("install")
                        || file_name.contains("helper")
                        || file_name.contains("bug")
                        
                        // Telemetry, Crash, & Maintenance
                        || file_name.contains("crash")
                        || file_name.contains("telemetry")
                        || file_name.contains("bugreport")
                        || file_name.contains("dump")
                        || file_name.contains("maintenance")
                        
                        // Background Services & Windows Cruft
                        || file_name.contains("service")
                        || file_name.contains("host")
                        || file_name.contains("daemon")
                        || file_name.contains("agent")
                        || file_name.contains("broker")
                        
                        // Privilege Elevation
                        || file_name.contains("elevate")
                        || file_name.contains("uac")
                        
                        // Dev Tools, LSPs, & Environments
                        || file_name.contains("language_server")
                        || file_name.contains("lsp")
                        || file_name.contains("esbuild")
                        || file_name.contains("protoc")
                        || file_name.contains("prettier")
                        || file_name.contains("eslint")
                        || file_name.contains("pylint")
                        || file_name.contains("chromedriver")
                        || file_name.contains("geckodriver")
                        
                        // Specific Files
                        || file_name.ends_with("cli.exe")
                        || file_name == "buf.exe"
                        || file_name == "tsc.exe"
                        || file_name == "npm.cmd"
                        || file_name == "yarn.cmd"
                        || file_name == "pip.exe";

                    if is_unwanted {
                        continue;
                    }

                    kind = ItemKind::App;
                } else {
                    continue;
                }
            } else {
                if is_dir {
                    kind = ItemKind::Folder;
                } else {
                    kind = ItemKind::File;
                }
            }

            // if path_str.contains("$Recycle.Bin") || path_str.contains("System Volume Information") {
            //     continue;
            // }

            // let path_lower = path_str.to_ascii_lowercase();
            
            let mut name = Path::new(&path_str)
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| path_str.clone());

            if name.to_lowercase().ends_with(".lnk") || name.to_lowercase().ends_with(".exe") {
                if name.len() > 4 {
                    name = name[..name.len() - 4].to_string();
                }
            }

            let item = IndexedItem {
                path: path_str.into_boxed_str(),
                // path_lower: path_lower.into_boxed_str(),
                name: name.clone().into_boxed_str(),
                name_lower: name.to_lowercase().into_boxed_str(),
                kind,
            };

            index.push(item);
        }
    }
}

fn index_system_settings(index: &mut Vec<IndexedItem>) {
    let settings = vec![
        ("Startup Apps", "ms-settings:startupapps"),
        ("Uninstall Program", "ms-settings:appsfeatures"),
        ("Apps & Features", "ms-settings:appsfeatures"),
        ("Installed Apps", "ms-settings:installed-apps"),
        ("Windows Update", "ms-settings:windowsupdate"),
        ("Display Settings", "ms-settings:display"),
        ("Sound Settings", "ms-settings:sound"),
        ("Bluetooth & other devices", "ms-settings:bluetooth"),
        ("Wi-Fi Settings", "ms-settings:network-wifi"),
        ("Personalization", "ms-settings:personalization"),
        ("Taskbar Settings", "ms-settings:taskbar"),
        ("Date & Time Settings", "ms-settings:dateandtime"),
        ("Power & Sleep Settings", "ms-settings:powersleep"),
        ("Storage Settings", "ms-settings:storagesense"),
        ("Background Apps", "ms-settings:privacy-backgroundapps"),
        ("Notifications & actions", "ms-settings:notifications"),
        ("Default Apps", "ms-settings:defaultapps"),
        ("Control Panel", "cmd:control"),
        ("Uninstall Program (Classic)", "cmd:appwiz.cpl"),
        ("Task Manager", "cmd:taskmgr"),
        ("System Information", "cmd:msinfo32"),
        ("Command Prompt", "cmd:cmd"),
        ("PowerShell", "cmd:powershell"),
        ("Registry Editor", "cmd:regedit"),
        ("Environment Variables", "cmd:rundll32.exe sysdm.cpl,EditEnvironmentVariables"),
        ("System Properties", "cmd:sysdm.cpl"),
        ("Network Connections", "cmd:ncpa.cpl"),
        ("Disk Management", "cmd:diskmgmt.msc"),
        ("Device Manager", "cmd:devmgmt.msc"),
        ("Services", "cmd:services.msc"),
        ("Group Policy Editor", "cmd:gpedit.msc"),
        ("Resource Monitor", "cmd:resmon"),
        ("Event Viewer", "cmd:eventvwr.msc"),
    ];

    for (name, path) in settings {
        index.push(IndexedItem {
            path: path.into(),
            // path_lower: path.to_lowercase().into_boxed_str(),
            name: name.into(),
            name_lower: name.to_lowercase().into_boxed_str(),
            kind: ItemKind::Command,
        });
    }
}

fn index_windows_apps(index: &mut Vec<IndexedItem>) {
    let mut command = std::process::Command::new("powershell");
    command.args([
            "-NoProfile",
            "-Command",
            "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-StartApps | Select-Object Name, AppID | ConvertTo-Json -Compress",
        ]); 

    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);

    let output = command.output();

    if let Ok(output) = output {
        let json_str = String::from_utf8_lossy(&output.stdout);
        
        if let Ok(apps) = serde_json::from_str::<serde_json::Value>(&json_str) {
            let app_list = if let Some(arr) = apps.as_array() {
                arr.to_vec()
            } else if apps.is_object() {
                vec![apps]
            } else {
                vec![]
            };

            for app in app_list {
                let name = app.get("Name").or(app.get("name")).and_then(|v| v.as_str()).unwrap_or("");
                let app_id = app.get("AppID").or(app.get("AppId")).or(app.get("appid")).and_then(|v| v.as_str()).unwrap_or("");

                if !name.is_empty() && !app_id.is_empty() {
                    let path = if app_id.contains(':') || app_id.contains('\\') {
                        app_id.to_string()
                    } else {
                        format!("shell:AppsFolder\\{}", app_id)
                    };
                    index.push(IndexedItem {
                        path: path.clone().into_boxed_str(),
                        // path_lower: path.to_lowercase().into_boxed_str(),
                        name: name.into(),
                        name_lower: name.to_lowercase().into_boxed_str(),
                        kind: ItemKind::App,
                    });
                }
            }
        }
    }
}

fn index_velo_commands(index: &mut Vec<IndexedItem>) {
    let velo_commands = vec![
        ("Velo: Help", "velo:help"),
        ("Velo Settings", "velo:settings"),
        ("Velo: Toggle Recents", "velo:toggle_recents"),
        ("Velo: Clear Recents", "velo:clear_recents"),
        ("Velo: Reset Position", "velo:reset_position"),
        ("Velo: Refresh Index", "velo:refresh"),
        ("Show Desktop", "velo:show_desktop"),
        ("Active Tabs", "velo:active_tabs"),
        ("Shutdown", "velo:request_shutdown"),
        ("Media: Play/Pause", "velo:media_play"),
        ("Media: Next Track", "velo:media_next"),
        ("Media: Previous Track", "velo:media_prev"),
        ("Restart", "velo:request_restart"),
    ];

    for (name, path) in velo_commands {
        index.push(IndexedItem {
            path: path.into(),
            // path_lower: path.to_lowercase().into_boxed_str(),
            name: name.into(),
            name_lower: name.to_lowercase().into_boxed_str(),
            kind: ItemKind::Command,
        });
    }
}

#[tauri::command]
fn trigger_index_refresh(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        build_index_internal();
        let _ = app.emit("index_refreshed", ());
    });
}

fn build_index_internal() {
    IS_INDEXING.store(true, Ordering::SeqCst);

    let start = Instant::now();
    println!("Indexing started...");

    let mut new_index = Vec::new();
    index_system_settings(&mut new_index);
    index_velo_commands(&mut new_index);
    index_windows_apps(&mut new_index);

    let app_paths = vec![
        r"C:\ProgramData\Microsoft\Windows\Start Menu\Programs",
        r"C:\Users\Default\AppData\Roaming\Microsoft\Windows\Start Menu\Programs",
    ];

    if let Ok(appdata) = std::env::var("APPDATA") {
        let user_start = format!(r"{}\Microsoft\Windows\Start Menu\Programs", appdata);
        if Path::new(&user_start).exists() {
            scan_folder(&user_start, Some("app"), &mut new_index);
        }
    }

    if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
        // Common store apps launcher
        let local_apps = format!(r"{}\Microsoft\WindowsApps", local_appdata);
        if Path::new(&local_apps).exists() {
            scan_folder(&local_apps, Some("app"), &mut new_index);
        }
        // Local start menu
        let local_start = format!(r"{}\Microsoft\Windows\Start Menu\Programs", local_appdata);
        if Path::new(&local_start).exists() {
            scan_folder(&local_start, Some("app"), &mut new_index);
        }
        // User programs (VS Code, Discord, etc.)
        let user_progs = format!(r"{}\Programs", local_appdata);
        if Path::new(&user_progs).exists() {
            scan_folder(&user_progs, Some("app"), &mut new_index);
        }
    }

    for path in app_paths {
        if Path::new(path).exists() {
            scan_folder(path, Some("app"), &mut new_index);
        }
    }

    let drives = get_available_drives();
    for drive in drives {
        println!("Scanning drive: {}", drive);

        let drive_root = IndexedItem {
            path: drive.clone().into_boxed_str(),
            // path_lower: drive.to_lowercase().into_boxed_str(),
            name: drive.clone().into_boxed_str(),
            name_lower: drive.to_lowercase().into_boxed_str(),
            kind: ItemKind::Drive,
        };
        new_index.push(drive_root);

        scan_folder(&drive, None, &mut new_index);
    }

    let duration = start.elapsed();
    let count = new_index.len();
    // *FILE_INDEX.lock().unwrap() = new_index;
    *FILE_INDEX.write().unwrap() = new_index;
    println!(
        "Indexing complete! Items: {} (Took: {:?})",
        count,
        duration
    );

    IS_INDEXING.store(false, Ordering::SeqCst);
}

fn start_periodic_indexing(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        loop {
            build_index_internal();
            let _ = app.emit("index_refreshed", ());
            std::thread::sleep(std::time::Duration::from_secs(15 * 60));
        }
    });
}

#[tauri::command]
fn get_indexing_state() -> bool {
    IS_INDEXING.load(Ordering::SeqCst)
}

fn main() {
    // start_periodic_indexing();

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            show_main_window(app);
        }))
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        toggle_main_window(app);
                        println!("Global shortcut pressed: {:?}", shortcut);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            search_files,
            open_file,
            reset_window,
            resize_window,
            get_current_shortcut,
            update_shortcut,
            get_available_drives,
            run_terminal_command,
            set_recents_state,
            execute_media_key,
            check_shortcuts_availability,
            trigger_index_refresh,
            show_desktop,
            get_active_windows,
            focus_window,
            get_indexing_state
        ])
        .setup(|app| {
            start_periodic_indexing(app.handle().clone());

            let window = app.get_webview_window("main").unwrap();
            let w_clone = window.clone();

            window.on_window_event(move |event| {
                if let tauri::WindowEvent::Focused(false) = event {
                    if REFOCUS_ON_BLUR.compare_exchange(true, false, Ordering::SeqCst, Ordering::SeqCst).is_ok() {
                        let _ = w_clone.set_focus();
                    } else {
                        let _ = w_clone.hide();
                    }
                }
            });

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let icon_bytes = include_bytes!("../icons/icon_32x32.png");
            let tray_icon = match image::load_from_memory(icon_bytes) {
                Ok(dynamic_img) => {
                    let rgba_img = dynamic_img.into_rgba8();
                    let (width, height) = rgba_img.dimensions();
                    tauri::image::Image::new_owned(rgba_img.into_raw(), width, height)
                }
                Err(_) => app.default_window_icon().unwrap().clone(),
            };

            let _tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        toggle_main_window(app);
                    }
                    _ => {
                        println!("menu item {:?} not handled", event.id);
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        toggle_main_window(app);
                    }
                })
                .build(app)?;

            let loaded_shortcut = load_shortcut(app.handle());
            let mut current = CURRENT_SHORTCUT.lock().unwrap();

            if app.global_shortcut().register(loaded_shortcut.as_str()).is_ok() {
                *current = loaded_shortcut.clone();
            } else {
                eprintln!("Failed to register loaded shortcut, trying fallbacks...");
                let mut found = false;
                for sc in PRESET_SHORTCUTS {
                    if app.global_shortcut().register(*sc).is_ok() {
                        *current = sc.to_string();
                        save_shortcut(app.handle(), sc);
                        println!("Fallback shortcut registered: {}", sc);
                        found = true;
                        break;
                    }
                }
                if !found {
                    eprintln!("Failed to register any fallback shortcuts");
                }
            }

            show_main_window(app.handle());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}