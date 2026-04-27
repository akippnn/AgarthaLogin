/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.handler;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.web.RateLimitManager;
import xyz.kyngs.librelogin.common.web.WebSessionManager;
import xyz.kyngs.librelogin.common.web.controller.AdminController;
import xyz.kyngs.librelogin.common.web.controller.AuthController;
import xyz.kyngs.librelogin.common.web.controller.ErrorResponse;
import xyz.kyngs.librelogin.common.web.controller.UserController;

/**
 * Handles all HTTP requests for the API and Admin Panel.
 *
 * <p>Implements the {@link HttpServlet} to process GET, POST, DELETE requests. Acts as a
 * Dispatcher, routing traffic to specialized controllers based on path. Enforces Rate Limiting via
 * {@link RateLimitManager}.
 */
public class ApiHandler extends HttpServlet {

    private final AuthenticLibreLogin<?, ?> plugin;
    private final RateLimitManager rateLimitManager;
    private final Gson gson;

    private final AuthController authController;
    private final AdminController adminController;
    private final UserController userController;

    public ApiHandler(
            AuthenticLibreLogin<?, ?> plugin,
            WebSessionManager sessionManager,
            RateLimitManager rateLimitManager,
            Gson gson) {
        this.plugin = plugin;
        this.rateLimitManager = rateLimitManager;
        this.gson = gson;

        // Initialize Controllers
        this.authController = new AuthController(plugin, sessionManager, gson);
        this.adminController = new AdminController(plugin, sessionManager, gson);
        this.userController = new UserController(plugin, sessionManager, gson);
    }

    /**
     * Checks if the request is allowed by the RateLimitManager.
     *
     * <p>Extracts the client IP (respecting X-Forwarded-For) and queries the rate limiter. If the
     * limit is exceeded, writes a 429 response and returns false.
     *
     * @param req The HTTP request.
     * @param resp The HTTP response.
     * @param cost The cost of the request.
     * @return true if allowed, false if blocked.
     * @throws IOException If writing to response fails.
     */
    private boolean checkRateLimit(HttpServletRequest req, HttpServletResponse resp, int cost)
            throws IOException {
        String ip = req.getRemoteAddr();
        
        java.util.List<String> trustedProxies = plugin.getConfiguration().get(xyz.kyngs.librelogin.common.config.ConfigurationKeys.WEB_TRUSTED_PROXIES);
        boolean isTrusted = false;

        if (trustedProxies != null && !trustedProxies.isEmpty()) {
            for (String proxy : trustedProxies) {
                if (proxy.equals(ip) || (proxy.contains("/") && ip.startsWith(proxy.substring(0, proxy.indexOf('/'))))) {
                    isTrusted = true;
                    break;
                }
            }
        } else {
            isTrusted = true; // Default to old behavior if no proxies defined
        }

        if (isTrusted) {
            String forwarded = req.getHeader("X-Forwarded-For");
            if (forwarded != null) {
                ip = forwarded.split(",")[0].trim();
            }
        }

        if (!rateLimitManager.tryAcquire(ip, cost)) {
            resp.setStatus(429);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Too Many Requests")));
            return false;
        }
        return true;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");

        try {
            int cost = 1;
            if ("/login".equals(path) || "/register".equals(path)) {
                cost = 5;
            }

            if (!checkRateLimit(req, resp, cost)) return;

            if ("/check-token".equals(path)) {
                authController.handleCheckToken(req, resp);
            } else if ("/login".equals(path)) {
                authController.handleLogin(req, resp);
            } else if ("/register".equals(path)) {
                authController.handleRegister(req, resp);
            } else if ("/session-auth".equals(path)) {
                authController.handleSessionAuth(req, resp);
            } else if ("/invite/redeem".equals(path)) {
                authController.handleInviteRedeem(req, resp);
            } else if ("/admin/verify".equals(path)) {
                authController.handleAdminVerify(req, resp);
            } else if (path != null && path.startsWith("/admin/")) {
                adminController.handlePost(req, resp, path);
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

        try {
            if (!checkRateLimit(req, resp, 1)) return;

            if ("/user".equals(path)) {
                userController.handleGetUser(req, resp);
            } else if ("/check-premium".equals(path)) {
                userController.handleCheckPremium(req, resp);
            } else if (path != null && path.startsWith("/admin/")) {
                adminController.handleGet(req, resp, path);
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
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");

        try {
            if (!checkRateLimit(req, resp, 1)) return; // Default cost for delete

            if (path != null && path.startsWith("/admin/")) {
                adminController.handleDelete(req, resp, path);
            } else {
                resp.setStatus(404);
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write(gson.toJson(new ErrorResponse("Internal Server Error")));
        }
    }
}
