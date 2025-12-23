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
        if (player == null)
            return; // Console?

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

        Component message = Component.text("Click here to access the admin panel.", NamedTextColor.GOLD)
                .clickEvent(ClickEvent.openUrl(url));

        plugin.getPlatformHandle().getAudienceForPlayer(player).sendMessage(message);
    }

    @Subcommand("apply")
    public void onApply(CommandIssuer issuer, String code) {
        P player = plugin.getPlayerFromIssuer(issuer);
        if (player == null)
            return;

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

        Runnable action = plugin.getWebServer().getSessionManager().getAndRemoveAdminAction(code);
        if (action != null) {
            action.run();
            plugin.getPlatformHandle()
                    .getAudienceForPlayer(player)
                    .sendMessage(
                            Component.text("Action executed successfully.", NamedTextColor.GREEN));
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

        net.kyori.adventure.audience.Audience audience = player != null
                ? plugin.getPlatformHandle().getAudienceForPlayer(player)
                : plugin.getAudienceFromIssuer(issuer);

        audience.sendMessage(Component.text("Reloading configuration...", NamedTextColor.YELLOW));

        try {
            plugin.getConfiguration().reload(plugin);
            audience.sendMessage(Component.text("Configuration reloaded.", NamedTextColor.GREEN));
        } catch (Exception e) {
            audience.sendMessage(
                    Component.text("Failed to reload configuration: " + e.getMessage(), NamedTextColor.RED));
            return;
        }

        try {
            plugin.getMessages().reload(plugin);
            plugin.getCommandProvider().injectMessages();
            audience.sendMessage(Component.text("Messages reloaded.", NamedTextColor.GREEN));
        } catch (Exception e) {
            audience.sendMessage(Component.text("Failed to reload messages: " + e.getMessage(), NamedTextColor.RED));
            return;
        }

        // Restart web server with new config
        if (plugin.getWebServer() != null) {
            try {
                plugin.getWebServer().stop();
                int port = plugin.getConfiguration().get(xyz.kyngs.librelogin.common.config.ConfigurationKeys.WEB_PORT);
                plugin.getWebServer().start();
                audience.sendMessage(Component.text("Web server restarted on port " + port, NamedTextColor.GREEN));
            } catch (Exception e) {
                audience.sendMessage(
                        Component.text("Failed to restart web server: " + e.getMessage(), NamedTextColor.RED));
            }
        }

        audience.sendMessage(Component.text("Reload complete!", NamedTextColor.GREEN));
    }
}
