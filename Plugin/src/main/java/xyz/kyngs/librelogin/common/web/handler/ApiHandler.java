/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.handler;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.web.WebSessionManager;

public class ApiHandler extends HttpServlet {

    private final AuthenticLibreLogin<?, ?> plugin;
    private final WebSessionManager sessionManager;
    private final Gson gson;

    public ApiHandler(
            AuthenticLibreLogin<?, ?> plugin, WebSessionManager sessionManager, Gson gson) {
        this.plugin = plugin;
        this.sessionManager = sessionManager;
        this.gson = gson;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");

        try {
            if ("/check-token".equals(path)) {
                handleCheckToken(req, resp);
            } else if ("/login".equals(path)) {
                handleLogin(req, resp);
            } else if ("/register".equals(path)) {
                handleRegister(req, resp);
            } else if ("/session-auth".equals(path)) {
                handleSessionAuth(req, resp);
            } else if ("/admin/apply".equals(path)) {
                handleAdminApply(req, resp);
            } else {
                resp.setStatus(404);
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Internal Server Error")));
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");

        if ("/user".equals(path)) {
            handleGetUser(req, resp);
        } else {
            resp.setStatus(404);
        }
    }

    private void handleCheckToken(HttpServletRequest req, HttpServletResponse resp)
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

    private void handleLogin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
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

    private void handleRegister(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
        String tokenStr = body.get("token").getAsString();
        String password = body.get("password").getAsString();

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

        xyz.kyngs.librelogin.api.crypto.HashedPassword hashed =
                plugin.getDefaultCryptoProvider().createHash(password);
        user.setHashedPassword(hashed);
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
        resp.getWriter().write(gson.toJson(response));
    }

    private void handleSessionAuth(HttpServletRequest req, HttpServletResponse resp)
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

        // Use a local variable with a raw type cast for the plugin to satisfy generic method call
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

    private void handleAdminApply(HttpServletRequest req, HttpServletResponse resp)
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

    private void handleGetUser(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String sessionId = req.getHeader("X-Session-ID");
        WebSessionManager.SessionInfo session = sessionManager.getSession(sessionId);

        if (session == null) {
            resp.setStatus(401);
            return;
        }

        JsonObject response = new JsonObject();
        if (session.user != null) {
            response.addProperty("username", session.user.getLastNickname());
            response.addProperty("premium", session.user.getPremiumUUID() != null);
        }
        response.addProperty("isAdmin", session.isAdmin);

        resp.getWriter().write(gson.toJson(response));
    }

    record ErrorResponse(String error) {}
}
