/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import xyz.kyngs.librelogin.api.crypto.HashedPassword;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.web.WebSessionManager;

public class AuthController {

    private final AuthenticLibreLogin<?, ?> plugin;
    private final WebSessionManager sessionManager;
    private final Gson gson;

    public AuthController(
            AuthenticLibreLogin<?, ?> plugin, WebSessionManager sessionManager, Gson gson) {
        this.plugin = plugin;
        this.sessionManager = sessionManager;
        this.gson = gson;
    }

    public void handleCheckToken(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
        String tokenStr = body.get("token").getAsString();

        WebSessionManager.TokenInfo info = sessionManager.getToken(tokenStr);
        if (info == null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Invalid or expired token")));
            return;
        }

        JsonObject response = new JsonObject();
        response.addProperty("valid", true);
        response.addProperty("type", info.type.name());
        if (info.playerUuid != null) {
            User user = plugin.getDatabaseProvider().getByUUID(info.playerUuid);
            if (user != null) {
                response.addProperty("username", user.getLastNickname());
            }
        }

        resp.getWriter().write(gson.toJson(response));
    }

    public void handleLogin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
        String tokenStr = body.get("token").getAsString();
        String password = body.get("password").getAsString();

        WebSessionManager.TokenInfo info = sessionManager.getToken(tokenStr);
        if (info == null || info.type != WebSessionManager.TokenType.LOGIN) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Invalid token for login")));
            return;
        }

        User user = plugin.getDatabaseProvider().getByUUID(info.playerUuid);
        if (user == null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
            return;
        }

        // Check if user is registered (has password)
        if (user.getHashedPassword() == null) {
            resp.setStatus(400);
            resp.getWriter()
                    .write(
                            gson.toJson(
                                    new ErrorResponse(
                                            "User is not registered. Please register first.")));
            return;
        }

        var provider = plugin.getCryptoProvider(user.getHashedPassword().algo());
        if (provider == null) {
            provider = plugin.getDefaultCryptoProvider();
        }

        if (provider.matches(password, user.getHashedPassword())) {
            // Success
            sessionManager.invalidateToken(tokenStr);
            String sessionId = sessionManager.createSession(user, false);

            // Log them in inside the game
            Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
            if (player != null) {
                ((AuthenticLibreLogin) plugin)
                        .getAuthorizationProvider()
                        .authorize(
                                user,
                                player,
                                xyz.kyngs.librelogin.api.event.events.AuthenticatedEvent
                                        .AuthenticationReason.LOGIN);
            }

            JsonObject response = new JsonObject();
            response.addProperty("success", true);
            response.addProperty("sessionId", sessionId);
            resp.getWriter().write(gson.toJson(response));
        } else {
            resp.setStatus(401);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Incorrect password")));
        }
    }

    public void handleRegister(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
        String tokenStr = body.get("token").getAsString();

        // Check if registering as premium (no password needed)
        boolean asPremium = body.has("asPremium") && body.get("asPremium").getAsBoolean();
        String password = asPremium ? null : body.get("password").getAsString();

        WebSessionManager.TokenInfo info = sessionManager.getToken(tokenStr);
        if (info == null || info.type != WebSessionManager.TokenType.REGISTER) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Invalid token for register")));
            return;
        }

        User user = plugin.getDatabaseProvider().getByUUID(info.playerUuid);

        if (user == null) {
            // Should not happen if flow is correct
            resp.setStatus(500);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User state error")));
            return;
        }

        if (asPremium) {
            // Register as premium - verify with Mojang first
            try {
                var premiumUser =
                        plugin.getPremiumProvider().getUserForName(user.getLastNickname());
                if (premiumUser == null || !premiumUser.name().equals(user.getLastNickname())) {
                    resp.setStatus(400);
                    resp.getWriter()
                            .write(
                                    gson.toJson(
                                            new ErrorResponse(
                                                    "Username not found in Mojang or case mismatch."
                                                            + " Cannot register as premium.")));
                    return;
                }
                // Set premium UUID - no password needed
                user.setPremiumUUID(premiumUser.uuid());
                user.setHashedPassword(null);
            } catch (Exception e) {
                resp.setStatus(500);
                resp.getWriter()
                        .write(
                                gson.toJson(
                                        new ErrorResponse(
                                                "Failed to verify premium: " + e.getMessage())));
                return;
            }
        } else {
            // Normal cracked registration with password
            HashedPassword hashed = plugin.getDefaultCryptoProvider().createHash(password);
            if (hashed == null) {
                resp.setStatus(400);
                resp.getWriter().write(gson.toJson(new ErrorResponse("Password too long")));
                return;
            }
            user.setHashedPassword(hashed);
        }

        plugin.getDatabaseProvider().updateUser(user);

        sessionManager.invalidateToken(tokenStr);
        String sessionId = sessionManager.createSession(user, false);

        Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
        if (player != null) {
            ((AuthenticLibreLogin) plugin)
                    .getAuthorizationProvider()
                    .authorize(
                            user,
                            player,
                            xyz.kyngs.librelogin.api.event.events.AuthenticatedEvent
                                    .AuthenticationReason.REGISTER);
        }

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.addProperty("sessionId", sessionId);
        response.addProperty("isPremium", asPremium);
        resp.getWriter().write(gson.toJson(response));
    }

    public void handleSessionAuth(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String sessionId = req.getHeader("X-Session-ID");
        if (sessionId == null) {
            resp.setStatus(401);
            resp.getWriter().write(gson.toJson(new ErrorResponse("No session provided")));
            return;
        }

        WebSessionManager.SessionInfo session = sessionManager.getSession(sessionId);
        if (session == null || session.user == null) {
            resp.setStatus(401);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Invalid session")));
            return;
        }

        JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
        String tokenStr = body.get("token").getAsString();

        WebSessionManager.TokenInfo info = sessionManager.getToken(tokenStr);
        if (info == null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Invalid token")));
            return;
        }

        if (info.playerUuid == null || !info.playerUuid.equals(session.user.getUuid())) {
            resp.setStatus(403);
            resp.getWriter()
                    .write(gson.toJson(new ErrorResponse("Token does not match session user")));
            return;
        }

        // Use a local variable with a raw type cast for the plugin to satisfy generic
        // method call
        AuthenticLibreLogin<Object, Object> rawPlugin =
                (AuthenticLibreLogin<Object, Object>) plugin;

        Object player = rawPlugin.getPlatformHandle().getPlayer(info.playerUuid);
        if (player != null) {
            if (!rawPlugin.getAuthorizationProvider().isAuthorized(player)) {
                rawPlugin
                        .getAuthorizationProvider()
                        .authorize(
                                session.user,
                                player,
                                xyz.kyngs.librelogin.api.event.events.AuthenticatedEvent
                                        .AuthenticationReason.LOGIN);
            }
            // Invalidate the token as it has been used to authorize
            sessionManager.invalidateToken(tokenStr);

            JsonObject response = new JsonObject();
            response.addProperty("success", true);
            resp.getWriter().write(gson.toJson(response));
        } else {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Player not found in-game")));
        }
    }

    public void handleInviteRedeem(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
        String tokenStr = body.get("token").getAsString();
        String code = body.get("code").getAsString();

        WebSessionManager.TokenInfo info = sessionManager.getToken(tokenStr);
        if (info == null) {
            resp.setStatus(400);
            resp.getWriter()
                    .write(gson.toJson(new ErrorResponse("Invalid token for invite redemption")));
            return;
        }

        User user = plugin.getDatabaseProvider().getByUUID(info.playerUuid);
        if (user == null) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
            return;
        }

        if (user.getInvitedBy() != null) {
            resp.setStatus(400);
            resp.getWriter()
                    .write(gson.toJson(new ErrorResponse("You have already used an invite code.")));
            return;
        }

        var provider = plugin.getDatabaseProvider();
        if (provider
                instanceof
                xyz.kyngs.librelogin.common.database.provider.LibreLoginSQLDatabaseProvider
                        sqlProvider) {
            java.util.UUID inviter = sqlProvider.getInviteInviter(code);
            if (inviter == null) {
                resp.setStatus(400);
                String msg =
                        ((xyz.kyngs.librelogin.common.config.HoconMessages) plugin.getMessages())
                                .getRawMessage("error-invite-invalid");
                resp.getWriter().write(gson.toJson(new ErrorResponse(msg)));
                return;
            }

            if (!sqlProvider.redeemInvite(code, user.getUuid())) {
                resp.setStatus(400);
                resp.getWriter()
                        .write(
                                gson.toJson(
                                        new ErrorResponse("Invite code already used or expired.")));
                return;
            }

            user.setInvitedBy(inviter);
            sqlProvider.updateUser(user);
            plugin.invalidateInviteCache(user.getUuid());

            var player = plugin.getPlatformHandle().getPlayer(user.getUuid());
            if (player != null) {
                ((xyz.kyngs.librelogin.api.PlatformHandle) plugin.getPlatformHandle())
                        .getAudienceForPlayer(player)
                        .sendMessage(plugin.getMessages().getMessage("info-invite-redeemed"));
            }

            sessionManager.invalidateToken(tokenStr);
            WebSessionManager.TokenType nextStep =
                    user.getHashedPassword() != null
                            ? WebSessionManager.TokenType.LOGIN
                            : WebSessionManager.TokenType.REGISTER;
            String nextToken = sessionManager.createToken(user.getUuid(), nextStep);

            JsonObject response = new JsonObject();
            response.addProperty("success", true);
            response.addProperty("nextToken", nextToken);
            resp.getWriter().write(gson.toJson(response));
        } else {
            resp.setStatus(500);
            resp.getWriter()
                    .write(
                            gson.toJson(
                                    new ErrorResponse(
                                            "Unsupported database provider for invites.")));
        }
    }

    public void handleAdminVerify(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
        String tokenStr = body.get("token").getAsString();

        WebSessionManager.TokenInfo info = sessionManager.getToken(tokenStr);
        if (info == null || info.type != WebSessionManager.TokenType.ADMIN_ACCESS) {
            resp.setStatus(403);
            return;
        }

        // Invalidate single use token
        sessionManager.invalidateToken(tokenStr);

        // Create session (for persistence if needed)
        String sessionId = sessionManager.createSession(null, true);

        // Register action (Mock action: Give OP/Log message)
        // In a real app, the body would contain the "Action Type" and "Parameters"
        String gameCode =
                sessionManager.registerAdminAction(
                        () -> {
                            plugin.getLogger().info("Admin action executed via Web Panel!");
                        });

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.addProperty("sessionId", sessionId);
        response.addProperty("gameCode", gameCode);

        resp.getWriter().write(gson.toJson(response));
    }
}
