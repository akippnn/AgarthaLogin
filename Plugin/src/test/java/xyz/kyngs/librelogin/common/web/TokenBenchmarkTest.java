/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web;

import jakarta.servlet.ServletInputStream;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpUpgradeHandler;
import jakarta.servlet.http.Part;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.security.Principal;
import java.sql.Timestamp;
import java.util.*;
import java.util.Map;
import org.junit.jupiter.api.Test;
import xyz.kyngs.librelogin.api.PlatformHandle;
import xyz.kyngs.librelogin.api.crypto.HashedPassword;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.util.CancellableTask;
import xyz.kyngs.librelogin.common.web.handler.FrontendHandler;

public class TokenBenchmarkTest {

    @Test
    public void benchmarkAdminProtection() throws Exception {
        BenchmarkPlugin plugin = new BenchmarkPlugin();
        WebSessionManager sessionManager = new WebSessionManager(plugin);
        FrontendHandler handler = new FrontendHandler(FrontendHandler.class, sessionManager);

        long start = System.nanoTime();
        int iterations = 10000; // Small run first
        long totalBytes = 0;

        for (int i = 0; i < iterations; i++) {
            DummyRequest req = new DummyRequest("/admin.html");
            DummyResponse resp = new DummyResponse();
            handler.service(req, resp);
            totalBytes += resp.outputStream.writtenBytes;
        }

        long end = System.nanoTime();
        double ms = (end - start) / 1_000_000.0;

        System.out.println("Benchmark Results:");
        System.out.println("Iterations: " + iterations);
        System.out.println("Total Time: " + ms + " ms");
        System.out.println("Avg Time: " + (ms / iterations) + " ms/op");
        System.out.println("Total Bytes: " + totalBytes);
        System.out.println("Avg Bytes: " + (totalBytes / iterations));
        System.out.println(
                "Estimated Data for 1M requests: "
                        + (totalBytes / iterations) * 1_000_000 / 1024.0 / 1024.0
                        + " MB");
    }

    // --- Stubs ---

    static class BenchmarkPlugin extends AuthenticLibreLogin<Object, Object> {
        @Override
        protected PlatformHandle<Object, Object> providePlatformHandle() {
            return null;
        }

        public CancellableTask repeat(Runnable run, long delay, long period) {
            return null;
        }

        public CancellableTask delay(Runnable run, long delay) {
            return null;
        }

        // Minimal stubs for other abstract methods

        @Override
        public co.aikar.commands.CommandManager provideManager() {
            return null;
        }

        @Override
        protected xyz.kyngs.librelogin.common.image.AuthenticImageProjector<Object, Object>
                provideImageProjector() {
            return null;
        }

        @Override
        protected xyz.kyngs.librelogin.api.Logger provideLogger() {
            return null;
        }

        @Override
        public String getVersion() {
            return "0.0.0";
        }

        @Override
        public User createUser(
                UUID uuid,
                UUID premiumUUID,
                HashedPassword hashedPassword,
                String lastNickname,
                Timestamp joinDate,
                Timestamp lastSeen,
                String secret,
                String ip,
                Timestamp lastAuthentication,
                String lastServer,
                String email) {
            return null;
        }

        @Override
        public boolean pluginPresent(String name) {
            return false;
        }

        @Override
        public boolean isPresent(UUID uuid) {
            return false;
        }

        @Override
        public net.kyori.adventure.audience.Audience getAudienceFromIssuer(
                co.aikar.commands.CommandIssuer issuer) {
            return null;
        }

        @Override
        public Object getPlayerForUUID(UUID uuid) {
            return null;
        }

        @Override
        public java.io.File getDataFolder() {
            return new java.io.File("build/tmp/test");
        }

        @Override
        public Object getPlayerFromIssuer(co.aikar.commands.CommandIssuer issuer) {
            return null;
        }

        @Override
        public void initMetrics(org.bstats.charts.CustomChart... charts) {}

        @Override
        public boolean multiProxyEnabled() {
            return false;
        }

        @Override
        public java.io.InputStream getResourceAsStream(String name) {
            return null;
        }

        @Override
        public void authorize(
                Object player, User user, net.kyori.adventure.audience.Audience audience) {}
    }

    static class DummyRequest implements HttpServletRequest {
        private final String uri;

        public DummyRequest(String uri) {
            this.uri = uri;
        }

        @Override
        public String getRequestURI() {
            return uri;
        }

        @Override
        public String getParameter(String name) {
            return null;
        } // Invalid/No token

        @Override
        public boolean isRequestedSessionIdFromUrl() {
            return false;
        }

        @Override
        public String getAuthType() {
            return null;
        }

        @Override
        public Cookie[] getCookies() {
            return new Cookie[0];
        }

        @Override
        public long getDateHeader(String name) {
            return 0;
        }

        @Override
        public String getHeader(String name) {
            return null;
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            return Collections.emptyEnumeration();
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            return Collections.emptyEnumeration();
        }

        @Override
        public int getIntHeader(String name) {
            return 0;
        }

        @Override
        public String getMethod() {
            return "GET";
        }

        @Override
        public String getPathInfo() {
            return null;
        }

        @Override
        public String getPathTranslated() {
            return null;
        }

        @Override
        public String getContextPath() {
            return "";
        }

        @Override
        public String getQueryString() {
            return null;
        }

        @Override
        public String getRemoteUser() {
            return null;
        }

        @Override
        public boolean isUserInRole(String role) {
            return false;
        }

        @Override
        public Principal getUserPrincipal() {
            return null;
        }

        @Override
        public String getRequestedSessionId() {
            return null;
        }

        @Override
        public StringBuffer getRequestURL() {
            return new StringBuffer("http://localhost");
        }

        @Override
        public String getServletPath() {
            return "";
        }

        @Override
        public HttpSession getSession(boolean create) {
            return null;
        }

        @Override
        public HttpSession getSession() {
            return null;
        }

        @Override
        public String changeSessionId() {
            return null;
        }

        @Override
        public boolean isRequestedSessionIdValid() {
            return false;
        }

        @Override
        public boolean isRequestedSessionIdFromCookie() {
            return false;
        }

        @Override
        public boolean isRequestedSessionIdFromURL() {
            return false;
        }

        @Override
        public boolean authenticate(HttpServletResponse response)
                throws IOException, jakarta.servlet.ServletException {
            return false;
        }

        @Override
        public void login(String username, String password)
                throws jakarta.servlet.ServletException {}

        @Override
        public void logout() throws jakarta.servlet.ServletException {}

        @Override
        public Collection<Part> getParts() throws IOException, jakarta.servlet.ServletException {
            return Collections.emptyList();
        }

        @Override
        public Part getPart(String name) throws IOException, jakarta.servlet.ServletException {
            return null;
        }

        @Override
        public <T extends HttpUpgradeHandler> T upgrade(Class<T> handlerClass)
                throws IOException, jakarta.servlet.ServletException {
            return null;
        }

        @Override
        public Object getAttribute(String name) {
            return null;
        }

        @Override
        public Enumeration<String> getAttributeNames() {
            return Collections.emptyEnumeration();
        }

        @Override
        public String getCharacterEncoding() {
            return "UTF-8";
        }

        @Override
        public void setCharacterEncoding(String env) throws UnsupportedEncodingException {}

        @Override
        public int getContentLength() {
            return 0;
        }

        @Override
        public long getContentLengthLong() {
            return 0;
        }

        @Override
        public String getContentType() {
            return null;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            return null;
        }

        @Override
        public Enumeration<String> getParameterNames() {
            return Collections.emptyEnumeration();
        }

        @Override
        public String[] getParameterValues(String name) {
            return null;
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            return Collections.emptyMap();
        }

        @Override
        public String getProtocol() {
            return "HTTP/1.1";
        }

        @Override
        public String getScheme() {
            return "http";
        }

        @Override
        public String getServerName() {
            return "localhost";
        }

        @Override
        public int getServerPort() {
            return 8080;
        }

        @Override
        public BufferedReader getReader() throws IOException {
            return null;
        }

        @Override
        public String getRemoteAddr() {
            return "127.0.0.1";
        }

        @Override
        public String getRemoteHost() {
            return "localhost";
        }

        @Override
        public void setAttribute(String name, Object o) {}

        @Override
        public void removeAttribute(String name) {}

        @Override
        public Locale getLocale() {
            return Locale.US;
        }

        @Override
        public Enumeration<Locale> getLocales() {
            return Collections.emptyEnumeration();
        }

        @Override
        public boolean isSecure() {
            return false;
        }

        @Override
        public jakarta.servlet.RequestDispatcher getRequestDispatcher(String path) {
            return null;
        }

        @Override
        public String getRealPath(String path) {
            return null;
        }

        @Override
        public int getRemotePort() {
            return 0;
        }

        @Override
        public String getLocalName() {
            return "localhost";
        }

        @Override
        public String getLocalAddr() {
            return "127.0.0.1";
        }

        @Override
        public int getLocalPort() {
            return 8080;
        }

        @Override
        public jakarta.servlet.ServletContext getServletContext() {
            return null;
        }

        @Override
        public jakarta.servlet.AsyncContext startAsync() throws IllegalStateException {
            return null;
        }

        @Override
        public jakarta.servlet.AsyncContext startAsync(
                jakarta.servlet.ServletRequest servletRequest,
                jakarta.servlet.ServletResponse servletResponse)
                throws IllegalStateException {
            return null;
        }

        @Override
        public boolean isAsyncStarted() {
            return false;
        }

        @Override
        public boolean isAsyncSupported() {
            return false;
        }

        @Override
        public jakarta.servlet.AsyncContext getAsyncContext() {
            return null;
        }

        @Override
        public jakarta.servlet.DispatcherType getDispatcherType() {
            return jakarta.servlet.DispatcherType.REQUEST;
        }
    }

    static class DummyResponse implements HttpServletResponse {
        final CounterOutputStream outputStream = new CounterOutputStream();

        @Override
        public ServletOutputStream getOutputStream() throws IOException {
            return outputStream;
        }

        @Override
        public void setContentType(String type) {}

        @Override
        public void setStatus(int sc) {}

        @Override
        public String encodeUrl(String url) {
            return url;
        }

        @Override
        public String encodeRedirectUrl(String url) {
            return url;
        }

        @Override
        public void addCookie(Cookie cookie) {}

        @Override
        public boolean containsHeader(String name) {
            return false;
        }

        @Override
        public String encodeURL(String url) {
            return url;
        }

        @Override
        public String encodeRedirectURL(String url) {
            return url;
        }

        @Override
        public void sendError(int sc, String msg) throws IOException {}

        @Override
        public void sendError(int sc) throws IOException {}

        @Override
        public void sendRedirect(String location) throws IOException {}

        @Override
        public void setDateHeader(String name, long date) {}

        @Override
        public void addDateHeader(String name, long date) {}

        @Override
        public void setHeader(String name, String value) {}

        @Override
        public void addHeader(String name, String value) {}

        @Override
        public void setIntHeader(String name, int value) {}

        @Override
        public void addIntHeader(String name, int value) {}

        @Override
        public void setStatus(int sc, String sm) {}

        @Override
        public int getStatus() {
            return 200;
        }

        @Override
        public String getHeader(String name) {
            return null;
        }

        @Override
        public Collection<String> getHeaders(String name) {
            return Collections.emptyList();
        }

        @Override
        public Collection<String> getHeaderNames() {
            return Collections.emptyList();
        }

        @Override
        public String getCharacterEncoding() {
            return "UTF-8";
        }

        @Override
        public String getContentType() {
            return null;
        }

        @Override
        public PrintWriter getWriter() throws IOException {
            return new PrintWriter(outputStream);
        }

        @Override
        public void setCharacterEncoding(String charset) {}

        @Override
        public void setContentLength(int len) {}

        @Override
        public void setContentLengthLong(long len) {}

        @Override
        public void setBufferSize(int size) {}

        @Override
        public int getBufferSize() {
            return 0;
        }

        @Override
        public void flushBuffer() throws IOException {}

        @Override
        public void resetBuffer() {}

        @Override
        public boolean isCommitted() {
            return false;
        }

        @Override
        public void reset() {}

        @Override
        public void setLocale(Locale loc) {}

        @Override
        public Locale getLocale() {
            return Locale.US;
        }
    }

    static class CounterOutputStream extends ServletOutputStream {
        long writtenBytes = 0;

        @Override
        public boolean isReady() {
            return true;
        }

        @Override
        public void setWriteListener(WriteListener writeListener) {}

        @Override
        public void write(int b) throws IOException {
            writtenBytes++;
        }

        @Override
        public void write(byte[] b, int off, int len) throws IOException {
            writtenBytes += len;
        }
    }
}
