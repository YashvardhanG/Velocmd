#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use jwalk::WalkDir;
use once_cell::sync::Lazy;
use std::collections::HashSet;
use std::io::Cursor;
use std::path::Path;
use std::sync::Mutex;
use std::time::Instant;
use systemicons::get_icon;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

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
    path_lower: Box<str>,
    kind: ItemKind,
}

static CURRENT_SHORTCUT: Lazy<Mutex<String>> =
    Lazy::new(|| Mutex::new("Super+Shift+.".to_string()));
static FILE_INDEX: Lazy<Mutex<Vec<IndexedItem>>> = Lazy::new(|| Mutex::new(Vec::new()));
static SHOW_RECENTS: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(true));

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

fn toggle_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
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
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.emit("reset_state", ());
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
    let index = FILE_INDEX.lock().unwrap();
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

    if query_trim.to_lowercase().starts_with("@settings")
        || query_trim.to_lowercase().starts_with("/settings")
        || query_trim.to_lowercase().starts_with("@velo")
        || query_trim.to_lowercase().starts_with("/velo")
    {
        let mut settings_results = Vec::new();

        settings_results.push(SearchResult {
            path: "velo:settings".to_string(),
            name: "Velo Settings".to_string(),
            kind: "command".to_string(),
            score: 200,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "velo:toggle_recents".to_string(),
            name: "Velo: Toggle Recents".to_string(),
            kind: "command".to_string(),
            score: 199,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "velo:clear_recents".to_string(),
            name: "Velo: Clear Recents".to_string(),
            kind: "command".to_string(),
            score: 198,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "velo:reset_position".to_string(),
            name: "Velo: Reset Position".to_string(),
            kind: "command".to_string(),
            score: 197,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "velo:request_shutdown".to_string(),
            name: "Shutdown".to_string(),
            kind: "command".to_string(),
            score: 190,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "velo:refresh".to_string(),
            name: "Velo: Refresh Index".to_string(),
            kind: "command".to_string(),
            score: 195,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "velo:media_play".to_string(),
            name: "Media: Play/Pause".to_string(),
            kind: "command".to_string(),
            score: 189,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "velo:media_next".to_string(),
            name: "Media: Next Track".to_string(),
            kind: "command".to_string(),
            score: 188,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "velo:media_prev".to_string(),
            name: "Media: Previous Track".to_string(),
            kind: "command".to_string(),
            score: 187,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "velo:request_restart".to_string(),
            name: "Restart".to_string(),
            kind: "command".to_string(),
            score: 180,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "ms-settings:startupapps".to_string(),
            name: "Startup Apps".to_string(),
            kind: "command".to_string(),
            score: 175,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "ms-settings:appsfeatures".to_string(),
            name: "Apps & Features (Uninstall)".to_string(),
            kind: "command".to_string(),
            score: 174,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "ms-settings:sound".to_string(),
            name: "Sound Settings (Volume)".to_string(),
            kind: "command".to_string(),
            score: 170,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "ms-settings:display".to_string(),
            name: "Display Settings (Brightness)".to_string(),
            kind: "command".to_string(),
            score: 160,
            icon_data: None,
        });

        settings_results.push(SearchResult {
            path: "ms-settings:windowsupdate".to_string(),
            name: "Windows Update".to_string(),
            kind: "command".to_string(),
            score: 150,
            icon_data: None,
        });

        return settings_results;
    }

    let mut results: Vec<SearchResult> = index
        .iter()
        .filter_map(|item| {
            for filter in &filters {
                let f_content = &filter[1..];
                match f_content {
                    "app" | "apps" | "application" | "applications" | "exe" | "lnk" => {
                        let is_exe =
                            item.path_lower.ends_with(".exe") || item.path_lower.ends_with(".lnk");
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
                        let letter = d.chars().next().unwrap();
                        let drive_prefix = format!("{}:", letter);
                        if !item.path_lower.starts_with(&drive_prefix) {
                            return None;
                        }
                    }
                    "setting" | "settings" | "config" | "setup" => {
                        if item.kind != ItemKind::Command {
                            return None;
                        }
                    }
                    ext => {
                        if !item.path_lower.ends_with(&format!(".{}", ext)) {
                            return None;
                        }
                    }
                }
            }

            let mut name = Path::new(item.path.as_ref())
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| item.path.to_string());

            if name.to_lowercase().ends_with(".lnk") || name.to_lowercase().ends_with(".exe") {
                name = name[..name.len() - 4].to_string();
            }

            let name_lower = name.to_lowercase();

            if !search_text.is_empty() {
                if !name_lower.contains(&search_text) && !item.path_lower.contains(&search_text) {
                    return None;
                }
            }

            let mut score: u16 = 1;

            if item.kind == ItemKind::App || item.kind == ItemKind::Command {
                score += 100;
            }
            if item.kind == ItemKind::Drive {
                score += 80;
            }

            if name_lower == search_text {
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
                name,
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
            if std::process::Command::new("cmd.exe")
                .args(["/C", "start", "", &path])
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
            if let Err(e) = std::process::Command::new("cmd.exe")
                .args(["/C", cmd])
                .spawn()
            {
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
fn run_terminal_command(command: String) {
    let _ = std::process::Command::new("cmd")
        .args(["/C", "start", "cmd", "/K", &command])
        .spawn();
}

fn scan_folder(path: &str, kind_override: Option<&str>, index: &mut Vec<IndexedItem>) {
    for entry in WalkDir::new(path).skip_hidden(true).min_depth(1) {
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

            if path_str.contains("$Recycle.Bin") || path_str.contains("System Volume Information") {
                continue;
            }

            let path_lower = path_str.to_lowercase();
            let item = IndexedItem {
                path: path_str.into_boxed_str(),
                path_lower: path_lower.into_boxed_str(),
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

    for (_name, path) in settings {
        index.push(IndexedItem {
            path: path.into(),
            path_lower: path.to_lowercase().into_boxed_str(),
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
    let start = Instant::now();
    println!("Indexing started...");

    let mut new_index = Vec::new();
    index_system_settings(&mut new_index);

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
        let local_apps = format!(r"{}\Microsoft\WindowsApps", local_appdata);
        if Path::new(&local_apps).exists() {
            scan_folder(&local_apps, Some("app"), &mut new_index);
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
            path_lower: drive.to_lowercase().into_boxed_str(),
            kind: ItemKind::Drive,
        };
        new_index.push(drive_root);

        scan_folder(&drive, None, &mut new_index);
    }

    let duration = start.elapsed();
    let count = new_index.len();
    *FILE_INDEX.lock().unwrap() = new_index;
    println!(
        "Indexing complete! Items: {} (Took: {:?})",
        count,
        duration
    );
}

fn start_periodic_indexing() {
    std::thread::spawn(|| {
        loop {
            build_index_internal();
            std::thread::sleep(std::time::Duration::from_secs(15 * 60));
        }
    });
}

fn main() {
    start_periodic_indexing();

    tauri::Builder::default()
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
            trigger_index_refresh
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let w_clone = window.clone();

            window.on_window_event(move |event| {
                if let tauri::WindowEvent::Focused(false) = event {
                    let _ = w_clone.hide();
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

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}