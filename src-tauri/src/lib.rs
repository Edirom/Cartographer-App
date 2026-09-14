// Shared application entry point.
//
// On mobile (Android/iOS) the Rust code is compiled as a shared library that
// the native wrapper loads, so the Tauri setup lives here in `run()` and is
// exposed through the `mobile_entry_point`. The desktop binary in `main.rs`
// simply calls this same function.

#[tauri::command]
async fn gh_device_code(client_id: String) -> Result<serde_json::Value, String> {
    reqwest::Client::new()
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .form(&[("client_id", client_id.as_str()), ("scope", "repo user:email")])
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn gh_poll_token(client_id: String, device_code: String) -> Result<serde_json::Value, String> {
    reqwest::Client::new()
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", client_id.as_str()),
            ("device_code", device_code.as_str()),
            ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
        ])
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![gh_device_code, gh_poll_token])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}