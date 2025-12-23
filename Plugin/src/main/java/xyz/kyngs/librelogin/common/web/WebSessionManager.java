/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;

public class WebSessionManager {

    private final AuthenticLibreLogin<?, ?> plugin;
    private final Map<String, TokenInfo> tokens = new ConcurrentHashMap<>();
    private final Map<UUID, String> activeTokens = new ConcurrentHashMap<>();
    private final Map<String, SessionInfo> sessions = new ConcurrentHashMap<>();
    private final Map<String, Runnable> pendingAdminActions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public WebSessionManager(AuthenticLibreLogin<?, ?> plugin) {
        this.plugin = plugin;

        // Cleanup task
        plugin.repeat(
                () -> {
                    long now = System.currentTimeMillis();
                    tokens.entrySet()
                            .removeIf(
                                    entry -> {
                                        if (entry.getValue().expiration < now) {
                                            if (entry.getValue().playerUuid != null) {
                                                activeTokens.remove(
                                                        entry.getValue().playerUuid,
                                                        entry.getKey());
                                            }
                                            return true;
                                        }
                                        return false;
                                    });
                    sessions.entrySet().removeIf(entry -> entry.getValue().expiration < now);
                    // Actions expire after 5 minutes
                    // (Simplification: We assume actions are short lived, a separate timestamp map
                    // would be better but this is a prototype)
                },
                1000L * 60,
                1000L * 60);
    }

    public String registerAdminAction(Runnable action) {
        String code = generateRandomString(6).substring(0, 6).toUpperCase();
        pendingAdminActions.put(code, action);
        // Auto-expire after 2 minutes
        plugin.delay(() -> pendingAdminActions.remove(code), 1000L * 60 * 2);
        return code;
    }

    public Runnable getAndRemoveAdminAction(String code) {
        return pendingAdminActions.remove(code.toUpperCase());
    }

    public String createToken(UUID playerUuid, TokenType type) {
        // Check for existing valid token
        if (playerUuid != null) {
            String existingToken = activeTokens.get(playerUuid);
            if (existingToken != null) {
                TokenInfo info = tokens.get(existingToken);
                if (info != null
                        && info.type == type
                        && info.expiration > System.currentTimeMillis()) {
                    return existingToken;
                }
            }
        }

        String token = generateRandomString(6);
        // Short lived token for query string (e.g. 5 mins)
        tokens.put(
                token,
                new TokenInfo(
                        playerUuid,
                        type,
                        System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(5)));

        if (playerUuid != null) {
            activeTokens.put(playerUuid, token);
        }
        return token;
    }

    public String createAdminToken() {
        String token = generateRandomString(64);
        // 15 seconds expiration for admin panel access
        tokens.put(
                token,
                new TokenInfo(
                        null,
                        TokenType.ADMIN_ACCESS,
                        System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(15)));
        return token;
    }

    public TokenInfo getToken(String token) {
        return tokens.get(token);
    }

    public void invalidateToken(String token) {
        TokenInfo info = tokens.remove(token);
        if (info != null && info.playerUuid != null) {
            activeTokens.remove(info.playerUuid, token);
        }
    }

    public String createSession(User user, boolean isAdmin) {
        String sessionId = generateRandomString(48);
        sessions.put(
                sessionId,
                new SessionInfo(
                        user, isAdmin, System.currentTimeMillis() + TimeUnit.HOURS.toMillis(2)));
        return sessionId;
    }

    public SessionInfo getSession(String sessionId) {
        if (sessionId == null) return null;
        SessionInfo info = sessions.get(sessionId);
        if (info != null) {
            // Refresh session
            info.expiration = System.currentTimeMillis() + TimeUnit.HOURS.toMillis(2);
        }
        return info;
    }

    public void invalidateSession(String sessionId) {
        sessions.remove(sessionId);
    }

    private String generateRandomString(int length) {
        byte[] bytes = new byte[length];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public enum TokenType {
        LOGIN,
        REGISTER,
        ADMIN_ACCESS
    }

    public static class TokenInfo {
        public final UUID playerUuid;
        public final TokenType type;
        public final long expiration;

        public TokenInfo(UUID playerUuid, TokenType type, long expiration) {
            this.playerUuid = playerUuid;
            this.type = type;
            this.expiration = expiration;
        }
    }

    public static class SessionInfo {
        public final User user;
        public final boolean isAdmin;
        public long expiration;

        public SessionInfo(User user, boolean isAdmin, long expiration) {
            this.user = user;
            this.isAdmin = isAdmin;
            this.expiration = expiration;
        }
    }
}
