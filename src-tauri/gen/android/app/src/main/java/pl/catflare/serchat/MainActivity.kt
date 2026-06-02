package pl.catflare.serchat

import android.os.Bundle

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    ServalApiClient.appContext = applicationContext
    super.onCreate(savedInstanceState)
  }
}
