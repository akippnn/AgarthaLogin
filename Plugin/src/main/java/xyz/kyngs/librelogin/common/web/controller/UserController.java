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
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.web.WebSessionManager;

public class UserController {

    private final AuthenticLibreLogin<?, ?> plugin;
    private final WebSessionManager sessionManager;
    private final Gson gson;

    public UserController(
            AuthenticLibreLogin<?, ?> plugin, WebSessionManager sessionManager, Gson gson) {
        this.plugin = plugin;
        this.sessionManager = sessionManager;
        this.gson = gson;
    }

    public void handleCheckPremium(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String username = req.getParameter("username");
        if (username == null || username.isEmpty()) {
            resp.setStatus(400);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Username required")));
            return;
        }

        JsonObject response = new JsonObject();
        try {
            var premiumUser = plugin.getPremiumProvider().getUserForName(username);
            response.addProperty("isPremium", premiumUser != null);
            if (premiumUser != null) {
                response.addProperty("exactName", premiumUser.name());
            }
        } catch (Exception e) {
            response.addProperty("isPremium", false);
        }
        resp.getWriter().write(gson.toJson(response));
    }

    public void handleGetUser(HttpServletRequest req, HttpServletResponse resp) throws IOException {
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
}
