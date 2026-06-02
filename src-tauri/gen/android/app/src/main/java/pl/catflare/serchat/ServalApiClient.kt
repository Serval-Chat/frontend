package pl.catflare.serchat

import org.json.JSONObject
import android.content.Context
import android.provider.Settings
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

object ServalApiClient {
    var authToken: String? = null
    var serverUrl: String = "https://rolling.catfla.re/"
    var appContext: Context? = null

    fun registerFcmToken(token: String) {
        if (authToken == null) return
        thread {
            try {
                val url = URL("${serverUrl.trimEnd('/')}/api/v1/push/subscribe/fcm")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.connectTimeout = 10000
                conn.readTimeout = 10000
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $authToken")
                conn.doOutput = true

                val jsonBody = JSONObject()
                    .put("token", token)
                    .put("deviceId", getDeviceId())
                    .toString()
                conn.outputStream.use { it.write(jsonBody.toByteArray()) }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun getDeviceId(): String {
        val context = appContext
        if (context != null) {
            return Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ANDROID_ID
            ) ?: "android-unknown"
        }

        return "android-unknown"
    }
}
