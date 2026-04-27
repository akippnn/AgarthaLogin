/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.controller;

import static xyz.kyngs.librelogin.common.AuthenticLibreLogin.DATE_TIME_FORMATTER;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;
import xyz.kyngs.librelogin.api.crypto.HashedPassword;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.api.event.events.AuthenticatedEvent;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.database.AuthenticUser;
import xyz.kyngs.librelogin.common.event.events.AuthenticPasswordChangeEvent;
import xyz.kyngs.librelogin.common.event.events.AuthenticPremiumLoginSwitchEvent;
import xyz.kyngs.librelogin.common.web.WebSessionManager;

public class AdminController {

    private final AuthenticLibreLogin<?, ?> plugin;
    private final WebSessionManager sessionManager;
    private final Gson gson;

    public AdminController(
            AuthenticLibreLogin<?, ?> plugin, WebSessionManager sessionManager, Gson gson) {
        this.plugin = plugin;
        this.sessionManager = sessionManager;
        this.gson = gson;
    }

    public void handleGet(HttpServletRequest req, HttpServletResponse resp, String path)
            throws IOException {
        if (!validateAdminSession(req, resp)) return;

        if ("/admin/users".equals(path)) {
            handleAdminGetUsers(req, resp);
        } else if (path.startsWith("/admin/user/")) {
            String username = path.substring("/admin/user/".length());
            handleAdminGetUserInfo(resp, username);
        } else {
            resp.setStatus(404);
        }
    }

    public void handlePost(HttpServletRequest req, HttpServletResponse resp, String path)
            throws IOException {
        if (!validateAdminSession(req, resp)) return;

        JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);

        switch (path) {
            case "/admin/user/login" -> handleAdminUserLogin(resp, body);
            case "/admin/user/premium" -> handleAdminUserPremium(resp, body);
            case "/admin/user/cracked" -> handleAdminUserCracked(resp, body);
            case "/admin/user/password" -> handleAdminUserPassword(resp, body);
            case "/admin/user/migrate" -> handleAdminUserMigrate(resp, body);
            case "/admin/user/register" -> handleAdminUserRegister(resp, body);
            case "/admin/user/unregister" -> handleAdminUserUnregister(resp, body);
            case "/admin/users/bulk" -> handleAdminBulkAction(resp, body);
            case "/admin/database/optimize" -> handleAdminDatabaseOptimize(resp);
            default -> resp.setStatus(404);
        }
    }

    public void handleDelete(HttpServletRequest req, HttpServletResponse resp, String path)
            throws IOException {
        if (!validateAdminSession(req, resp)) return;

        if (path.startsWith("/admin/user/")) {
            String username = path.substring("/admin/user/".length());
            handleAdminDeleteUser(resp, username);
        } else {
            resp.setStatus(404);
        }
    }

    private boolean validateAdminSession(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String sessionId = req.getHeader("X-Session-ID");
        if (sessionId == null) {
            resp.setStatus(401);
            resp.getWriter().write(gson.toJson(new ErrorResponse("No session provided")));
            return false;
        }

        WebSessionManager.SessionInfo session = sessionManager.getSession(sessionId);
        if (session == null || !session.isAdmin) {
            resp.setStatus(403);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Admin access required")));
            return false;
        }
        return true;
    }

    private void handleAdminGetUsers(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String pageStr = req.getParameter("page");
        String limitStr = req.getParameter("limit");
        String search = req.getParameter("search");

        int page = pageStr != null ? Integer.parseInt(pageStr) : 0;
        int limit = limitStr != null ? Math.min(Integer.parseInt(limitStr), 100) : 50;

        Collection<User> allUsers = plugin.getDatabaseProvider().getAllUsers();

        var filteredUsers = allUsers.stream();
        if (search != null && !search.isEmpty()) {
            String lowerSearch = search.toLowerCase();
            filteredUsers =
                    filteredUsers.filter(
                            u -> u.getLastNickname().toLowerCase().contains(lowerSearch));
        }

        var userList = filteredUsers.toList();
        int total = userList.size();

        var pagedUsers = userList.stream().skip((long) page * limit).limit(limit).toList();

        JsonArray usersArray = new JsonArray();
        for (User user : pagedUsers) {
            usersArray.add(userToJson(user, false));
        }

        JsonObject response = new JsonObject();
        response.add("users", usersArray);
        response.addProperty("total", total);
        response.addProperty("page", page);
        response.addProperty("limit", limit);

        resp.getWriter().write(gson.toJson(response));
    }

    private void handleAdminGetUserInfo(HttpServletResponse resp, String username)
            throws IOException {
        User user = plugin.getDatabaseProvider().getByName(username);
        if (user == null) {
            resp.setStatus(404);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
            return;
        }

        JsonObject userJson = userToJson(user, true);

        if (user.getIp() != null) {
            Collection<User> alts = plugin.getDatabaseProvider().getByIP(user.getIp());
            JsonArray altsArray = new JsonArray();
            for (User alt : alts) {
                if (!alt.getUuid().equals(user.getUuid())) {
                    JsonObject altJson = new JsonObject();
                    altJson.addProperty("username", alt.getLastNickname());
                    altJson.addProperty("uuid", alt.getUuid().toString());
                    if (alt.getLastSeen() != null) {
                        altJson.addProperty(
                                "lastSeen",
                                DATE_TIME_FORMATTER.format(alt.getLastSeen().toLocalDateTime()));
                    }
                    altsArray.add(altJson);
                }
            }
            userJson.add("alts", altsArray);
        }

        Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
        userJson.addProperty("online", player != null);
        if (player != null) {
            boolean authorized =
                    ((AuthenticLibreLogin<Object, Object>) plugin)
                            .getAuthorizationProvider()
                            .isAuthorized(player);
            userJson.addProperty("authorized", authorized);
        }

        resp.getWriter().write(gson.toJson(userJson));
    }

    private JsonObject userToJson(User user, boolean detailed) {
        JsonObject json = new JsonObject();
        json.addProperty("username", user.getLastNickname());
        json.addProperty("uuid", user.getUuid().toString());
        json.addProperty("premium", user.getPremiumUUID() != null);
        json.addProperty("registered", user.getHashedPassword() != null);
        json.addProperty("has2fa", user.getSecret() != null);

        if (detailed) {
            json.addProperty(
                    "premiumUuid",
                    user.getPremiumUUID() != null ? user.getPremiumUUID().toString() : null);
            json.addProperty("email", user.getEmail());
            json.addProperty("ip", user.getIp());
            json.addProperty("lastServer", user.getLastServer());
            if (user.getHashedPassword() != null) {
                json.addProperty("hashAlgo", user.getHashedPassword().algo());
            }
            if (user.getJoinDate() != null) {
                json.addProperty(
                        "joinDate",
                        DATE_TIME_FORMATTER.format(user.getJoinDate().toLocalDateTime()));
            }
            if (user.getLastSeen() != null) {
                json.addProperty(
                        "lastSeen",
                        DATE_TIME_FORMATTER.format(user.getLastSeen().toLocalDateTime()));
            }
            if (user.getLastAuthentication() != null) {
                json.addProperty(
                        "lastAuthentication",
                        DATE_TIME_FORMATTER.format(user.getLastAuthentication().toLocalDateTime()));
            }
        }

        return json;
    }

    private void handleAdminUserLogin(HttpServletResponse resp, JsonObject body)
            throws IOException {
        String username = body.get("username").getAsString();
        User user = plugin.getDatabaseProvider().getByName(username);

        if (user == null) {
            resp.setStatus(404);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
            return;
        }

        if (user.getHashedPassword() == null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not registered")));
            return;
        }

        Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
        if (player == null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not online")));
            return;
        }

        AuthenticLibreLogin<Object, Object> rawPlugin =
                (AuthenticLibreLogin<Object, Object>) plugin;
        if (rawPlugin.getAuthorizationProvider().isAuthorized(player)) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User already authorized")));
            return;
        }

        rawPlugin
                .getAuthorizationProvider()
                .authorize(user, player, AuthenticatedEvent.AuthenticationReason.LOGIN);

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        resp.getWriter().write(gson.toJson(response));
    }

    private void handleAdminUserPremium(HttpServletResponse resp, JsonObject body)
            throws IOException {
        String username = body.get("username").getAsString();
        User user = plugin.getDatabaseProvider().getByName(username);

        if (user == null) {
            resp.setStatus(404);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
            return;
        }

        try {
            var premiumUser = plugin.getPremiumProvider().getUserForName(username);
            if (premiumUser == null || !premiumUser.name().equals(username)) {
                resp.setStatus(400);
                resp.getWriter()
                        .write(
                                gson.toJson(
                                        new ErrorResponse(
                                                "Username not found in Mojang database or case"
                                                        + " mismatch")));
                return;
            }

            user.setPremiumUUID(premiumUser.uuid());
            user.setHashedPassword(null);
            user.setSecret(null);
            plugin.getDatabaseProvider().updateUser(user);

            plugin.getEventProvider()
                    .unsafeFire(
                            plugin.getEventTypes().premiumLoginSwitch,
                            new AuthenticPremiumLoginSwitchEvent<>(user, null, plugin));

            AuthenticLibreLogin<Object, Object> rawPlugin =
                    (AuthenticLibreLogin<Object, Object>) plugin;
            Object player = rawPlugin.getPlatformHandle().getPlayer(user.getUuid());
            if (player != null) {
                rawPlugin
                        .getPlatformHandle()
                        .kick(
                                player,
                                rawPlugin.getMessages().getMessage("kick-premium-info-enabled"));
            }

            JsonObject response = new JsonObject();
            response.addProperty("success", true);
            resp.getWriter().write(gson.toJson(response));

        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter()
                    .write(
                            gson.toJson(
                                    new ErrorResponse(
                                            "Failed to verify premium: " + e.getMessage())));
        }
    }

    private void handleAdminUserCracked(HttpServletResponse resp, JsonObject body)
            throws IOException {
        String username = body.get("username").getAsString();
        User user = plugin.getDatabaseProvider().getByName(username);

        if (user == null) {
            resp.setStatus(404);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
            return;
        }

        if (user.getHashedPassword() == null) {
            resp.setStatus(400);
            resp.getWriter()
                    .write(
                            gson.toJson(
                                    new ErrorResponse(
                                            "User must have a password set before switching to"
                                                + " cracked mode. Use the password change feature"
                                                + " first.")));
            return;
        }

        user.setPremiumUUID(null);
        plugin.getDatabaseProvider().updateUser(user);

        AuthenticLibreLogin<Object, Object> rawPlugin =
                (AuthenticLibreLogin<Object, Object>) plugin;
        Object player = rawPlugin.getPlatformHandle().getPlayer(user.getUuid());
        if (player != null) {
            rawPlugin
                    .getPlatformHandle()
                    .kick(player, rawPlugin.getMessages().getMessage("kick-premium-info-disabled"));
        }

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        resp.getWriter().write(gson.toJson(response));
    }

    private void handleAdminUserPassword(HttpServletResponse resp, JsonObject body)
            throws IOException {
        String username = body.get("username").getAsString();
        String newPassword = body.get("password").getAsString();

        User user = plugin.getDatabaseProvider().getByName(username);
        if (user == null) {
            resp.setStatus(404);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
            return;
        }

        HashedPassword old = user.getHashedPassword();
        HashedPassword hashed = plugin.getDefaultCryptoProvider().createHash(newPassword);
        if (hashed == null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Password too long")));
            return;
        }

        user.setHashedPassword(hashed);
        plugin.getDatabaseProvider().updateUser(user);

        plugin.getEventProvider()
                .unsafeFire(
                        plugin.getEventTypes().passwordChange,
                        new AuthenticPasswordChangeEvent<>(user, null, plugin, old));

        AuthenticLibreLogin<Object, Object> rawPlugin =
                (AuthenticLibreLogin<Object, Object>) plugin;
        Object player = rawPlugin.getPlatformHandle().getPlayer(user.getUuid());
        if (player != null) {
            var message = rawPlugin.getMessages().getMessage("info-password-changed");
            if (message != null) {
                rawPlugin.getPlatformHandle().getAudienceForPlayer(player).sendMessage(message);
            }
        }

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        resp.getWriter().write(gson.toJson(response));
    }

    private void handleAdminUserMigrate(HttpServletResponse resp, JsonObject body)
            throws IOException {
        String username = body.get("username").getAsString();
        String newUsername = body.get("newUsername").getAsString();

        User user = plugin.getDatabaseProvider().getByName(username);
        if (user == null) {
            resp.setStatus(404);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
            return;
        }

        User colliding = plugin.getDatabaseProvider().getByName(newUsername);
        if (colliding != null && !colliding.getUuid().equals(user.getUuid())) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("New username already taken")));
            return;
        }

        Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
        if (player != null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User must be offline")));
            return;
        }

        user.setLastNickname(newUsername);
        if (user.getPremiumUUID() != null) {
            user.setPremiumUUID(null);
            plugin.getEventProvider()
                    .unsafeFire(
                            plugin.getEventTypes().premiumLoginSwitch,
                            new AuthenticPremiumLoginSwitchEvent<>(user, null, plugin));
        }
        plugin.getDatabaseProvider().updateUser(user);

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        resp.getWriter().write(gson.toJson(response));
    }

    private void handleAdminUserRegister(HttpServletResponse resp, JsonObject body)
            throws IOException {
        String username = body.get("username").getAsString();
        String password = body.get("password").getAsString();

        User existing = plugin.getDatabaseProvider().getByName(username);
        if (existing != null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Username already exists")));
            return;
        }

        HashedPassword hashed = plugin.getDefaultCryptoProvider().createHash(password);
        if (hashed == null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Password too long")));
            return;
        }

        UUID premiumUuid = null;
        try {
            var premiumUser = plugin.getPremiumProvider().getUserForName(username);
            if (premiumUser != null) {
                premiumUuid = premiumUser.uuid();
            }
        } catch (Exception ignored) {
        }

        User user =
                new AuthenticUser(
                        plugin.generateNewUUID(username, premiumUuid),
                        null,
                        hashed,
                        username,
                        Timestamp.valueOf(LocalDateTime.now()),
                        Timestamp.valueOf(LocalDateTime.now()),
                        null,
                        null,
                        Timestamp.valueOf(LocalDateTime.now()),
                        null,
                        null,
                        null);

        plugin.getDatabaseProvider().insertUser(user);

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.addProperty("uuid", user.getUuid().toString());
        resp.getWriter().write(gson.toJson(response));
    }

    private void handleAdminUserUnregister(HttpServletResponse resp, JsonObject body)
            throws IOException {
        String username = body.get("username").getAsString();

        User user = plugin.getDatabaseProvider().getByName(username);
        if (user == null) {
            resp.setStatus(404);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
            return;
        }

        AuthenticLibreLogin<Object, Object> rawPlugin =
                (AuthenticLibreLogin<Object, Object>) plugin;
        Object player = rawPlugin.getPlatformHandle().getPlayer(user.getUuid());
        if (player == null) {
            resp.setStatus(400);
            resp.getWriter()
                    .write(
                            gson.toJson(
                                    new ErrorResponse(
                                            "User must be online to unregister. They need to"
                                                    + " re-register via web-auth.")));
            return;
        }

        rawPlugin.getAuthorizationProvider().unauthorize(player);

        sessionManager.invalidateSessionsByUser(user.getUuid());

        user.setHashedPassword(null);
        user.setSecret(null);
        user.setIp(null);
        user.setLastAuthentication(null);
        user.setPremiumUUID(null);
        plugin.getDatabaseProvider().updateUser(user);

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        resp.getWriter().write(gson.toJson(response));
    }

    private void handleAdminBulkAction(HttpServletResponse resp, JsonObject body)
            throws IOException {
        String action = body.get("action").getAsString();
        JsonArray usernames = body.getAsJsonArray("usernames");

        int success = 0;
        int failed = 0;

        for (var elem : usernames) {
            String username = elem.getAsString();
            User user = plugin.getDatabaseProvider().getByName(username);
            if (user == null) {
                failed++;
                continue;
            }

            try {
                switch (action) {
                    case "premium" -> {
                        var premiumUser = plugin.getPremiumProvider().getUserForName(username);
                        if (premiumUser != null && premiumUser.name().equals(username)) {
                            user.setPremiumUUID(premiumUser.uuid());
                            plugin.getDatabaseProvider().updateUser(user);
                            success++;
                        } else {
                            failed++;
                        }
                    }
                    case "cracked" -> {
                        user.setPremiumUUID(null);
                        plugin.getDatabaseProvider().updateUser(user);
                        success++;
                    }
                    case "unregister" -> {
                        Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
                        if (player != null) {
                            AuthenticLibreLogin<Object, Object> rawPlugin =
                                    (AuthenticLibreLogin<Object, Object>) plugin;
                            rawPlugin.getAuthorizationProvider().unauthorize(player);
                        }
                        user.setHashedPassword(null);
                        user.setSecret(null);
                        user.setIp(null);
                        user.setLastAuthentication(null);
                        user.setPremiumUUID(null);
                        plugin.getDatabaseProvider().updateUser(user);
                        success++;
                    }
                    case "delete" -> {
                        Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
                        if (player != null) {
                            failed++;
                        } else {
                            plugin.getDatabaseProvider().deleteUser(user);
                            success++;
                        }
                    }
                    default -> failed++;
                }
            } catch (Exception e) {
                failed++;
            }
        }

        JsonObject response = new JsonObject();
        response.addProperty("success", failed == 0);
        response.addProperty("processed", success);
        response.addProperty("failed", failed);
        resp.getWriter().write(gson.toJson(response));
    }

    private void handleAdminDatabaseOptimize(HttpServletResponse resp) throws IOException {
        String preferredAlgo = plugin.getDefaultCryptoProvider().getIdentifier();
        int failed = 0;

        Collection<User> allUsers = plugin.getDatabaseProvider().getAllUsers();
        for (User user : allUsers) {
            HashedPassword current = user.getHashedPassword();
            if (current == null) continue;
            if (preferredAlgo.equals(current.algo())) continue;

            failed++;
        }

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.addProperty("preferredAlgo", preferredAlgo);
        response.addProperty("usersNeedingConversion", failed);
        response.addProperty(
                "message",
                "Hash conversion happens automatically on next login. "
                        + failed
                        + " users still use legacy algorithms.");
        resp.getWriter().write(gson.toJson(response));
    }

    private void handleAdminDeleteUser(HttpServletResponse resp, String username)
            throws IOException {
        User user = plugin.getDatabaseProvider().getByName(username);
        if (user == null) {
            resp.setStatus(404);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
            return;
        }

        Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
        if (player != null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Cannot delete online user")));
            return;
        }

        plugin.getDatabaseProvider().deleteUser(user);

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        resp.getWriter().write(gson.toJson(response));
    }
}
