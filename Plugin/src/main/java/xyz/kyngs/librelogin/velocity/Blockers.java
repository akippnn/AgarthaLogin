/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.velocity;

import com.velocitypowered.api.event.PostOrder;
import com.velocitypowered.api.event.Subscribe;
import com.velocitypowered.api.event.command.CommandExecuteEvent;
import com.velocitypowered.api.event.player.KickedFromServerEvent;
import com.velocitypowered.api.event.player.PlayerChatEvent;
import com.velocitypowered.api.event.player.ServerPreConnectEvent;
import com.velocitypowered.api.proxy.Player;
import net.kyori.adventure.text.Component;
import xyz.kyngs.librelogin.api.authorization.AuthorizationProvider;
import xyz.kyngs.librelogin.api.configuration.Messages;
import xyz.kyngs.librelogin.common.config.ConfigurationKeys;
import xyz.kyngs.librelogin.common.config.HoconPluginConfiguration;

public class Blockers {

    private final AuthorizationProvider<Player> authorizationProvider;
    private final HoconPluginConfiguration configuration;

    public Blockers(
            AuthorizationProvider<Player> authorizationProvider,
            HoconPluginConfiguration configuration,
            Messages messages) {
        this.authorizationProvider = authorizationProvider;
        this.configuration = configuration;
    }

    @Subscribe(order = PostOrder.FIRST)
    public void onChat(PlayerChatEvent event) {
        var player = event.getPlayer();
        if (!authorizationProvider.isAuthorized(player)
                || authorizationProvider.isAwaiting2FA(player)) {
            // Check if Geyser player needing invite
            if (((xyz.kyngs.librelogin.common.authorization.AuthenticAuthorizationProvider<
                                            Player, ?>)
                                    authorizationProvider)
                            .getPlugin()
                            .fromFloodgate(player.getUniqueId())
                    && xyz.kyngs.librelogin.common.authorization.InviteGuard.needsInvite(
                            ((xyz.kyngs.librelogin.common.authorization
                                                            .AuthenticAuthorizationProvider<
                                                    Player, ?>)
                                            authorizationProvider)
                                    .getPlugin(),
                            ((xyz.kyngs.librelogin.common.authorization
                                                            .AuthenticAuthorizationProvider<
                                                    Player, ?>)
                                            authorizationProvider)
                                    .getPlugin()
                                    .getDatabaseProvider()
                                    .getByUUID(player.getUniqueId()))) {
                event.setResult(PlayerChatEvent.ChatResult.denied());
                ((xyz.kyngs.librelogin.common.authorization.AuthenticAuthorizationProvider<
                                        Player, ?>)
                                authorizationProvider)
                        .handleGeyserInviteAttempt(player, event.getMessage());
                return;
            }
            event.setResult(PlayerChatEvent.ChatResult.denied());
        }
    }

    @Subscribe(order = PostOrder.FIRST)
    public void onCommand(CommandExecuteEvent event) {
        if (!(event.getCommandSource() instanceof Player player)) return;
        if (authorizationProvider.isAuthorized(player)
                && !authorizationProvider.isAwaiting2FA(player)) return;

        var command = event.getCommand().split(" ")[0];

        for (String allowed :
                configuration.get(ConfigurationKeys.ALLOWED_COMMANDS_WHILE_UNAUTHORIZED)) {
            if (command.equals(allowed)) return;
        }

        event.setResult(CommandExecuteEvent.CommandResult.denied());
    }

    @Subscribe(order = PostOrder.FIRST)
    public void onServerConnect(ServerPreConnectEvent event) {
        var player = event.getPlayer();
        if (!authorizationProvider.isAuthorized(player)
                || authorizationProvider.isAwaiting2FA(player)) {
            String targetName = event.getOriginalServer().getServerInfo().getName();
            if (!configuration.get(ConfigurationKeys.LIMBO).contains(targetName)) {
                event.setResult(ServerPreConnectEvent.ServerResult.denied());
            }
        }
    }

    @Subscribe(order = PostOrder.FIRST)
    public void onServerKick(KickedFromServerEvent event) {
        if (!authorizationProvider.isAuthorized(event.getPlayer())
                || authorizationProvider.isAwaiting2FA(event.getPlayer())) {
            event.getPlayer()
                    .disconnect(
                            event.getServerKickReason()
                                    .orElse(Component.text("Limbo not running")));
        }
    }
}
