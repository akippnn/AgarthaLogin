package xyz.kyngs.librelogin.common.web.handler;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import xyz.kyngs.librelogin.api.crypto.HashedPassword;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.web.WebSessionManager;

import java.io.IOException;
import java.util.UUID;
import java.util.stream.Collectors;

public class ApiHandler extends HttpServlet {

    private final AuthenticLibreLogin<?, ?> plugin;
    private final WebSessionManager sessionManager;
    private final Gson gson;

    public ApiHandler(AuthenticLibreLogin<?, ?> plugin, WebSessionManager sessionManager, Gson gson) {
        this.plugin = plugin;
        this.sessionManager = sessionManager;
        this.gson = gson;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        resp.setContentType("application/json");

        try {
            if ("/check-token".equals(path)) {
                handleCheckToken(req, resp);
            } else if ("/login".equals(path)) {
                handleLogin(req, resp);
            } else if ("/register".equals(path)) {
                handleRegister(req, resp);
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
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
         String path = req.getPathInfo();
         resp.setContentType("application/json");
         
         if ("/user".equals(path)) {
             handleGetUser(req, resp);
         } else {
             resp.setStatus(404);
         }
    }

    private void handleCheckToken(HttpServletRequest req, HttpServletResponse resp) throws IOException {
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

        if (plugin.getCryptoProvider().verify(password, user.getHashedPassword())) {
            // Success
            sessionManager.invalidateToken(tokenStr);
            String sessionId = sessionManager.createSession(user, false);
            
            // Log them in inside the game
            plugin.getAuthorizationProvider().authorize(user);
            
            JsonObject response = new JsonObject();
            response.addProperty("success", true);
            response.addProperty("sessionId", sessionId);
            resp.getWriter().write(gson.toJson(response));
        } else {
             resp.setStatus(401);
             resp.getWriter().write(gson.toJson(new ErrorResponse("Incorrect password")));
        }
    }

    private void handleRegister(HttpServletRequest req, HttpServletResponse resp) throws IOException {
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
         // If user is technically null in DB (first join), we might need to handle creation. 
         // But usually Auth plugins create a User object on join even if not registered.
         // Let's assume the User object exists but hash is null or we are updating it.
         
         if (user == null) {
              // Should not happen if flow is correct
             resp.setStatus(500);
             resp.getWriter().write(gson.toJson(new ErrorResponse("User state error")));
             return;
         }

        HashedPassword hashed = plugin.getCryptoProvider().hash(password);
        user.setHashedPassword(hashed);
        plugin.getDatabaseProvider().updateUser(user);
        
        sessionManager.invalidateToken(tokenStr);
        String sessionId = sessionManager.createSession(user, false);
        
        plugin.getAuthorizationProvider().authorize(user);

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.addProperty("sessionId", sessionId);
        resp.getWriter().write(gson.toJson(response));
    }
    
    private void handleAdminApply(HttpServletRequest req, HttpServletResponse resp) throws IOException {
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
         String gameCode = sessionManager.registerAdminAction(() -> {
             plugin.getLogger().info("Admin action executed via Web Panel!");
         });
         
         JsonObject response = new JsonObject();
         response.addProperty("success", true);
         response.addProperty("sessionId", sessionId);
         response.addProperty("gameCode", gameCode);
         
         resp.getWriter().write(gson.toJson(response));
    }
    
    private void handleGetUser(HttpServletRequest req, HttpServletResponse resp) throws IOException {
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
