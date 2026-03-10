fn init_media_scan<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    #[cfg(target_os = "android")]
    {
        tauri::plugin::Builder::new("mediascan")
            .setup(|_app, api| {
                api.register_android_plugin("pl.catflare.serchat", "MediaScanPlugin")?;
                Ok(())
            })
            .build()
    }
    #[cfg(not(target_os = "android"))]
    {
        tauri::plugin::Builder::new("mediascan").build()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(init_media_scan())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
