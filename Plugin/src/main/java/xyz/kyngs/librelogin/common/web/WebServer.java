/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web;

import com.google.gson.Gson;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.web.handler.ApiHandler;
import xyz.kyngs.librelogin.common.web.handler.FrontendHandler;

public class WebServer {

    private final AuthenticLibreLogin<?, ?> plugin;
    private final int port;
    private Server server;
    private final WebSessionManager sessionManager;
    private final Gson gson;

    public WebServer(AuthenticLibreLogin<?, ?> plugin, int port) {
        this.plugin = plugin;
        this.port = port;
        this.sessionManager = new WebSessionManager(plugin);
        this.gson = new Gson();
    }

    public void start() {
        server = new Server(port);

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        server.setHandler(context);

        // API Handler
        context.addServlet(
                new ServletHolder(new ApiHandler(plugin, sessionManager, gson)), "/api/*");

        // Frontend Handler (Static files)
        context.addServlet(new ServletHolder(new FrontendHandler(plugin)), "/*");

        new Thread(
                        () -> {
                            try {
                                server.start();
                                server.join();
                                plugin.getLogger().info("Web server started on port " + port);
                            } catch (Exception e) {
                                plugin.getLogger().error("Failed to start web server", e);
                            }
                        })
                .start();
    }

    public void stop() {
        if (server != null) {
            try {
                server.stop();
            } catch (Exception e) {
                plugin.getLogger().error("Failed to stop web server", e);
            }
        }
    }

    public WebSessionManager getSessionManager() {
        return sessionManager;
    }
}
