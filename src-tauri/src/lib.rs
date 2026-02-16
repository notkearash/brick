use tauri::Manager;

#[cfg(target_os = "macos")]
fn setup_window_menu() {
    use objc::runtime::{Class, Object, BOOL, YES};
    use objc::{msg_send, sel, sel_impl};

    unsafe {
        let ns_app: *mut Object =
            msg_send![Class::get("NSApplication").unwrap(), sharedApplication];

        let main_menu: *mut Object = msg_send![ns_app, mainMenu];
        if main_menu.is_null() {
            return;
        }

        let count: isize = msg_send![main_menu, numberOfItems];
        let window_target: *mut Object = msg_send![
            Class::get("NSString").unwrap(),
            stringWithUTF8String: b"Window\0".as_ptr()
        ];

        for i in 0..count {
            let item: *mut Object = msg_send![main_menu, itemAtIndex: i];
            if item.is_null() {
                continue;
            }
            let submenu: *mut Object = msg_send![item, submenu];
            if submenu.is_null() {
                continue;
            }
            let title: *mut Object = msg_send![submenu, title];
            let is_match: BOOL = msg_send![title, isEqualToString: window_target];
            if is_match == YES {
                let _: () = msg_send![ns_app, setWindowsMenu: submenu];
                return;
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            #[cfg(target_os = "macos")]
            setup_window_menu();

            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                let window = app.get_webview_window("main").unwrap();
                apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None)
                    .expect("failed to apply vibrancy");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
