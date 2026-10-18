// Reference Paper/Spigot plugin pseudocode demonstrating how to securely poll the
// webstore Plugin API (Mode B). This shows the HMAC-SHA256 + timestamp + nonce signing
// that the backend's PluginHMAC middleware verifies.
//
// Build against the Paper API; this file is illustrative (not compiled by the project).

package com.webstore.delivery;

import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class WebstoreDelivery extends JavaPlugin {

    private String baseUrl;     // e.g. https://store.example.com
    private String hmacSecret;  // the secret rotated in Admin → Settings → Plugin API
    private final HttpClient http = HttpClient.newHttpClient();

    @Override
    public void onEnable() {
        saveDefaultConfig();
        baseUrl = getConfig().getString("base_url");
        hmacSecret = getConfig().getString("hmac_secret");

        // Poll the queue every 5 seconds (100 ticks).
        Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::poll, 100L, 100L);
    }

    private void poll() {
        try {
            String body = ""; // GET has empty body
            String ts = String.valueOf(System.currentTimeMillis() / 1000L);
            String nonce = UUID.randomUUID().toString();
            String signature = sign(ts + "." + nonce + "." + body);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/v1/plugin/queue"))
                    .header("X-Timestamp", ts)
                    .header("X-Nonce", nonce)
                    .header("X-Signature", signature)
                    .GET()
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) return;

            // Parse JSON (use Gson in a real plugin). For each job:
            //   - optionally check require_online against Bukkit.getPlayer(username)
            //   - run each command on the main thread via dispatchCommand
            //   - then POST /api/v1/plugin/confirm with {"id": <id>, "success": true}
            // Commands are already sanitized server-side, but NEVER build commands from
            // untrusted strings on the plugin side either.
            handleJobs(resp.body());
        } catch (Exception e) {
            getLogger().warning("poll failed: " + e.getMessage());
        }
    }

    private void handleJobs(String json) {
        // Pseudocode: iterate jobs -> runCommand -> confirm(id)
        // Bukkit.getScheduler().runTask(this, () ->
        //     Bukkit.dispatchCommand(Bukkit.getConsoleSender(), command));
    }

    private void confirm(long id, boolean success) throws Exception {
        String body = "{\"id\":" + id + ",\"success\":" + success + "}";
        String ts = String.valueOf(System.currentTimeMillis() / 1000L);
        String nonce = UUID.randomUUID().toString();
        String signature = sign(ts + "." + nonce + "." + body);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/v1/plugin/confirm"))
                .header("Content-Type", "application/json")
                .header("X-Timestamp", ts)
                .header("X-Nonce", nonce)
                .header("X-Signature", signature)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        http.send(req, HttpResponse.BodyHandlers.ofString());
    }

    private String sign(String message) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] raw = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : raw) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
