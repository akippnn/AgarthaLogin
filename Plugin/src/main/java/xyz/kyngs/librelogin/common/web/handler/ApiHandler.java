/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.handler;

import static xyz.kyngs.librelogin.common.AuthenticLibreLogin.DATE_TIME_FORMATTER;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.UUID;
import xyz.kyngs.librelogin.api.crypto.HashedPassword;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.api.event.events.AuthenticatedEvent;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.database.AuthenticUser;
import xyz.kyngs.librelogin.common.event.events.AuthenticPasswordChangeEvent;
import xyz.kyngs.librelogin.common.event.events.AuthenticPremiumLoginSwitchEvent;
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
      } else if (path != null && path.startsWith("/admin/")) {
        handleAdminPost(req, resp, path);
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
      if ("/user".equals(path)) {
        handleGetUser(req, resp);
      } else if ("/check-premium".equals(path)) {
        handleCheckPremium(req, resp);
      } else if (path != null && path.startsWith("/admin/")) {
        handleAdminGet(req, resp, path);
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
      if (path != null && path.startsWith("/admin/")) {
        handleAdminDelete(req, resp, path);
      } else {
        resp.setStatus(404);
      }
    } catch (Exception e) {
      e.printStackTrace();
      resp.setStatus(500);
      resp.getWriter().write(gson.toJson(new ErrorResponse("Internal Server Error")));
    }
  }

  // ==================== Admin Session Validation ====================

  private boolean validateAdminSession(HttpServletRequest req, HttpServletResponse resp)
      throws IOException {
    String sessionId = req.getHeader("X-Session-ID");
    if (sessionId == null) {
      resp.setStatus(401);
      resp.getWriter().write(gson.toJson(new ErrorResponse("No session provided")));
      return false;
    }

    WebSessionManager.SessionInfo session = sessionManager.getSession(sessionId);
    if (session == null || !session.isAdmin) {
      resp.setStatus(403);
      resp.getWriter().write(gson.toJson(new ErrorResponse("Admin access required")));
      return false;
    }
    return true;
  }

  // ==================== Admin GET Endpoints ====================

  private void handleAdminGet(HttpServletRequest req, HttpServletResponse resp, String path)
      throws IOException {
    if (!validateAdminSession(req, resp))
      return;

    if ("/admin/users".equals(path)) {
      handleAdminGetUsers(req, resp);
    } else if (path.startsWith("/admin/user/")) {
      String username = path.substring("/admin/user/".length());
      handleAdminGetUserInfo(resp, username);
    } else {
      resp.setStatus(404);
    }
  }

  private void handleAdminGetUsers(HttpServletRequest req, HttpServletResponse resp)
      throws IOException {
    // Pagination params
    String pageStr = req.getParameter("page");
    String limitStr = req.getParameter("limit");
    String search = req.getParameter("search");

    int page = pageStr != null ? Integer.parseInt(pageStr) : 0;
    int limit = limitStr != null ? Math.min(Integer.parseInt(limitStr), 100) : 50;

    Collection<User> allUsers = plugin.getDatabaseProvider().getAllUsers();

    // Filter by search if provided
    var filteredUsers = allUsers.stream();
    if (search != null && !search.isEmpty()) {
      String lowerSearch = search.toLowerCase();
      filteredUsers = filteredUsers.filter(u -> u.getLastNickname().toLowerCase().contains(lowerSearch));
    }

    var userList = filteredUsers.toList();
    int total = userList.size();

    // Paginate
    var pagedUsers = userList.stream()
        .skip((long) page * limit)
        .limit(limit)
        .toList();

    JsonArray usersArray = new JsonArray();
    for (User user : pagedUsers) {
      usersArray.add(userToJson(user, false));
    }

    JsonObject response = new JsonObject();
    response.add("users", usersArray);
    response.addProperty("total", total);
    response.addProperty("page", page);
    response.addProperty("limit", limit);

    resp.getWriter().write(gson.toJson(response));
  }

  private void handleAdminGetUserInfo(HttpServletResponse resp, String username)
      throws IOException {
    User user = plugin.getDatabaseProvider().getByName(username);
    if (user == null) {
      resp.setStatus(404);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
      return;
    }

    JsonObject userJson = userToJson(user, true);

    // Get alts by IP
    if (user.getIp() != null) {
      Collection<User> alts = plugin.getDatabaseProvider().getByIP(user.getIp());
      JsonArray altsArray = new JsonArray();
      for (User alt : alts) {
        if (!alt.getUuid().equals(user.getUuid())) {
          JsonObject altJson = new JsonObject();
          altJson.addProperty("username", alt.getLastNickname());
          altJson.addProperty("uuid", alt.getUuid().toString());
          if (alt.getLastSeen() != null) {
            altJson.addProperty("lastSeen",
                DATE_TIME_FORMATTER.format(alt.getLastSeen().toLocalDateTime()));
          }
          altsArray.add(altJson);
        }
      }
      userJson.add("alts", altsArray);
    }

    // Check if online
    Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
    userJson.addProperty("online", player != null);
    if (player != null) {
      boolean authorized = ((AuthenticLibreLogin<Object, Object>) plugin)
          .getAuthorizationProvider().isAuthorized(player);
      userJson.addProperty("authorized", authorized);
    }

    resp.getWriter().write(gson.toJson(userJson));
  }

  private JsonObject userToJson(User user, boolean detailed) {
    JsonObject json = new JsonObject();
    json.addProperty("username", user.getLastNickname());
    json.addProperty("uuid", user.getUuid().toString());
    json.addProperty("premium", user.getPremiumUUID() != null);
    json.addProperty("registered", user.getHashedPassword() != null);
    json.addProperty("has2fa", user.getSecret() != null);

    if (detailed) {
      json.addProperty("premiumUuid",
          user.getPremiumUUID() != null ? user.getPremiumUUID().toString() : null);
      json.addProperty("email", user.getEmail());
      json.addProperty("ip", user.getIp());
      json.addProperty("lastServer", user.getLastServer());
      if (user.getHashedPassword() != null) {
        json.addProperty("hashAlgo", user.getHashedPassword().algo());
      }
      if (user.getJoinDate() != null) {
        json.addProperty("joinDate",
            DATE_TIME_FORMATTER.format(user.getJoinDate().toLocalDateTime()));
      }
      if (user.getLastSeen() != null) {
        json.addProperty("lastSeen",
            DATE_TIME_FORMATTER.format(user.getLastSeen().toLocalDateTime()));
      }
      if (user.getLastAuthentication() != null) {
        json.addProperty("lastAuthentication",
            DATE_TIME_FORMATTER.format(user.getLastAuthentication().toLocalDateTime()));
      }
    }

    return json;
  }

  // ==================== Admin POST Endpoints ====================

  private void handleAdminPost(HttpServletRequest req, HttpServletResponse resp, String path)
      throws IOException {
    if (!validateAdminSession(req, resp))
      return;

    JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);

    switch (path) {
      case "/admin/user/login" -> handleAdminUserLogin(resp, body);
      case "/admin/user/premium" -> handleAdminUserPremium(resp, body);
      case "/admin/user/cracked" -> handleAdminUserCracked(resp, body);
      case "/admin/user/password" -> handleAdminUserPassword(resp, body);
      case "/admin/user/migrate" -> handleAdminUserMigrate(resp, body);
      case "/admin/user/register" -> handleAdminUserRegister(resp, body);
      case "/admin/user/unregister" -> handleAdminUserUnregister(resp, body);
      case "/admin/users/bulk" -> handleAdminBulkAction(resp, body);
      case "/admin/database/optimize" -> handleAdminDatabaseOptimize(resp);
      default -> resp.setStatus(404);
    }
  }

  private void handleAdminUserLogin(HttpServletResponse resp, JsonObject body)
      throws IOException {
    String username = body.get("username").getAsString();
    User user = plugin.getDatabaseProvider().getByName(username);

    if (user == null) {
      resp.setStatus(404);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
      return;
    }

    if (user.getHashedPassword() == null) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User not registered")));
      return;
    }

    Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
    if (player == null) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User not online")));
      return;
    }

    AuthenticLibreLogin<Object, Object> rawPlugin = (AuthenticLibreLogin<Object, Object>) plugin;
    if (rawPlugin.getAuthorizationProvider().isAuthorized(player)) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User already authorized")));
      return;
    }

    rawPlugin.getAuthorizationProvider()
        .authorize(user, player, AuthenticatedEvent.AuthenticationReason.LOGIN);

    JsonObject response = new JsonObject();
    response.addProperty("success", true);
    resp.getWriter().write(gson.toJson(response));
  }

  private void handleAdminUserPremium(HttpServletResponse resp, JsonObject body)
      throws IOException {
    String username = body.get("username").getAsString();
    User user = plugin.getDatabaseProvider().getByName(username);

    if (user == null) {
      resp.setStatus(404);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
      return;
    }

    // Try to get premium UUID from Mojang
    try {
      var premiumUser = plugin.getPremiumProvider().getUserForName(username);
      if (premiumUser == null || !premiumUser.name().equals(username)) {
        resp.setStatus(400);
        resp.getWriter().write(gson.toJson(new ErrorResponse(
            "Username not found in Mojang database or case mismatch")));
        return;
      }

      user.setPremiumUUID(premiumUser.uuid());
      // Remove password hash for premium users - they authenticate via Mojang
      user.setHashedPassword(null);
      user.setSecret(null);
      plugin.getDatabaseProvider().updateUser(user);

      plugin.getEventProvider().unsafeFire(
          plugin.getEventTypes().premiumLoginSwitch,
          new AuthenticPremiumLoginSwitchEvent<>(user, null, plugin));

      // Notify player if online
      AuthenticLibreLogin<Object, Object> rawPlugin = (AuthenticLibreLogin<Object, Object>) plugin;
      Object player = rawPlugin.getPlatformHandle().getPlayer(user.getUuid());
      if (player != null) {
        rawPlugin.getPlatformHandle().kick(player,
            rawPlugin.getMessages().getMessage("kick-premium-info-enabled"));
      }

      JsonObject response = new JsonObject();
      response.addProperty("success", true);
      resp.getWriter().write(gson.toJson(response));

    } catch (Exception e) {
      resp.setStatus(500);
      resp.getWriter().write(gson.toJson(new ErrorResponse("Failed to verify premium: " + e.getMessage())));
    }
  }

  private void handleAdminUserCracked(HttpServletResponse resp, JsonObject body)
      throws IOException {
    String username = body.get("username").getAsString();
    User user = plugin.getDatabaseProvider().getByName(username);

    if (user == null) {
      resp.setStatus(404);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
      return;
    }

    // Cracked users need a password to authenticate
    if (user.getHashedPassword() == null) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse(
          "User must have a password set before switching to cracked mode. " +
              "Use the password change feature first.")));
      return;
    }

    user.setPremiumUUID(null);
    plugin.getDatabaseProvider().updateUser(user);

    // Notify player if online
    AuthenticLibreLogin<Object, Object> rawPlugin = (AuthenticLibreLogin<Object, Object>) plugin;
    Object player = rawPlugin.getPlatformHandle().getPlayer(user.getUuid());
    if (player != null) {
      rawPlugin.getPlatformHandle().kick(player,
          rawPlugin.getMessages().getMessage("kick-premium-info-disabled"));
    }

    JsonObject response = new JsonObject();
    response.addProperty("success", true);
    resp.getWriter().write(gson.toJson(response));
  }

  private void handleAdminUserPassword(HttpServletResponse resp, JsonObject body)
      throws IOException {
    String username = body.get("username").getAsString();
    String newPassword = body.get("password").getAsString();

    User user = plugin.getDatabaseProvider().getByName(username);
    if (user == null) {
      resp.setStatus(404);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
      return;
    }

    HashedPassword old = user.getHashedPassword();
    HashedPassword hashed = plugin.getDefaultCryptoProvider().createHash(newPassword);
    if (hashed == null) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse("Password too long")));
      return;
    }

    user.setHashedPassword(hashed);
    plugin.getDatabaseProvider().updateUser(user);

    plugin.getEventProvider().unsafeFire(
        plugin.getEventTypes().passwordChange,
        new AuthenticPasswordChangeEvent<>(user, null, plugin, old));

    // Notify player if online
    AuthenticLibreLogin<Object, Object> rawPlugin = (AuthenticLibreLogin<Object, Object>) plugin;
    Object player = rawPlugin.getPlatformHandle().getPlayer(user.getUuid());
    if (player != null) {
      rawPlugin.getPlatformHandle().getAudienceForPlayer(player)
          .sendMessage(rawPlugin.getMessages().getMessage("info-password-changed"));
    }

    JsonObject response = new JsonObject();
    response.addProperty("success", true);
    resp.getWriter().write(gson.toJson(response));
  }

  private void handleAdminUserMigrate(HttpServletResponse resp, JsonObject body)
      throws IOException {
    String username = body.get("username").getAsString();
    String newUsername = body.get("newUsername").getAsString();

    User user = plugin.getDatabaseProvider().getByName(username);
    if (user == null) {
      resp.setStatus(404);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
      return;
    }

    User colliding = plugin.getDatabaseProvider().getByName(newUsername);
    if (colliding != null && !colliding.getUuid().equals(user.getUuid())) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse("New username already taken")));
      return;
    }

    // Check if online
    Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
    if (player != null) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User must be offline")));
      return;
    }

    user.setLastNickname(newUsername);
    if (user.getPremiumUUID() != null) {
      user.setPremiumUUID(null);
      plugin.getEventProvider().unsafeFire(
          plugin.getEventTypes().premiumLoginSwitch,
          new AuthenticPremiumLoginSwitchEvent<>(user, null, plugin));
    }
    plugin.getDatabaseProvider().updateUser(user);

    JsonObject response = new JsonObject();
    response.addProperty("success", true);
    resp.getWriter().write(gson.toJson(response));
  }

  private void handleAdminUserRegister(HttpServletResponse resp, JsonObject body)
      throws IOException {
    String username = body.get("username").getAsString();
    String password = body.get("password").getAsString();

    User existing = plugin.getDatabaseProvider().getByName(username);
    if (existing != null) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse("Username already exists")));
      return;
    }

    HashedPassword hashed = plugin.getDefaultCryptoProvider().createHash(password);
    if (hashed == null) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse("Password too long")));
      return;
    }

    UUID premiumUuid = null;
    try {
      var premiumUser = plugin.getPremiumProvider().getUserForName(username);
      if (premiumUser != null) {
        premiumUuid = premiumUser.uuid();
      }
    } catch (Exception ignored) {
    }

    User user = new AuthenticUser(
        plugin.generateNewUUID(username, premiumUuid),
        null,
        hashed,
        username,
        Timestamp.valueOf(LocalDateTime.now()),
        Timestamp.valueOf(LocalDateTime.now()),
        null,
        null,
        Timestamp.valueOf(LocalDateTime.now()),
        null,
        null);

    plugin.getDatabaseProvider().insertUser(user);

    JsonObject response = new JsonObject();
    response.addProperty("success", true);
    response.addProperty("uuid", user.getUuid().toString());
    resp.getWriter().write(gson.toJson(response));
  }

  private void handleAdminUserUnregister(HttpServletResponse resp, JsonObject body)
      throws IOException {
    String username = body.get("username").getAsString();

    User user = plugin.getDatabaseProvider().getByName(username);
    if (user == null) {
      resp.setStatus(404);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
      return;
    }

    // Require user to be online so they can re-register via web-auth
    AuthenticLibreLogin<Object, Object> rawPlugin = (AuthenticLibreLogin<Object, Object>) plugin;
    Object player = rawPlugin.getPlatformHandle().getPlayer(user.getUuid());
    if (player == null) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse(
          "User must be online to unregister. They need to re-register via web-auth.")));
      return;
    }

    // Send back to limbo for re-registration
    rawPlugin.getAuthorizationProvider().unauthorize(player);

    // Reset auth data but keep user record
    user.setHashedPassword(null);
    user.setSecret(null);
    user.setIp(null);
    user.setLastAuthentication(null);
    user.setPremiumUUID(null);
    plugin.getDatabaseProvider().updateUser(user);

    JsonObject response = new JsonObject();
    response.addProperty("success", true);
    resp.getWriter().write(gson.toJson(response));
  }

  private void handleAdminBulkAction(HttpServletResponse resp, JsonObject body)
      throws IOException {
    String action = body.get("action").getAsString();
    JsonArray usernames = body.getAsJsonArray("usernames");

    int success = 0;
    int failed = 0;

    for (var elem : usernames) {
      String username = elem.getAsString();
      User user = plugin.getDatabaseProvider().getByName(username);
      if (user == null) {
        failed++;
        continue;
      }

      try {
        switch (action) {
          case "premium" -> {
            var premiumUser = plugin.getPremiumProvider().getUserForName(username);
            if (premiumUser != null && premiumUser.name().equals(username)) {
              user.setPremiumUUID(premiumUser.uuid());
              plugin.getDatabaseProvider().updateUser(user);
              success++;
            } else {
              failed++;
            }
          }
          case "cracked" -> {
            user.setPremiumUUID(null);
            plugin.getDatabaseProvider().updateUser(user);
            success++;
          }
          case "unregister" -> {
            Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
            if (player != null) {
              AuthenticLibreLogin<Object, Object> rawPlugin = (AuthenticLibreLogin<Object, Object>) plugin;
              rawPlugin.getAuthorizationProvider().unauthorize(player);
            }
            user.setHashedPassword(null);
            user.setSecret(null);
            user.setIp(null);
            user.setLastAuthentication(null);
            user.setPremiumUUID(null);
            plugin.getDatabaseProvider().updateUser(user);
            success++;
          }
          case "delete" -> {
            Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
            if (player != null) {
              failed++;
            } else {
              plugin.getDatabaseProvider().deleteUser(user);
              success++;
            }
          }
          default -> failed++;
        }
      } catch (Exception e) {
        failed++;
      }
    }

    JsonObject response = new JsonObject();
    response.addProperty("success", failed == 0);
    response.addProperty("processed", success);
    response.addProperty("failed", failed);
    resp.getWriter().write(gson.toJson(response));
  }

  private void handleAdminDatabaseOptimize(HttpServletResponse resp) throws IOException {
    String preferredAlgo = plugin.getDefaultCryptoProvider().getIdentifier();
    int converted = 0;
    int failed = 0;

    Collection<User> allUsers = plugin.getDatabaseProvider().getAllUsers();
    for (User user : allUsers) {
      HashedPassword current = user.getHashedPassword();
      if (current == null)
        continue;
      if (preferredAlgo.equals(current.algo()))
        continue;

      // We cannot re-hash without the original password
      // This endpoint is for informational purposes - actual conversion
      // happens on next login
      failed++;
    }

    JsonObject response = new JsonObject();
    response.addProperty("success", true);
    response.addProperty("preferredAlgo", preferredAlgo);
    response.addProperty("usersNeedingConversion", failed);
    response.addProperty("message",
        "Hash conversion happens automatically on next login. " +
            failed + " users still use legacy algorithms.");
    resp.getWriter().write(gson.toJson(response));
  }

  // ==================== Admin DELETE Endpoints ====================

  private void handleAdminDelete(HttpServletRequest req, HttpServletResponse resp, String path)
      throws IOException {
    if (!validateAdminSession(req, resp))
      return;

    if (path.startsWith("/admin/user/")) {
      String username = path.substring("/admin/user/".length());
      handleAdminDeleteUser(resp, username);
    } else {
      resp.setStatus(404);
    }
  }

  private void handleAdminDeleteUser(HttpServletResponse resp, String username)
      throws IOException {
    User user = plugin.getDatabaseProvider().getByName(username);
    if (user == null) {
      resp.setStatus(404);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User not found")));
      return;
    }

    Object player = plugin.getPlatformHandle().getPlayer(user.getUuid());
    if (player != null) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse("Cannot delete online user")));
      return;
    }

    plugin.getDatabaseProvider().deleteUser(user);

    JsonObject response = new JsonObject();
    response.addProperty("success", true);
    resp.getWriter().write(gson.toJson(response));
  }

  // ==================== Original Endpoints ====================

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

    // Check if user is registered (has password)
    if (user.getHashedPassword() == null) {
      resp.setStatus(400);
      resp.getWriter().write(gson.toJson(new ErrorResponse("User is not registered. Please register first.")));
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
                xyz.kyngs.librelogin.api.event.events.AuthenticatedEvent.AuthenticationReason.LOGIN);
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
        var premiumUser = plugin.getPremiumProvider().getUserForName(user.getLastNickname());
        if (premiumUser == null || !premiumUser.name().equals(user.getLastNickname())) {
          resp.setStatus(400);
          resp.getWriter().write(gson.toJson(new ErrorResponse(
              "Username not found in Mojang or case mismatch. Cannot register as premium.")));
          return;
        }
        // Set premium UUID - no password needed
        user.setPremiumUUID(premiumUser.uuid());
        user.setHashedPassword(null);
      } catch (Exception e) {
        resp.setStatus(500);
        resp.getWriter().write(gson.toJson(new ErrorResponse("Failed to verify premium: " + e.getMessage())));
        return;
      }
    } else {
      // Normal cracked registration with password
      xyz.kyngs.librelogin.api.crypto.HashedPassword hashed = plugin.getDefaultCryptoProvider().createHash(password);
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
              xyz.kyngs.librelogin.api.event.events.AuthenticatedEvent.AuthenticationReason.REGISTER);
    }

    JsonObject response = new JsonObject();
    response.addProperty("success", true);
    response.addProperty("sessionId", sessionId);
    response.addProperty("isPremium", asPremium);
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

    // Use a local variable with a raw type cast for the plugin to satisfy generic
    // method call
    AuthenticLibreLogin<Object, Object> rawPlugin = (AuthenticLibreLogin<Object, Object>) plugin;

    Object player = rawPlugin.getPlatformHandle().getPlayer(info.playerUuid);
    if (player != null) {
      if (!rawPlugin.getAuthorizationProvider().isAuthorized(player)) {
        rawPlugin
            .getAuthorizationProvider()
            .authorize(
                session.user,
                player,
                xyz.kyngs.librelogin.api.event.events.AuthenticatedEvent.AuthenticationReason.LOGIN);
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
    String gameCode = sessionManager.registerAdminAction(
        () -> {
          plugin.getLogger().info("Admin action executed via Web Panel!");
        });

    JsonObject response = new JsonObject();
    response.addProperty("success", true);
    response.addProperty("sessionId", sessionId);
    response.addProperty("gameCode", gameCode);

    resp.getWriter().write(gson.toJson(response));
  }

  private void handleCheckPremium(HttpServletRequest req, HttpServletResponse resp)
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

  record ErrorResponse(String error) {
  }
}
