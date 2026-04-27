/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web;

import com.google.gson.Gson;
import org.eclipse.jetty.ee9.servlet.ServletContextHandler;
import org.eclipse.jetty.ee9.servlet.ServletHolder;
import org.eclipse.jetty.server.Server;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import java.io.IOException;
import xyz.kyngs.librelogin.common.web.handler.ApiHandler;
import xyz.kyngs.librelogin.common.web.handler.FrontendHandler;

/**
 * Manages the embedded Jetty web server instance.
 *
 * <p>This class handles:
 *
 * <ul>
 *   <li>Server lifecycle (Start/Stop)
 *   <li>Dependency Injection (Session & RateLimit managers)
 *   <li>Route registry (/api/* and static content)
 * </ul>
 */
public class WebServer {

    private final AuthenticLibreLogin<?, ?> plugin;
    private final int port;
    private Server server;
    private final WebSessionManager sessionManager;
    private final RateLimitManager rateLimitManager;
    private final Gson gson;

    /**
     * Constructs the WebServer.
     *
     * @param plugin The main plugin instance (for logging/config).
     * @param port The port to bind the Jetty server to.
     */
    public WebServer(AuthenticLibreLogin<?, ?> plugin, int port) {
        this.plugin = plugin;
        this.port = port;
        this.sessionManager = new WebSessionManager(plugin);
        this.rateLimitManager = new RateLimitManager();
        this.gson = new Gson();
    }

    public void start() {
        server = new Server(port);

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        server.setHandler(context);

        // API Handler
        context.addServlet(
                new ServletHolder(new ApiHandler(plugin, sessionManager, rateLimitManager, gson)),
                "/api/*");

        // Security Headers Filter
        context.addFilter(new org.eclipse.jetty.ee9.servlet.FilterHolder(new jakarta.servlet.Filter() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest request, jakarta.servlet.ServletResponse response, jakarta.servlet.FilterChain chain) throws IOException, jakarta.servlet.ServletException {
                if (response instanceof jakarta.servlet.http.HttpServletResponse res) {
                    res.setHeader("X-Frame-Options", "DENY");
                    res.setHeader("X-Content-Type-Options", "nosniff");
                    res.setHeader("X-XSS-Protection", "1; mode=block");
                    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
                    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
                }
                chain.doFilter(request, response);
            }
        }), "/*", java.util.EnumSet.of(jakarta.servlet.DispatcherType.REQUEST));

        // Frontend Handler (Static files)
        context.addServlet(
                new ServletHolder(new FrontendHandler(plugin.getClass(), sessionManager)), "/*");

        new Thread(
                        () -> {
                            try {
                                server.start();
                                plugin.getLogger().info("Web server started on port " + port);
                                server.join();
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
