package com.codebytelabs.blvcktv;

import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

public class MainActivity extends BridgeActivity {

    private static final String UA_IPTV = "IPTVSmartersPro";
    private static final String UA_CHROME =
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
    private static final Pattern URI_ATTR_PATTERN = Pattern.compile("URI=\"([^\"]+)\"");
    private static SSLSocketFactory permissiveSslFactory;

    private boolean webViewConfigured = false;

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

            if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY || keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE) {
                webView.evaluateJavascript(
                    "(function(){ var v = document.querySelector('video'); if (v) { if (v.paused) v.play(); else v.pause(); } })();",
                    null
                );
                return true;
            }

            if (keyCode == KeyEvent.KEYCODE_BACK) {
                webView.evaluateJavascript(
                    "(function(){ if (typeof window.__blvcktvHandleBack === 'function' && window.__blvcktvHandleBack()) return true; var ev = new CustomEvent('blvcktv:tv-back', { cancelable: true }); return !window.dispatchEvent(ev); })()",
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

        if (!webViewConfigured) {
            webViewConfigured = true;
            webView.setWebViewClient(new BlvckTvWebViewClient(bridge));
        }
    }

    private static synchronized SSLSocketFactory getPermissiveSslFactory() {
        if (permissiveSslFactory != null) return permissiveSslFactory;
        try {
            TrustManager[] trustAll = new TrustManager[] {
                new X509TrustManager() {
                    @Override
                    public void checkClientTrusted(X509Certificate[] chain, String authType) {}

                    @Override
                    public void checkServerTrusted(X509Certificate[] chain, String authType) {}

                    @Override
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }
                }
            };
            SSLContext sc = SSLContext.getInstance("TLS");
            sc.init(null, trustAll, new SecureRandom());
            permissiveSslFactory = sc.getSocketFactory();
        } catch (Exception ignored) {
            permissiveSslFactory = (SSLSocketFactory) SSLSocketFactory.getDefault();
        }
        return permissiveSslFactory;
    }

    private static Map<String, String> corsHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        headers.put("Access-Control-Allow-Headers", "*");
        headers.put("Cache-Control", "no-store");
        return headers;
    }

    private static class ResolvedConnection {
        final HttpURLConnection conn;
        final String finalUrl;
        final int status;

        ResolvedConnection(HttpURLConnection conn, String finalUrl, int status) {
            this.conn = conn;
            this.finalUrl = finalUrl;
            this.status = status;
        }
    }

    private static ResolvedConnection openWithRedirects(
        String rawTargetUrl,
        String userAgent,
        int connectTimeoutMs,
        int readTimeoutMs
    ) throws Exception {
        String currentUrl = rawTargetUrl;
        for (int hop = 0; hop < 8; hop++) {
            URL url = new URL(currentUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            if (conn instanceof HttpsURLConnection) {
                HttpsURLConnection https = (HttpsURLConnection) conn;
                https.setSSLSocketFactory(getPermissiveSslFactory());
                https.setHostnameVerifier((hostname, session) -> true);
            }
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(connectTimeoutMs);
            conn.setReadTimeout(readTimeoutMs);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", userAgent);
            conn.setRequestProperty("Accept", "*/*");
            conn.setRequestProperty("Connection", "keep-alive");

            int status = conn.getResponseCode();
            if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                String location = conn.getHeaderField("Location");
                conn.disconnect();
                if (location == null || location.trim().isEmpty()) {
                    return new ResolvedConnection(conn, currentUrl, status);
                }
                currentUrl = new URL(url, location.trim()).toString();
                continue;
            }
            return new ResolvedConnection(conn, currentUrl, status);
        }
        throw new Exception("Too many redirects");
    }

    private static ResolvedConnection openSmartStreamConnection(
        String targetUrl,
        int connectTimeoutMs,
        int readTimeoutMs
    ) throws Exception {
        ResolvedConnection rc = openWithRedirects(targetUrl, UA_IPTV, connectTimeoutMs, readTimeoutMs);
        if (rc.status >= 400 && rc.status != 884) {
            rc.conn.disconnect();
            rc = openWithRedirects(targetUrl, UA_CHROME, connectTimeoutMs, readTimeoutMs);
        }
        return rc;
    }

    private static String readAllUtf8(InputStream in) throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) != -1) {
            bos.write(buf, 0, n);
        }
        return bos.toString("UTF-8");
    }

    private static String rewriteHlsManifest(String manifestText, String baseUrlStr) {
        StringBuilder sb = new StringBuilder(manifestText.length() + 1024);
        String[] lines = manifestText.split("\\r?\\n");
        URL baseUrl;
        try {
            baseUrl = new URL(baseUrlStr);
        } catch (Exception e) {
            return manifestText;
        }

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                sb.append(line).append('\n');
                continue;
            }

            if (trimmed.startsWith("#")) {
                Matcher matcher = URI_ATTR_PATTERN.matcher(line);
                StringBuffer replaced = new StringBuffer();
                while (matcher.find()) {
                    String rawUri = matcher.group(1);
                    try {
                        String abs = new URL(baseUrl, rawUri).toString();
                        String proxyUri = "URI=\"/api/m3u-stream?url=" + URLEncoder.encode(abs, "UTF-8") + "\"";
                        matcher.appendReplacement(replaced, Matcher.quoteReplacement(proxyUri));
                    } catch (Exception e) {
                        matcher.appendReplacement(replaced, Matcher.quoteReplacement(matcher.group(0)));
                    }
                }
                matcher.appendTail(replaced);
                sb.append(replaced).append('\n');
                continue;
            }

            try {
                String abs = new URL(baseUrl, trimmed).toString();
                sb.append("/api/m3u-stream?url=").append(URLEncoder.encode(abs, "UTF-8")).append('\n');
            } catch (Exception e) {
                sb.append(line).append('\n');
            }
        }
        return sb.toString();
    }

    private static WebResourceResponse jsonResponse(int status, String reason, String jsonBody) {
        return new WebResourceResponse(
            "application/json",
            "UTF-8",
            status,
            reason,
            corsHeaders(),
            new ByteArrayInputStream(jsonBody.getBytes(StandardCharsets.UTF_8))
        );
    }

    private static WebResourceResponse textResponse(int status, String reason, String mime, String body) {
        return new WebResourceResponse(
            mime,
            "UTF-8",
            status,
            reason,
            corsHeaders(),
            new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8))
        );
    }

    private static class BlvckTvWebViewClient extends BridgeWebViewClient {

        BlvckTvWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String path = uri != null ? uri.getPath() : null;

            if (path != null && path.startsWith("/api/m3u")) {
                if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                    return new WebResourceResponse("text/plain", "UTF-8", 204, "No Content", corsHeaders(), new ByteArrayInputStream(new byte[0]));
                }
                if ("/api/m3u-stream".equals(path)) {
                    return handleM3uStream(uri);
                }
                if ("/api/m3u-probe".equals(path)) {
                    return handleM3uProbe(uri);
                }
                if ("/api/m3u".equals(path)) {
                    return handleM3uPlaylist(uri);
                }
            }

            if (path != null && path.startsWith("/api/tmdb/")) {
                if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                    return new WebResourceResponse("text/plain", "UTF-8", 204, "No Content", corsHeaders(), new ByteArrayInputStream(new byte[0]));
                }
                return handleTmdbProxy(uri, path);
            }

            return super.shouldInterceptRequest(view, request);
        }

        private WebResourceResponse handleTmdbProxy(Uri uri, String path) {
            String subPath = path.substring("/api/tmdb".length());
            String query = uri.getEncodedQuery();
            String target = "https://api.themoviedb.org/3" + subPath + (query != null && !query.isEmpty() ? "?" + query : "");
            try {
                ResolvedConnection rc = openWithRedirects(
                    target,
                    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                    10000,
                    15000
                );
                if (rc.status >= 400) {
                    rc.conn.disconnect();
                    return jsonResponse(rc.status, "TMDB Error", "{\"results\":[]}");
                }
                return new WebResourceResponse(
                    "application/json",
                    "UTF-8",
                    200,
                    "OK",
                    corsHeaders(),
                    new BufferedInputStream(rc.conn.getInputStream(), 16384)
                );
            } catch (Exception e) {
                return jsonResponse(502, "Bad Gateway", "{\"results\":[]}");
            }
        }

        private WebResourceResponse handleM3uPlaylist(Uri uri) {
            String target = uri.getQueryParameter("url");
            if (target == null || !target.startsWith("http")) {
                return textResponse(400, "Bad Request", "text/plain", "Missing url parameter");
            }
            try {
                ResolvedConnection rc = openSmartStreamConnection(target, 12000, 25000);
                if (rc.status >= 400) {
                    rc.conn.disconnect();
                    return textResponse(rc.status, "Upstream Error", "text/plain", "Upstream fetch failed");
                }
                String contentType = rc.conn.getContentType();
                String mime = "text/plain";
                if (contentType != null && contentType.toLowerCase().contains("json")) {
                    mime = "application/json";
                }
                return new WebResourceResponse(
                    mime,
                    "UTF-8",
                    200,
                    "OK",
                    corsHeaders(),
                    rc.conn.getInputStream()
                );
            } catch (Exception e) {
                return textResponse(502, "Bad Gateway", "text/plain", "Upstream fetch failed");
            }
        }

        private WebResourceResponse handleM3uProbe(Uri uri) {
            String target = uri.getQueryParameter("url");
            if (target == null || !target.startsWith("http")) {
                return jsonResponse(400, "Bad Request", "{\"ok\":false,\"reason\":\"Invalid URL\"}");
            }
            try {
                Uri parsed = Uri.parse(target);
                String tPath = parsed.getPath() != null ? parsed.getPath() : "";
                if (tPath.contains("get.php") || tPath.contains("player_api.php")) {
                    String user = parsed.getQueryParameter("username");
                    String pass = parsed.getQueryParameter("password");
                    String apiUrl = parsed.getScheme() + "://" + parsed.getAuthority()
                        + "/player_api.php?username=" + URLEncoder.encode(user != null ? user : "", "UTF-8")
                        + "&password=" + URLEncoder.encode(pass != null ? pass : "", "UTF-8");
                    ResolvedConnection rc = openSmartStreamConnection(apiUrl, 6000, 6000);
                    if (rc.status >= 400) {
                        rc.conn.disconnect();
                        return jsonResponse(200, "OK", "{\"ok\":false,\"status\":" + rc.status + "}");
                    }
                    String body = readAllUtf8(rc.conn.getInputStream());
                    rc.conn.disconnect();
                    boolean isActive = body.contains("\"auth\":1") && body.contains("\"Active\"");
                    return jsonResponse(200, "OK", "{\"ok\":" + isActive + ",\"status\":200}");
                }

                ResolvedConnection rc = openSmartStreamConnection(target, 6000, 6000);
                boolean ok = rc.status >= 200 && rc.status < 400 && rc.status != 884;
                rc.conn.disconnect();
                return jsonResponse(200, "OK", "{\"ok\":" + ok + ",\"status\":" + rc.status + "}");
            } catch (Exception e) {
                return jsonResponse(200, "OK", "{\"ok\":false,\"status\":0}");
            }
        }

        private WebResourceResponse handleM3uStream(Uri uri) {
            String target = uri.getQueryParameter("url");
            if (target == null || !target.startsWith("http")) {
                return textResponse(400, "Bad Request", "text/plain", "Invalid stream URL");
            }
            try {
                ResolvedConnection rc = openSmartStreamConnection(target, 10000, 15000);
                if (rc.status < 200 || rc.status >= 400 || rc.status == 884) {
                    rc.conn.disconnect();
                    return textResponse(502, "Bad Gateway", "text/plain", "Stream unavailable");
                }

                BufferedInputStream bis = new BufferedInputStream(rc.conn.getInputStream(), 32768);
                bis.mark(128);
                byte[] peekBuf = new byte[64];
                int peekLen = 0;
                while (peekLen < peekBuf.length) {
                    int r = bis.read(peekBuf, peekLen, peekBuf.length - peekLen);
                    if (r <= 0) break;
                    peekLen += r;
                }
                bis.reset();

                String peekStr = peekLen > 0
                    ? new String(peekBuf, 0, peekLen, StandardCharsets.UTF_8).replace("\uFEFF", "").trim()
                    : "";

                if (peekStr.startsWith("#EXTM3U")) {
                    String manifestText = readAllUtf8(bis);
                    bis.close();
                    rc.conn.disconnect();
                    String rewritten = rewriteHlsManifest(manifestText, rc.finalUrl);
                    return new WebResourceResponse(
                        "application/vnd.apple.mpegurl",
                        "UTF-8",
                        200,
                        "OK",
                        corsHeaders(),
                        new ByteArrayInputStream(rewritten.getBytes(StandardCharsets.UTF_8))
                    );
                }

                String rawCt = rc.conn.getContentType();
                String mime = "video/mp2t";
                if (rawCt != null && !rawCt.isEmpty()) {
                    String cleanCt = rawCt.split(";")[0].trim().toLowerCase();
                    if (!cleanCt.equals("application/octet-stream") && !cleanCt.equals("binary/octet-stream")) {
                        mime = cleanCt;
                    }
                }

                return new WebResourceResponse(
                    mime,
                    null,
                    200,
                    "OK",
                    corsHeaders(),
                    bis
                );
            } catch (Exception e) {
                return textResponse(502, "Bad Gateway", "text/plain", "Stream proxy error");
            }
        }
    }
}
