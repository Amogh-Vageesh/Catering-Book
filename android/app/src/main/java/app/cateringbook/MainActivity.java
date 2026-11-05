package app.cateringbook;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.speech.RecognizerIntent;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.content.FileProvider;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewFeature;

import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Catering Book — Android shell.
 * The whole app is the bundled web page (assets/index.html), served from a secure https origin
 * so that sign-in, offline storage and sync behave exactly as in the browser.
 * This class only adds what a web page can't do on its own: native Google sign-in,
 * camera/gallery picking, saving files to Downloads, sharing, printing and the back button.
 */
public class MainActivity extends Activity {
    private static final String START_URL = "https://appassets.androidplatform.net/assets/index.html";
    private static final int REQ_FILE = 41;
    private static final int REQ_SPEECH = 42;
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraUri;
    private CredentialManager credentials;
    private final Executor io = Executors.newSingleThreadExecutor();

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        Window w = getWindow();
        int bar = night ? 0xFF101318 : 0xFFF7F5F1;
        w.setStatusBarColor(bar);
        w.setNavigationBarColor(night ? 0xFF191D24 : 0xFFFFFFFF);
        if (!night) {
            int f = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 27) f |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            w.getDecorView().setSystemUiVisibility(f);
        }

        credentials = CredentialManager.create(this);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setSupportMultipleWindows(false);
        s.setUserAgentString(s.getUserAgentString() + " CateringBookAndroid");
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(s, false);
        }

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return loader.shouldInterceptRequest(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                // tel:, mailto:, wa.me, maps and any other outside link open in their own app.
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException e) { toast("No app can open this link"); }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                try {
                    if (p.isCaptureEnabled() && acceptsImages(p.getAcceptTypes())) {
                        File dir = new File(getCacheDir(), "camera");
                        dir.mkdirs();
                        File f = new File(dir, "bill_" + System.currentTimeMillis() + ".jpg");
                        cameraUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".files", f);
                        Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                        cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                        cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        startActivityForResult(cam, REQ_FILE);
                    } else {
                        cameraUri = null;
                        Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                        pick.addCategory(Intent.CATEGORY_OPENABLE);
                        List<String> mimes = new ArrayList<>();
                        for (String a : p.getAcceptTypes()) {
                            for (String part : a.split(",")) { String m = part.trim(); if (m.contains("/")) mimes.add(m); }
                        }
                        if (mimes.size() == 1) pick.setType(mimes.get(0));
                        else { pick.setType("*/*"); if (!mimes.isEmpty()) pick.putExtra(Intent.EXTRA_MIME_TYPES, mimes.toArray(new String[0])); }
                        if (p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                        startActivityForResult(Intent.createChooser(pick, "Choose file"), REQ_FILE);
                    }
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    toast("Could not open camera or files");
                    return false;
                }
            }
        });

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        if (state != null) web.restoreState(state); else web.loadUrl(START_URL);
    }

    private static boolean acceptsImages(String[] types) {
        if (types == null || types.length == 0) return true;
        for (String t : types) if (t.contains("image") || t.trim().isEmpty()) return true;
        return false;
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_SPEECH) {
            String text = "";
            if (res == RESULT_OK && data != null) {
                ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (r != null && !r.isEmpty()) text = r.get(0);
            }
            js("window.__onSpeech&&window.__onSpeech(" + JSONObject.quote(text) + "," + (text.isEmpty() ? "'cancelled'" : "null") + ")");
            return;
        }
        if (req != REQ_FILE || fileCallback == null) return;
        Uri[] out = null;
        if (res == RESULT_OK) {
            if (cameraUri != null) out = new Uri[]{cameraUri};
            else if (data != null) {
                if (data.getClipData() != null) {
                    int n = data.getClipData().getItemCount();
                    out = new Uri[n];
                    for (int i = 0; i < n; i++) out[i] = data.getClipData().getItemAt(i).getUri();
                } else if (data.getData() != null) out = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(out);
        fileCallback = null;
        cameraUri = null;
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("(window.onBack&&window.onBack())?'1':'0'", v -> {
            if (v == null || !v.contains("1")) finishAfterTransition();
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    private void toast(String m) { runOnUiThread(() -> Toast.makeText(this, m, Toast.LENGTH_SHORT).show()); }

    private void js(String code) { runOnUiThread(() -> web.evaluateJavascript(code, null)); }

    /** Writes a file to Downloads/Catering Book and returns where it went. */
    private String writeDownload(String name, byte[] bytes, String mime) throws Exception {
        if (Build.VERSION.SDK_INT >= 29) {
            ContentValues v = new ContentValues();
            v.put(MediaStore.Downloads.DISPLAY_NAME, name);
            v.put(MediaStore.Downloads.MIME_TYPE, mime);
            v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Catering Book");
            Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (u == null) throw new Exception("Could not create file");
            try (OutputStream os = getContentResolver().openOutputStream(u)) { os.write(bytes); }
            return "Downloads/Catering Book/" + name;
        } else {
            File dir = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Catering Book");
            dir.mkdirs();
            File f = new File(dir, name);
            try (FileOutputStream os = new FileOutputStream(f)) { os.write(bytes); }
            return f.getAbsolutePath();
        }
    }

    private static String mimeFor(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".json")) return "application/json";
        if (n.endsWith(".csv")) return "text/csv";
        if (n.endsWith(".xls")) return "application/vnd.ms-excel";
        if (n.endsWith(".pdf")) return "application/pdf";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        return "text/plain";
    }

    /** Methods the web page can call as window.AndroidBridge.xxx(). */
    public class Bridge {
        // Voice: uses the phone's own speech recogniser (Google), English or Kannada.
        @JavascriptInterface
        public void startSpeech(String lang) {
            runOnUiThread(() -> {
                Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang == null || lang.isEmpty() ? "en-IN" : lang);
                i.putExtra(RecognizerIntent.EXTRA_PROMPT, "kn-IN".equals(lang) ? "ಆರ್ಡರ್ ವಿವರ ಹೇಳಿ" : "Say the order details");
                try { startActivityForResult(i, REQ_SPEECH); }
                catch (ActivityNotFoundException e) { js("window.__onSpeech&&window.__onSpeech('','not-available')"); }
            });
        }

        @JavascriptInterface
        public void saveFile(String name, String text) {
            io.execute(() -> {
                try { writeDownload(name, text.getBytes(StandardCharsets.UTF_8), mimeFor(name)); }
                catch (Exception e) { toast("Could not save " + name); }
            });
        }

        @JavascriptInterface
        public void saveBase64(String name, String b64) {
            io.execute(() -> {
                try { String p = writeDownload(name, Base64.decode(b64, Base64.DEFAULT), mimeFor(name)); toast("Saved to " + p); }
                catch (Exception e) { toast("Could not save " + name); }
            });
        }

        @JavascriptInterface
        public void shareText(String text) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, "Share"));
            });
        }

        @JavascriptInterface
        public void print() {
            runOnUiThread(() -> {
                PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                PrintDocumentAdapter a = web.createPrintDocumentAdapter("Catering Book");
                pm.print("Catering Book", a, new PrintAttributes.Builder().build());
            });
        }

        @JavascriptInterface
        public void googleSignIn() {
            runOnUiThread(() -> {
                GetSignInWithGoogleOption opt = new GetSignInWithGoogleOption.Builder(getString(R.string.web_client_id)).build();
                GetCredentialRequest req = new GetCredentialRequest.Builder().addCredentialOption(opt).build();
                credentials.getCredentialAsync(MainActivity.this, req, new CancellationSignal(), io,
                        new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                            @Override
                            public void onResult(GetCredentialResponse r) {
                                Credential c = r.getCredential();
                                if (c instanceof CustomCredential && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(c.getType())) {
                                    try {
                                        String token = GoogleIdTokenCredential.createFrom(c.getData()).getIdToken();
                                        js("window.__onGoogleIdToken&&window.__onGoogleIdToken(" + JSONObject.quote(token) + ",null)");
                                    } catch (Exception e) {
                                        js("window.__onGoogleIdToken&&window.__onGoogleIdToken(null," + JSONObject.quote("Sign-in failed") + ")");
                                    }
                                } else {
                                    js("window.__onGoogleIdToken&&window.__onGoogleIdToken(null," + JSONObject.quote("Unexpected sign-in result") + ")");
                                }
                            }

                            @Override
                            public void onError(GetCredentialException e) {
                                String msg = e.getMessage() == null ? "Sign-in cancelled" : e.getMessage();
                                js("window.__onGoogleIdToken&&window.__onGoogleIdToken(null," + JSONObject.quote(msg) + ")");
                            }
                        });
            });
        }

        @JavascriptInterface
        public void googleSignOut() {
            credentials.clearCredentialStateAsync(new ClearCredentialStateRequest(), new CancellationSignal(), io,
                    new CredentialManagerCallback<Void, ClearCredentialException>() {
                        @Override public void onResult(Void v) { }
                        @Override public void onError(ClearCredentialException e) { }
                    });
        }
    }
}
