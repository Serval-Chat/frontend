cargo tauri build \
  --runner cargo-xwin \
  --target x86_64-pc-windows-msvc \
  -c '{"bundle":{"targets":["nsis"]}}'

# thou shall be at src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/Serchat_0.1.0_x64-setup.exe