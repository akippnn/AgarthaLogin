/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.authorization;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import net.kyori.adventure.audience.Audience;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.title.Title;
import xyz.kyngs.librelogin.api.authorization.AuthorizationProvider;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.api.event.events.AuthenticatedEvent;
import xyz.kyngs.librelogin.api.totp.TOTPData;
import xyz.kyngs.librelogin.common.AuthenticHandler;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.config.ConfigurationKeys;
import xyz.kyngs.librelogin.common.event.events.AuthenticAuthenticatedEvent;

public class AuthenticAuthorizationProvider<P, S> extends AuthenticHandler<P, S>
        implements AuthorizationProvider<P> {

    private final Map<P, Boolean> unAuthorized;
    private final Map<P, String> awaiting2FA;
    private final Cache<UUID, EmailVerifyData> emailConfirmCache;
    private final Cache<UUID, String> passwordResetCache;

    public AuthenticAuthorizationProvider(AuthenticLibreLogin<P, S> plugin) {
        super(plugin);
        unAuthorized = new ConcurrentHashMap<>();
        awaiting2FA = new ConcurrentHashMap<>();

        var millis =
                plugin.getConfiguration()
                        .get(ConfigurationKeys.MILLISECONDS_TO_REFRESH_NOTIFICATION);

        if (millis > 0) {
            plugin.repeat(this::notifyUnauthorized, 0, millis);
        }

        plugin.repeat(this::broadcastActionbars, 0, 1000);

        emailConfirmCache = Caffeine.newBuilder().expireAfterWrite(10, TimeUnit.MINUTES).build();

        passwordResetCache = Caffeine.newBuilder().expireAfterWrite(10, TimeUnit.MINUTES).build();
    }

    public Cache<UUID, EmailVerifyData> getEmailConfirmCache() {
        return emailConfirmCache;
    }

    public Cache<UUID, String> getPasswordResetCache() {
        return passwordResetCache;
    }

    public AuthenticLibreLogin<P, S> getPlugin() {
        return plugin;
    }

    // Rate limiting: 1 attempt per 5 seconds per player
    private final Cache<P, Long> geyserInviteRateLimit =
            Caffeine.newBuilder().expireAfterWrite(30, TimeUnit.SECONDS).build();
    private final Cache<P, Integer> geyserInviteSpamCounter =
            Caffeine.newBuilder().expireAfterWrite(60, TimeUnit.SECONDS).build();

    private static final int MAX_SPAM_ATTEMPTS = 10;
    private static final long RATE_LIMIT_MS = 5000;

    public void handleGeyserInviteAttempt(P player, String rawMessage) {
        String code = rawMessage.trim();
        if (code.isEmpty()) return;

        var audience = platformHandle.getAudienceForPlayer(player);

        // Rate limit check
        Long lastAttempt = geyserInviteRateLimit.getIfPresent(player);
        if (lastAttempt != null && System.currentTimeMillis() - lastAttempt < RATE_LIMIT_MS) {
            audience.sendMessage(plugin.getMessages().getMessage("error-invite-rate-limit"));
            return;
        }
        geyserInviteRateLimit.put(player, System.currentTimeMillis());

        // Spam counter
        int spamCount = geyserInviteSpamCounter.get(player, k -> 0) + 1;
        geyserInviteSpamCounter.put(player, spamCount);
        if (spamCount > MAX_SPAM_ATTEMPTS) {
            platformHandle.kick(player, plugin.getMessages().getMessage("kick-invite-spam"));
            return;
        }

        // Try to redeem
        var uuid = platformHandle.getUUIDForPlayer(player);
        var user = plugin.getDatabaseProvider().getByUUID(uuid);

        if (user == null || user.getInvitedBy() != null) {
            // Already invited or user doesn't exist — should not happen
            return;
        }

        var dbProvider = plugin.getDatabaseProvider();
        if (!(dbProvider
                instanceof
                xyz.kyngs.librelogin.common.database.provider.LibreLoginSQLDatabaseProvider
                        sqlProvider)) {
            return;
        }

        UUID inviter = sqlProvider.getInviteInviter(code);
        if (inviter == null) {
            audience.sendMessage(plugin.getMessages().getMessage("error-invite-invalid"));
            return;
        }

        if (!sqlProvider.redeemInvite(code, uuid)) {
            audience.sendMessage(plugin.getMessages().getMessage("error-invite-invalid"));
            return;
        }

        // Success!
        user.setInvitedBy(inviter);
        sqlProvider.updateUser(user);
        plugin.invalidateInviteCache(uuid);

        audience.sendMessage(plugin.getMessages().getMessage("info-invite-redeemed"));

        // Authorize the Geyser player (Floodgate auto-login)
        authorize(user, player, AuthenticatedEvent.AuthenticationReason.PREMIUM);
    }

    public void onExit(P player) {
        stopTracking(player);
        awaiting2FA.remove(player);
        emailConfirmCache.invalidate(platformHandle.getUUIDForPlayer(player));
        passwordResetCache.invalidate(platformHandle.getUUIDForPlayer(player));
    }

    @Override
    public boolean isAuthorized(P player) {
        return !unAuthorized.containsKey(player);
    }

    @Override
    public boolean isAwaiting2FA(P player) {
        return awaiting2FA.containsKey(player);
    }

    @Override
    public void authorize(User user, P player, AuthenticatedEvent.AuthenticationReason reason) {
        if (isAuthorized(player)) {
            throw new IllegalStateException("Player is already authorized");
        }

        // CRITICAL: Block authorization if the player still needs an invite
        if (xyz.kyngs.librelogin.common.authorization.InviteGuard.needsInvite(plugin, user)) {
            plugin.getLogger()
                    .warn(
                            "Blocked authorize() for "
                                    + (user != null ? user.getLastNickname() : "unknown user")
                                    + " - invite not yet redeemed.");
            return;
        }

        stopTracking(player);

        user.setLastAuthentication(Timestamp.valueOf(LocalDateTime.now()));
        user.setIp(platformHandle.getIP(player));
        plugin.getDatabaseProvider().updateUser(user);

        var audience = platformHandle.getAudienceForPlayer(player);

        audience.clearTitle();
        audience.sendActionBar(Component.empty());
        plugin.getEventProvider()
                .fire(
                        plugin.getEventTypes().authenticated,
                        new AuthenticAuthenticatedEvent<>(user, player, plugin, reason));
        plugin.authorize(player, user, audience);
    }

    @Override
    public boolean confirmTwoFactorAuth(P player, Integer code, User user) {
        var secret = awaiting2FA.get(player);
        if (plugin.getTOTPProvider().verify(code, secret)) {
            user.setSecret(secret);
            plugin.getDatabaseProvider().updateUser(user);
            return true;
        }
        return false;
    }

    public void startTracking(User user, P player) {
        var audience = platformHandle.getAudienceForPlayer(player);

        unAuthorized.put(player, user.isRegistered());

        plugin.cancelOnExit(
                plugin.delay(
                        () -> {
                            if (!unAuthorized.containsKey(player)) return;
                            sendInfoMessage(user.isRegistered(), player);
                        },
                        250),
                player);

        var limit = plugin.getConfiguration().get(ConfigurationKeys.SECONDS_TO_AUTHORIZE);

        if (limit > 0) {
            plugin.cancelOnExit(
                    plugin.delay(
                            () -> {
                                if (!unAuthorized.containsKey(player)) return;
                                platformHandle.kick(
                                        player, plugin.getMessages().getMessage("kick-time-limit"));
                            },
                            limit * 1000L),
                    player);
        }

        sendInfoMessage(user.isRegistered(), player);
    }

    private void broadcastActionbars() {
        var wrong = new HashSet<P>();
        unAuthorized.forEach(
                (player, registered) -> {
                    var audience = platformHandle.getAudienceForPlayer(player);

                    if (audience == null) {
                        wrong.add(player);
                        return;
                    }

                    sendActionBar(registered, audience);
                });

        wrong.forEach(unAuthorized::remove);
    }

    private void sendActionBar(boolean registered, Audience audience) {
        if (plugin.getConfiguration().get(ConfigurationKeys.USE_ACTION_BAR)) {
            audience.sendActionBar(
                    plugin.getMessages()
                            .getMessage(registered ? "action-bar-login" : "action-bar-register"));
        }
    }

    private void sendInfoMessage(boolean registered, P player) {
        plugin.getLogger()
                .info(
                        "Sending auth message to player: "
                                + platformHandle.getUsernameForPlayer(player));
        var audience = platformHandle.getAudienceForPlayer(player);

        // AgarthaLogin Web Auth Flow
        if (plugin.getWebServer() != null) {
            java.util.UUID uuid = platformHandle.getUUIDForPlayer(player);
            var user = plugin.getDatabaseProvider().getByUUID(uuid);

            boolean needsInvite =
                    xyz.kyngs.librelogin.common.authorization.InviteGuard.needsInvite(plugin, user);

            // Geyser players can't click links — use chat-based invite input
            if (plugin.fromFloodgate(uuid) && needsInvite) {
                sendGeyserInvitePrompt(player);
                return;
            }

            xyz.kyngs.librelogin.common.web.WebSessionManager.TokenType type =
                    !registered || needsInvite
                            ? xyz.kyngs.librelogin.common.web.WebSessionManager.TokenType.REGISTER
                            : xyz.kyngs.librelogin.common.web.WebSessionManager.TokenType.LOGIN;

            String token = plugin.getWebServer().getSessionManager().createToken(uuid, type);
            // I18n: Pass player's locale to the frontend
            java.util.Locale playerLocale = platformHandle.getLocale(player);
            String locale = playerLocale.toLanguageTag();

            String url;
            if (needsInvite) {
                url =
                        plugin.getConfiguration().get(ConfigurationKeys.WEB_PUBLIC_URL)
                                + "/error.html?action=invite&token="
                                + token
                                + "&lang="
                                + locale;
            } else {
                url =
                        plugin.getConfiguration().get(ConfigurationKeys.WEB_PUBLIC_URL)
                                + "?token="
                                + token
                                + "&lang="
                                + locale;
            }

            Component link =
                    Component.text(url)
                            .color(net.kyori.adventure.text.format.NamedTextColor.BLUE)
                            .decorate(net.kyori.adventure.text.format.TextDecoration.UNDERLINED)
                            .clickEvent(net.kyori.adventure.text.event.ClickEvent.openUrl(url));

            // Credits Link
            Component credits =
                    Component.empty()
                            .append(
                                    plugin.getMessages()
                                            .getMessage("This server is powered by", playerLocale)
                                            .color(
                                                    net.kyori.adventure.text.format.NamedTextColor
                                                            .YELLOW))
                            .append(Component.text(" "))
                            .append(
                                    Component.text("AgarthaLogin")
                                            .color(
                                                    net.kyori.adventure.text.format.NamedTextColor
                                                            .GOLD)
                                            .decorate(
                                                    net.kyori.adventure.text.format.TextDecoration
                                                            .UNDERLINED)
                                            .clickEvent(
                                                    net.kyori.adventure.text.event.ClickEvent
                                                            .openUrl(
                                                                    "https://github.com/akippnn/AgarthaLogin/")));

            Component promptMsg =
                    plugin.getMessages()
                            .getMessage("Please authenticate using the link below:", playerLocale)
                            .color(net.kyori.adventure.text.format.NamedTextColor.GRAY);
            if (promptMsg == null) {
                promptMsg =
                        Component.text("Please authenticate using the link below:")
                                .color(net.kyori.adventure.text.format.NamedTextColor.GRAY);
            }

            // Minecraft chat window height is 20 lines
            Component message =
                    Component.text("\n".repeat(13))
                            .append(credits)
                            .append(Component.newline())
                            .append(Component.newline())
                            .append(promptMsg)
                            .append(Component.newline())
                            .append(link)
                            .append(Component.newline())
                            .append(Component.newline())
                            .append(
                                    plugin.getMessages()
                                            .getMessage(
                                                    "Press \"t\" and click the link to open your"
                                                            + " browser.",
                                                    playerLocale)
                                            .color(
                                                    net.kyori.adventure.text.format.NamedTextColor
                                                            .DARK_GRAY))
                            .append(Component.newline());

            audience.sendMessage(message);
            return;
        }

        audience.sendMessage(
                plugin.getMessages().getMessage(registered ? "prompt-login" : "prompt-register"));
        if (!plugin.getConfiguration().get(ConfigurationKeys.USE_TITLES)) return;
        var toRefresh =
                plugin.getConfiguration()
                        .get(ConfigurationKeys.MILLISECONDS_TO_REFRESH_NOTIFICATION);
        // noinspection UnstableApiUsage
        audience.showTitle(
                Title.title(
                        plugin.getMessages()
                                .getMessage(registered ? "title-login" : "title-register"),
                        plugin.getMessages()
                                .getMessage(registered ? "sub-title-login" : "sub-title-register"),
                        Title.Times.of(
                                Duration.ofMillis(0),
                                Duration.ofMillis(toRefresh > 0 ? (long) (toRefresh * 1.1) : 9000),
                                Duration.ofMillis(0))));
    }

    private void sendGeyserInvitePrompt(P player) {
        var audience = platformHandle.getAudienceForPlayer(player);
        java.util.Locale locale = platformHandle.getLocale(player);

        Component message =
                Component.text("\n".repeat(13))
                        .append(
                                plugin.getMessages()
                                        .getMessage("This server is powered by", locale)
                                        .color(
                                                net.kyori.adventure.text.format.NamedTextColor
                                                        .YELLOW))
                        .append(
                                Component.text(" AgarthaLogin")
                                        .color(net.kyori.adventure.text.format.NamedTextColor.GOLD))
                        .append(Component.newline())
                        .append(Component.newline())
                        .append(
                                plugin.getMessages()
                                        .getMessage("prompt-geyser-invite", locale)
                                        .color(net.kyori.adventure.text.format.NamedTextColor.GRAY))
                        .append(Component.newline())
                        .append(Component.newline())
                        .append(
                                plugin.getMessages()
                                        .getMessage("prompt-geyser-invite-hint", locale)
                                        .color(
                                                net.kyori.adventure.text.format.NamedTextColor
                                                        .DARK_GRAY))
                        .append(Component.newline());

        audience.sendMessage(message);
    }

    public void stopTracking(P player) {
        unAuthorized.remove(player);
    }

    /**
     * Unauthorize a player and send them back to limbo. Used when admin unregisters a user who is
     * online.
     */
    public void unauthorize(P player) {
        if (!isAuthorized(player)) {
            return; // Already unauthorized
        }

        var uuid = platformHandle.getUUIDForPlayer(player);
        var user = plugin.getDatabaseProvider().getByUUID(uuid);

        if (user == null) {
            platformHandle.kick(player, plugin.getMessages().getMessage("kick-no-limbo"));
            return;
        }

        // Start tracking as unregistered
        startTracking(user, player);

        // Move to limbo
        var limbo = plugin.getServerHandler().chooseLimboServer(user, player);
        if (limbo != null) {
            platformHandle.movePlayer(player, limbo);
        } else {
            platformHandle.kick(player, plugin.getMessages().getMessage("kick-no-limbo"));
        }
    }

    public void notifyUnauthorized() {
        var wrong = new HashSet<P>();
        unAuthorized.forEach(
                (player, registered) -> {
                    var audience = platformHandle.getAudienceForPlayer(player);

                    if (audience == null) {
                        wrong.add(player);
                        return;
                    }

                    sendInfoMessage(registered, player);
                });

        wrong.forEach(unAuthorized::remove);
    }

    public record EmailVerifyData(String email, String token, UUID uuid) {}

    public void beginTwoFactorAuth(User user, P player, TOTPData data) {
        awaiting2FA.put(player, data.secret());

        var limbo = plugin.getServerHandler().chooseLimboServer(user, player);

        if (limbo == null) {
            platformHandle.kick(player, plugin.getMessages().getMessage("kick-no-limbo"));
            return;
        }

        platformHandle
                .movePlayer(player, limbo)
                .whenComplete(
                        (t, e) -> {
                            if (t != null || e != null) awaiting2FA.remove(player);
                        });
    }
}
