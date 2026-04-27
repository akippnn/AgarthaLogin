/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.command.commands.agartha;

import static xyz.kyngs.librelogin.common.config.ConfigurationKeys.ADMIN_LIST;
import static xyz.kyngs.librelogin.common.config.ConfigurationKeys.WEB_PUBLIC_URL;

import co.aikar.commands.CommandIssuer;
import co.aikar.commands.annotation.CommandAlias;
import co.aikar.commands.annotation.Subcommand;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.command.Command;

@CommandAlias("agarthalogin")
public class AgarthaLoginCommand<P> extends Command<P> {

    public AgarthaLoginCommand(AuthenticLibreLogin<P, ?> plugin) {
        super(plugin);
    }

    @Subcommand("adminpanel")
    public void onAdminPanel(CommandIssuer issuer) {
        P player = plugin.getPlayerFromIssuer(issuer);
        if (player == null) return; // Console?

        String username = plugin.getPlatformHandle().getUsernameForPlayer(player);
        if (!plugin.getConfiguration().get(ADMIN_LIST).contains(username)) {
            plugin.getPlatformHandle()
                    .getAudienceForPlayer(player)
                    .sendMessage(
                            Component.text(
                                    "You are not authorized to use this command.",
                                    NamedTextColor.RED));
            return;
        }

        String token = plugin.getWebServer().getSessionManager().createAdminToken();
        String url = plugin.getConfiguration().get(WEB_PUBLIC_URL) + "?token=" + token;

        java.util.Locale locale = plugin.getPlatformHandle().getLocale(player);
        Component message =
                plugin.getMessages()
                        .getMessage("Click here to access the admin panel.", locale)
                        .clickEvent(ClickEvent.openUrl(url));

        plugin.getPlatformHandle().getAudienceForPlayer(player).sendMessage(message);
    }

    private final com.github.benmanes.caffeine.cache.Cache<java.util.UUID, String> confirmCache =
            com.github.benmanes.caffeine.cache.Caffeine.newBuilder()
                    .expireAfterWrite(15, java.util.concurrent.TimeUnit.SECONDS)
                    .build();

    @Subcommand("invite")
    public void onInvite(CommandIssuer issuer) {
        P player = plugin.getPlayerFromIssuer(issuer);
        if (player == null) return;

        java.util.UUID uuid = plugin.getPlatformHandle().getUUIDForPlayer(player);
        xyz.kyngs.librelogin.api.database.User user = plugin.getDatabaseProvider().getByUUID(uuid);

        if (user == null) return;

        if (!plugin.getConfiguration().get(xyz.kyngs.librelogin.common.config.ConfigurationKeys.INVITES_ENABLED)) {
            plugin.getPlatformHandle().getAudienceForPlayer(player).sendMessage(
                    Component.text("Invite system is not enabled.", NamedTextColor.RED));
            return;
        }

        var provider = plugin.getDatabaseProvider();
        if (provider instanceof xyz.kyngs.librelogin.common.database.provider.LibreLoginSQLDatabaseProvider sqlProvider) {
            int max = plugin.getConfiguration().get(xyz.kyngs.librelogin.common.config.ConfigurationKeys.INVITES_MAX_ACTIVE_PER_USER);
            int active = sqlProvider.countActiveInvites(uuid);

            if (active >= max) {
                plugin.getPlatformHandle().getAudienceForPlayer(player).sendMessage(
                        plugin.getMessages().getMessage("error-invite-limit-reached"));
                return;
            }

            int length = plugin.getConfiguration().get(xyz.kyngs.librelogin.common.config.ConfigurationKeys.INVITES_CODE_LENGTH);
            String code = xyz.kyngs.librelogin.common.util.GeneralUtil.generateRandomString(length);

            int expiryHours = plugin.getConfiguration().get(xyz.kyngs.librelogin.common.config.ConfigurationKeys.INVITES_EXPIRY_HOURS);
            java.sql.Timestamp expiry = new java.sql.Timestamp(System.currentTimeMillis() + java.time.Duration.ofHours(expiryHours).toMillis());

            sqlProvider.createInvite(code, uuid, expiry);

            plugin.getPlatformHandle().getAudienceForPlayer(player).sendMessage(
                    plugin.getMessages().getMessage("info-invite-created", "%code%", code));
        } else {
            plugin.getPlatformHandle().getAudienceForPlayer(player).sendMessage(
                    Component.text("Unsupported database provider.", NamedTextColor.RED));
        }
    }

    @Subcommand("verify")
    public void onVerify(CommandIssuer issuer, String code) {
        P player = plugin.getPlayerFromIssuer(issuer);
        if (player == null) return;

        String username = plugin.getPlatformHandle().getUsernameForPlayer(player);
        if (!plugin.getConfiguration().get(ADMIN_LIST).contains(username)) {
            plugin.getPlatformHandle()
                    .getAudienceForPlayer(player)
                    .sendMessage(
                            Component.text(
                                    "You are not authorized to use this command.",
                                    NamedTextColor.RED));
            return;
        }

        java.util.UUID uuid = plugin.getPlatformHandle().getUUIDForPlayer(player);
        String pendingCode = confirmCache.getIfPresent(uuid);

        if (pendingCode == null || !pendingCode.equals(code)) {
            confirmCache.put(uuid, code);
            plugin.getPlatformHandle()
                    .getAudienceForPlayer(player)
                    .sendMessage(
                            Component.text(
                                            "WARNING: You are about to authorize an Admin Session"
                                                    + " via the Web Panel.",
                                            NamedTextColor.RED)
                                    .append(Component.newline())
                                    .append(
                                            Component.text(
                                                    "Please run the command again to confirm.",
                                                    NamedTextColor.YELLOW)));
            return;
        }

        // Confirmed
        Runnable action = plugin.getWebServer().getSessionManager().getAndRemoveAdminAction(code);
        if (action != null) {
            confirmCache.invalidate(uuid);
            action.run();
            // I18n: Use locale
            java.util.Locale locale = plugin.getPlatformHandle().getLocale(player);
            plugin.getPlatformHandle()
                    .getAudienceForPlayer(player)
                    .sendMessage(
                            plugin.getMessages()
                                    .getMessage(
                                            "Authenticated successfully, proceed to the Admin"
                                                    + " panel.",
                                            locale));
        } else {
            plugin.getPlatformHandle()
                    .getAudienceForPlayer(player)
                    .sendMessage(Component.text("Invalid or expired code.", NamedTextColor.RED));
        }
    }

    @Subcommand("reload")
    public void onReload(CommandIssuer issuer) {
        P player = plugin.getPlayerFromIssuer(issuer);

        // Allow console or admins in list
        if (player != null) {
            String username = plugin.getPlatformHandle().getUsernameForPlayer(player);
            if (!plugin.getConfiguration().get(ADMIN_LIST).contains(username)) {
                plugin.getPlatformHandle()
                        .getAudienceForPlayer(player)
                        .sendMessage(
                                Component.text(
                                        "You are not authorized to use this command.",
                                        NamedTextColor.RED));
                return;
            }
        }

        net.kyori.adventure.audience.Audience audience =
                player != null
                        ? plugin.getPlatformHandle().getAudienceForPlayer(player)
                        : plugin.getAudienceFromIssuer(issuer);

        java.util.Locale locale =
                player != null ? plugin.getPlatformHandle().getLocale(player) : java.util.Locale.US;

        audience.sendMessage(plugin.getMessages().getMessage("Reloading configuration...", locale));

        try {
            plugin.getConfiguration().reload(plugin);
            audience.sendMessage(Component.text("Configuration reloaded.", NamedTextColor.GREEN));
        } catch (Exception e) {
            audience.sendMessage(
                    Component.text(
                            "Failed to reload configuration: " + e.getMessage(),
                            NamedTextColor.RED));
            return;
        }

        try {
            plugin.getMessages().reload(plugin);
            plugin.getCommandProvider().injectMessages();
            audience.sendMessage(Component.text("Messages reloaded.", NamedTextColor.GREEN));
        } catch (Exception e) {
            audience.sendMessage(
                    Component.text(
                            "Failed to reload messages: " + e.getMessage(), NamedTextColor.RED));
            return;
        }

        // Restart web server with new config
        if (plugin.getWebServer() != null) {
            try {
                plugin.getWebServer().stop();
                int port =
                        plugin.getConfiguration()
                                .get(xyz.kyngs.librelogin.common.config.ConfigurationKeys.WEB_PORT);
                plugin.getWebServer().start();
                audience.sendMessage(
                        plugin.getMessages()
                                .getMessage("Web server restarted on port ", locale)
                                .append(Component.text(port)));
            } catch (Exception e) {
                audience.sendMessage(
                        Component.text(
                                "Failed to restart web server: " + e.getMessage(),
                                NamedTextColor.RED));
            }
        }

        audience.sendMessage(Component.text("Reload complete!", NamedTextColor.GREEN));
    }
}
