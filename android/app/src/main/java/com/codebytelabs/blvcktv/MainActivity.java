package com.codebytelabs.blvcktv;

import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebView();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        Bridge bridge = getBridge();
        WebView webView = bridge != null ? bridge.getWebView() : null;

        if (webView != null && event.getAction() == KeyEvent.ACTION_DOWN) {
            int keyCode = event.getKeyCode();

            if (keyCode == KeyEvent.KEYCODE_CHANNEL_UP) {
                webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('blvcktv:channel-step', { detail: -1 }));",
                    null
                );
                return true;
            }

            if (keyCode == KeyEvent.KEYCODE_CHANNEL_DOWN) {
                webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('blvcktv:channel-step', { detail: 1 }));",
                    null
                );
                return true;
            }

            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER) {
                webView.evaluateJavascript(
                    "(function(){ var a = document.activeElement; if (a && typeof a.click === 'function') { a.click(); } })();",
                    null
                );
                return true;
            }

            if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY || keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE) {
                webView.evaluateJavascript(
                    "(function(){ var v = document.querySelector('video'); if (v) { if (v.paused) v.play(); else v.pause(); } })();",
                    null
                );
                return true;
            }

            if (keyCode == KeyEvent.KEYCODE_BACK) {
                webView.evaluateJavascript(
                    "(function(){ var ev = new CustomEvent('blvcktv:tv-back', { cancelable: true }); return !window.dispatchEvent(ev); })()",
                    value -> {
                        if (!"true".equals(value)) {
                            runOnUiThread(MainActivity.super::onBackPressed);
                        }
                    }
                );
                return true;
            }
        }

        return super.dispatchKeyEvent(event);
    }

    private void configureWebView() {
        Bridge bridge = getBridge();
        if (bridge == null) return;

        WebView webView = bridge.getWebView();
        if (webView == null) return;

        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    }
}
