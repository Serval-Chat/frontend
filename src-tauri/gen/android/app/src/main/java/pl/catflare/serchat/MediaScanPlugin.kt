package pl.catflare.serchat

import android.app.Activity
import android.media.MediaScannerConnection
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin

@InvokeArg
class ScanFileArgs {
    lateinit var path: String
}

@TauriPlugin
class MediaScanPlugin(private val activity: Activity) : Plugin(activity) {
    @Command
    fun scanFile(invoke: Invoke) {
        val args = invoke.parseArgs(ScanFileArgs::class.java)
        MediaScannerConnection.scanFile(
            activity,
            arrayOf(args.path),
            null
        ) { _, _ -> }
        invoke.resolve()
    }
}
