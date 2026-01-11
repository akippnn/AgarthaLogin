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
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;

public class FrontendHandler extends HttpServlet {

    private final AuthenticLibreLogin<?, ?> plugin;

    public FrontendHandler(AuthenticLibreLogin<?, ?> plugin) {
        this.plugin = plugin;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String path = sanitizePath(req.getRequestURI());

        if (path == null) {
            resp.setStatus(400);
            return;
        }

        try (InputStream is = plugin.getClass().getResourceAsStream("/web" + path)) {
            if (is == null) {
                resp.setStatus(404);
                return;
            }

            if (path.endsWith(".html"))
                resp.setContentType("text/html");
            else if (path.endsWith(".js"))
                resp.setContentType("application/javascript");
            else if (path.endsWith(".css"))
                resp.setContentType("text/css");
            else if (path.endsWith(".png"))
                resp.setContentType("image/png");
            else if (path.endsWith(".svg"))
                resp.setContentType("image/svg+xml");

            OutputStream os = resp.getOutputStream();
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
        }
    }

    private String sanitizePath(String path) {
        if (path == null)
            return null;

        // Defaulting logic
        if (path.equals("/") || !path.contains(".")) {
            return "/index.html";
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
}
