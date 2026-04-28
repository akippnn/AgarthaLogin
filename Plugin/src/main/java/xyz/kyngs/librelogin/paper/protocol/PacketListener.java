/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.paper.protocol;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.retrooper.packetevents.event.PacketListenerAbstract;
import com.github.retrooper.packetevents.event.PacketListenerPriority;
import com.github.retrooper.packetevents.event.PacketReceiveEvent;
import com.github.retrooper.packetevents.protocol.packettype.PacketType;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import xyz.kyngs.librelogin.common.config.ConfigurationKeys;
import xyz.kyngs.librelogin.paper.PaperLibreLogin;
import xyz.kyngs.librelogin.paper.PaperListeners;

public class PacketListener extends PacketListenerAbstract {
    private final PaperLibreLogin plugin;
    private final PaperListeners delegate;
    private final Cache<UUID, Boolean> needsInviteCache;

    public PacketListener(PaperLibreLogin plugin, PaperListeners delegate) {
        super(PacketListenerPriority.HIGHEST);
        this.plugin = plugin;
        this.delegate = delegate;
        this.needsInviteCache =
                Caffeine.newBuilder().expireAfterWrite(30, TimeUnit.SECONDS).build();
    }

    public void invalidateInviteCache(UUID uuid) {
        needsInviteCache.invalidate(uuid);
    }

    @Override
    public void onPacketReceive(PacketReceiveEvent event) {
        if (event.isCancelled()) return;

        if (event.getPacketType().getClass().getSimpleName().startsWith("Play")) {
            var pUser = event.getUser();
            if (pUser != null && pUser.getUUID() != null) {
                if (plugin.getConfiguration().get(ConfigurationKeys.INVITES_ENABLED)) {
                    Boolean needsInvite =
                            needsInviteCache.get(
                                    pUser.getUUID(),
                                    k -> {
                                        var user = plugin.getDatabaseProvider().getByUUID(k);
                                        if (user != null && user.getInvitedBy() == null) {
                                            boolean immune = false;
                                            if (plugin.getConfiguration()
                                                    .get(ConfigurationKeys.INVITES_ADMINS_IMMUNE)) {
                                                var adminList =
                                                        plugin.getConfiguration()
                                                                .get(ConfigurationKeys.ADMIN_LIST);
                                                if (adminList != null
                                                        && adminList.contains(
                                                                user.getLastNickname())) {
                                                    immune = true;
                                                }
                                            }
                                            return !immune;
                                        }
                                        return false;
                                    });

                    if (Boolean.TRUE.equals(needsInvite)) {
                        if (event.getPacketType() != PacketType.Play.Client.KEEP_ALIVE
                                && event.getPacketType() != PacketType.Play.Client.PONG
                                && event.getPacketType() != PacketType.Play.Client.PLUGIN_MESSAGE
                                && event.getPacketType()
                                        != PacketType.Play.Client.CLIENT_SETTINGS) {
                            event.setCancelled(true);
                            return;
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
