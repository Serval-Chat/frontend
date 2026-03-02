# THIS FILE IS AUTO-GENERATED. DO NOT MODIFY!!

# Copyright 2020-2023 Tauri Programme within The Commons Conservancy
# SPDX-License-Identifier: Apache-2.0
# SPDX-License-Identifier: MIT

-keep class pl.catflare.serchat.* {
  native <methods>;
}

-keep class pl.catflare.serchat.WryActivity {
  public <init>(...);

  void setWebView(pl.catflare.serchat.RustWebView);
  java.lang.Class getAppClass(...);
  java.lang.String getVersion();
}

-keep class pl.catflare.serchat.Ipc {
  public <init>(...);

  @android.webkit.JavascriptInterface public <methods>;
}

-keep class pl.catflare.serchat.RustWebView {
  public <init>(...);

  void loadUrlMainThread(...);
  void loadHTMLMainThread(...);
  void evalScript(...);
}

-keep class pl.catflare.serchat.RustWebChromeClient,pl.catflare.serchat.RustWebViewClient {
  public <init>(...);
}
