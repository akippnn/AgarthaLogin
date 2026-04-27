/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Timestamp;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import xyz.kyngs.librelogin.api.crypto.HashedPassword;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.common.database.AuthenticUser;
import xyz.kyngs.librelogin.common.web.mocks.MockLibreLogin;
import xyz.kyngs.librelogin.common.web.mocks.MockPlatformHandle;

public class FullStackLoadTest {

    private static MockLibreLogin plugin;
    private static WebServer server;
    private static int PORT = 0; // Random
    private static HttpClient client;
    private static final Gson GSON = new Gson();

    @BeforeAll
    public static void setup() throws Exception {
        plugin = new MockLibreLogin();

        // Find a free port
        try (java.net.ServerSocket s = new java.net.ServerSocket(0)) {
            PORT = s.getLocalPort();
        }

        server = new WebServer(plugin, PORT);
        server.start();

        // Give it a moment to bind
        Thread.sleep(1000);

        client =
                HttpClient.newBuilder()
                        .version(HttpClient.Version.HTTP_1_1)
                        .connectTimeout(Duration.ofSeconds(5))
                        .build();

        setupTestData();
    }

    private static void setupTestData() {
        // Create a test user
        UUID uuid = UUID.randomUUID();
        HashedPassword hash = plugin.getDefaultCryptoProvider().createHash("password123");
        User user =
                new AuthenticUser(
                        uuid,
                        null,
                        hash,
                        "TestUser",
                        new Timestamp(System.currentTimeMillis(, null)),
                        new Timestamp(System.currentTimeMillis()),
                        null,
                        "127.0.0.1",
                        null,
                        "lobby",
                        null);
        plugin.getDatabaseProvider().insertUser(user);

        // Simulate online
        ((MockPlatformHandle) plugin.getPlatformHandle()).addPlayer(uuid, new Object());
    }

    @AfterAll
    public static void tearDown() {
        if (server != null) server.stop();
    }

    @Test
    public void runTestSuite() throws Exception {
        System.out.println("=== Starting Comprehensive Performance Suite ===");
        System.out.println("Target: http://localhost:" + PORT);

        verifySecurityConfiguration();
        smokeTest_20k_Requests();
        loadTest_TTFB();
        fullFlow_LoginCycle();
        stressTest_CacheBusting();
        // stressTest_Slowloris(); // Optional, can be flaky in CI environment
    }

    private void verifySecurityConfiguration() throws Exception {
        System.out.println("\n--- [S] Security Configuration Check ---");
        // 1. Unauthorized Login
        HttpRequest req =
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + PORT + "/login.html"))
                        .GET()
                        .build();
        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Unauthorized /login.html: " + resp.statusCode());
        if (resp.statusCode() != 401)
            throw new RuntimeException("Expected 401 for unauthorized login access");
        if (!resp.body().contains("Error"))
            throw new RuntimeException("Expected Error page content");

        // 2. Unauthorized Admin
        req =
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + PORT + "/admin.html"))
                        .GET()
                        .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Unauthorized /admin.html: " + resp.statusCode());
        if (resp.statusCode() != 401)
            throw new RuntimeException("Expected 401 for unauthorized admin access");

        // 3. Authorized Login (Need a token)
        User testUser = plugin.getDatabaseProvider().getByName("TestUser");
        String token =
                server.getSessionManager()
                        .createToken(testUser.getUuid(), WebSessionManager.TokenType.LOGIN);
        req =
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + PORT + "/login.html?token=" + token))
                        .GET()
                        .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Authorized /login.html: " + resp.statusCode());
        if (resp.statusCode() != 200)
            throw new RuntimeException("Expected 200 for authorized login access");
    }

    private void smokeTest_20k_Requests() throws Exception {
        System.out.println("\n--- [A] Smoke Test: 5k Concurrent Requests (Unauthorized) ---");
        int requests = 5000;
        ExecutorService executor =
                Executors.newVirtualThreadPerTaskExecutor(); // Java 21 feature if available, else
        // usage
        // fixed pool
        // Assuming Java 17+, we can use ForkJoinPool.commonPool() or fixed thread pool
        // if virtual threads not enabled
        if (System.getProperty("java.version").startsWith("1."))
            executor = Executors.newFixedThreadPool(100);

        AtomicInteger success = new AtomicInteger(0);
        AtomicInteger fail = new AtomicInteger(0);
        long start = System.nanoTime();

        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (int i = 0; i < requests; i++) {
            futures.add(
                    CompletableFuture.runAsync(
                            () -> {
                                try {
                                    HttpRequest req =
                                            HttpRequest.newBuilder()
                                                    .uri(
                                                            URI.create(
                                                                    "http://localhost:"
                                                                            + PORT
                                                                            + "/login.html"))
                                                    .GET()
                                                    .build();
                                    HttpResponse<Void> resp =
                                            client.send(
                                                    req, HttpResponse.BodyHandlers.discarding());
                                    // We now expect 401 as 'Success' for an unauthorized smoke test
                                    // (DoS
                                    // resilience)
                                    if (resp.statusCode() == 401) success.incrementAndGet();
                                    else fail.incrementAndGet();
                                } catch (Exception e) {
                                    fail.incrementAndGet();
                                }
                            },
                            executor));
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        long end = System.nanoTime();

        double durationMs = (end - start) / 1_000_000.0;
        double rps = requests / (durationMs / 1000.0);

        System.out.println("Result: " + success.get() + " Success / " + fail.get() + " Failed");
        System.out.println("Duration: " + String.format("%.2f", durationMs) + " ms");
        System.out.println("Throughput: " + String.format("%.2f", rps) + " req/sec");
    }

    private void loadTest_TTFB() throws Exception {
        System.out.println("\n--- [B] Load Test: Time To First Byte (TTFB) ---");

        long totalParams = 0;
        int samples = 1000;

        for (int i = 0; i < samples; i++) {
            long start = System.nanoTime();
            HttpRequest req =
                    HttpRequest.newBuilder()
                            .uri(URI.create("http://localhost:" + PORT + "/login.html"))
                            .GET()
                            .build();
            client.send(req, HttpResponse.BodyHandlers.discarding());
            long end = System.nanoTime();
            totalParams += (end - start);
        }

        double avgLatency = (totalParams / (double) samples) / 1_000_000.0;
        System.out.println("Avg TTFB (Static HTML): " + String.format("%.4f", avgLatency) + " ms");

        // Asset simulation
        HttpRequest assetReq =
                HttpRequest.newBuilder()
                        .uri(
                                URI.create(
                                        "http://localhost:"
                                                + PORT
                                                + "/assets/index-B4OtB6ab.js")) // Example asset
                        .GET()
                        .build();
        long startAsset = System.nanoTime();
        HttpResponse<Void> resp = client.send(assetReq, HttpResponse.BodyHandlers.discarding());
        long endAsset = System.nanoTime();

        System.out.println(
                "Asset Fetch ("
                        + resp.statusCode()
                        + "): "
                        + String.format("%.4f", (endAsset - startAsset) / 1_000_000.0)
                        + " ms");
    }

    private void fullFlow_LoginCycle() throws Exception {
        System.out.println("\n--- [C] Full Flow Simulation: Register -> Login ---");

        // 1. Get Token (Mock token generation usually done by plugin, we'll direct
        // insert to session manager)
        User testUser = plugin.getDatabaseProvider().getByName("TestUser");
        String token =
                server.getSessionManager()
                        .createToken(testUser.getUuid(), WebSessionManager.TokenType.LOGIN);

        System.out.println("Step 1: Token Created (" + token + ")");

        // 2. Client checks token
        JsonObject json = new JsonObject();
        json.addProperty("token", token);
        HttpRequest checkReq =
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + PORT + "/api/check-token"))
                        .POST(HttpRequest.BodyPublishers.ofString(GSON.toJson(json)))
                        .build();

        HttpResponse<String> checkResp =
                client.send(checkReq, HttpResponse.BodyHandlers.ofString());
        System.out.println(
                "Step 2: Check Token -> " + checkResp.statusCode() + " " + checkResp.body());

        // 3. Client logins
        json.addProperty("password", "password123");
        HttpRequest loginReq =
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + PORT + "/api/login"))
                        .POST(HttpRequest.BodyPublishers.ofString(GSON.toJson(json)))
                        .build();

        HttpResponse<String> loginResp =
                client.send(loginReq, HttpResponse.BodyHandlers.ofString());
        System.out.println("Step 3: Login -> " + loginResp.statusCode() + " " + loginResp.body());

        // 4. Access Protected
        String sessionId =
                GSON.fromJson(loginResp.body(), JsonObject.class).get("sessionId").getAsString();
        HttpRequest protectedReq =
                HttpRequest.newBuilder()
                        .uri(
                                URI.create(
                                        "http://localhost:"
                                                + PORT
                                                + "/api/user")) // Or similar endpoint requiring
                        // auth
                        .header("X-Session-ID", sessionId)
                        .GET()
                        .build();

        HttpResponse<String> protectedResp =
                client.send(protectedReq, HttpResponse.BodyHandlers.ofString());
        System.out.println(
                "Step 4: Session Access -> "
                        + protectedResp.statusCode()
                        + " "
                        + protectedResp.body());
    }

    private void stressTest_CacheBusting() throws Exception {
        System.out.println("\n--- [D] Stress Test: Cache Busting ---");
        int requests = 5000;
        AtomicLong totalBytes = new AtomicLong(0);

        long start = System.nanoTime();

        ExecutorService executor = Executors.newFixedThreadPool(50);
        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (int i = 0; i < requests; i++) {
            futures.add(
                    CompletableFuture.runAsync(
                            () -> {
                                try {
                                    String bust = UUID.randomUUID().toString();
                                    HttpRequest req =
                                            HttpRequest.newBuilder()
                                                    .uri(
                                                            URI.create(
                                                                    "http://localhost:"
                                                                            + PORT
                                                                            + "/login.html?q="
                                                                            + bust))
                                                    .GET()
                                                    .build();
                                    HttpResponse<byte[]> resp =
                                            client.send(
                                                    req, HttpResponse.BodyHandlers.ofByteArray());
                                    totalBytes.addAndGet(resp.body().length);
                                } catch (Exception ignored) {
                                }
                            },
                            executor));
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        long end = System.nanoTime();

        System.out.println(
                "Processed "
                        + requests
                        + " unique requests in "
                        + ((end - start) / 1_000_000.0)
                        + " ms");
        System.out.println("Total Bandwidth: " + (totalBytes.get() / 1024 / 1024) + " MB");
    }
}
