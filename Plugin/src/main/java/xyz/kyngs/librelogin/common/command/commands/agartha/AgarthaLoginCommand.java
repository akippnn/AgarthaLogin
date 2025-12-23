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

        Component message =
                Component.text("Click here to access the admin panel.", NamedTextColor.GOLD)
                        .clickEvent(ClickEvent.openUrl(url));

        plugin.getPlatformHandle().getAudienceForPlayer(player).sendMessage(message);
    }

    @Subcommand("apply")
    public void onApply(CommandIssuer issuer, String code) {
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
}
