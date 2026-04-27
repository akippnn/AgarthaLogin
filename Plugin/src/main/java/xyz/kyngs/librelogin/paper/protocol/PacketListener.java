/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.paper.protocol;

import com.github.retrooper.packetevents.event.PacketListenerAbstract;
import com.github.retrooper.packetevents.event.PacketListenerPriority;
import com.github.retrooper.packetevents.event.PacketReceiveEvent;
import com.github.retrooper.packetevents.protocol.packettype.PacketType;
import xyz.kyngs.librelogin.paper.PaperListeners;

import xyz.kyngs.librelogin.common.config.ConfigurationKeys;
import xyz.kyngs.librelogin.paper.PaperLibreLogin;

public class PacketListener extends PacketListenerAbstract {
    private final PaperLibreLogin plugin;
    private final PaperListeners delegate;

    public PacketListener(PaperLibreLogin plugin, PaperListeners delegate) {
        super(PacketListenerPriority.HIGHEST);
        this.plugin = plugin;
        this.delegate = delegate;
    }

    @Override
    public void onPacketReceive(PacketReceiveEvent event) {
        if (event.isCancelled()) return;

        if (event.getPacketType().name().startsWith("PLAY_")) {
            var pUser = event.getUser();
            if (pUser != null && pUser.getUUID() != null) {
                if (plugin.getConfiguration().get(ConfigurationKeys.INVITES_ENABLED)) {
                    var user = plugin.getDatabaseProvider().getByUUID(pUser.getUUID());
                    if (user != null && user.getInvitedBy() == null) {
                        boolean immune = false;
                        if (plugin.getConfiguration().get(ConfigurationKeys.INVITES_ADMINS_IMMUNE)) {
                            var adminList = plugin.getConfiguration().get(ConfigurationKeys.ADMIN_LIST);
                            if (adminList != null && adminList.contains(user.getLastNickname())) {
                                immune = true;
                            }
                        }
                        if (!immune) {
                            if (event.getPacketType() != PacketType.Play.Client.KEEP_ALIVE
                                    && event.getPacketType() != PacketType.Play.Client.PONG
                                    && event.getPacketType() != PacketType.Play.Client.PLUGIN_MESSAGE
                                    && event.getPacketType() != PacketType.Play.Client.CLIENT_SETTINGS) {
                                event.setCancelled(true);
                                return;
                            }
                        }
                    }
                }
            }
        }

        if (event.getPacketType() != PacketType.Login.Client.LOGIN_START
                && event.getPacketType() != PacketType.Login.Client.ENCRYPTION_RESPONSE) return;

        delegate.onPacketReceive(event);
    }
}
