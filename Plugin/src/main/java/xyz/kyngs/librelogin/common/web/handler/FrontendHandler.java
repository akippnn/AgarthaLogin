/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import xyz.kyngs.librelogin.common.web.WebSessionManager;

public class FrontendHandler extends HttpServlet {

    private final Class<?> resourceClass;
    private final WebSessionManager sessionManager;

    public FrontendHandler(Class<?> resourceClass, WebSessionManager sessionManager) {
        this.resourceClass = resourceClass;
        this.sessionManager = sessionManager;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String path = sanitizePath(req.getRequestURI());

        if (path == null) {
            resp.setStatus(400);
            return;
        }

        // Logic to protect specific entry points
        // If the user requests a protected page, we check the token
        // If INVALID -> serve /login.html (so frontend can show "No token provided" or
        // "Invalid
        // token")
        // If VALID but WRONG TYPE -> serve /login.html (frontend will redirect if it
        // wants, or show
        // error)
        if (isProtected(path)) {
            String tokenParam = req.getParameter("token");
            boolean authorized = false;

            if (tokenParam != null) {
                var tokenData = sessionManager.getToken(tokenParam);
                if (tokenData != null) {
                    if (path.equals("/admin.html")
                            && tokenData.type == WebSessionManager.TokenType.ADMIN_ACCESS) {
                        authorized = true;
                    } else if (path.equals("/register.html")
                            && tokenData.type == WebSessionManager.TokenType.REGISTER) {
                        authorized = true;
                    } else if (path.equals("/sessionauth.html")
                            && tokenData.type == WebSessionManager.TokenType.LOGIN) {
                        authorized = true;
                    } else if (path.equals("/login.html")
                            && tokenData.type == WebSessionManager.TokenType.LOGIN) {
                        authorized = true;
                    }
                }
            }

            if (!authorized) {
                resp.setStatus(401);
                path = "/error.html";
            }
        }

        try (InputStream is = resourceClass.getResourceAsStream("/web" + path)) {
            if (is == null) {
                resp.setStatus(404);
                return;
            }

            if (path.endsWith(".html")) resp.setContentType("text/html");
            else if (path.endsWith(".js")) resp.setContentType("application/javascript");
            else if (path.endsWith(".css")) resp.setContentType("text/css");
            else if (path.endsWith(".png")) resp.setContentType("image/png");
            else if (path.endsWith(".svg")) resp.setContentType("image/svg+xml");

            OutputStream os = resp.getOutputStream();
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
        }
    }

    private String sanitizePath(String path) {
        if (path == null) return null;

        // Defaulting logic
        if (path.equals("/") || path.equals("/login")) return "/login.html";
        if (path.equals("/register")) return "/register.html";
        if (path.equals("/sessionauth")) return "/sessionauth.html";
        if (path.equals("/admin")) return "/admin.html";

        if (!path.contains(".")) {
            return "/login.html";
        }

        // Validation: Reject ".." (parent directory), "\" (windows separator), and NUL
        // characters
        if (path.contains("..") || path.contains("\\") || path.indexOf(0) != -1) {
            return null;
        }

        // Ensure path starts with /
        if (!path.startsWith("/")) {
            path = "/" + path;
        }

        return path;
    }

    private boolean isProtected(String path) {
        return path.equals("/admin.html")
                || path.equals("/register.html")
                || path.equals("/sessionauth.html")
                || path.equals("/login.html");
    }
}
