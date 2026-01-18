/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.mocks;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import net.kyori.adventure.audience.Audience;
import net.kyori.adventure.text.Component;
import xyz.kyngs.librelogin.api.PlatformHandle;
import xyz.kyngs.librelogin.api.server.ServerPing;

public class MockPlatformHandle implements PlatformHandle<Object, Object> {

    private final Map<UUID, Object> players = new ConcurrentHashMap<>();

    // Test util
    public void addPlayer(UUID uuid, Object player) {
        players.put(uuid, player);
    }

    @Override
    public Locale getLocale(Object player) {
        return Locale.US;
    }

    @Override
    public Object getPlayer(UUID uuid) {
        return players.get(uuid);
    }

    @Override
    public Audience getAudienceForPlayer(Object player) {
        return Audience.empty();
    }

    @Override
    public UUID getUUIDForPlayer(Object player) {
        for (Map.Entry<UUID, Object> entry : players.entrySet()) {
            if (entry.getValue().equals(player)) return entry.getKey();
        }
        return null;
    }

    @Override
    public CompletableFuture<Throwable> movePlayer(Object player, Object to) {
        return CompletableFuture.completedFuture(null);
    }

    @Override
    public void kick(Object player, Component reason) {
        // No-op
    }

    @Override
    public Object getServer(String name, boolean limbo) {
        return new Object();
    }

    @Override
    public Class<Object> getServerClass() {
        return Object.class;
    }

    @Override
    public Class<Object> getPlayerClass() {
        return Object.class;
    }

    @Override
    public String getIP(Object player) {
        return "127.0.0.1";
    }

    @Override
    public ServerPing ping(Object server) {
        return null;
    }

    @Override
    public Collection<Object> getServers() {
        return Collections.emptyList();
    }

    @Override
    public String getServerName(Object server) {
        return "mock-server";
    }

    @Override
    public int getConnectedPlayers(Object server) {
        return 0;
    }

    @Override
    public String getPlayersServerName(Object player) {
        return "mock-server";
    }

    @Override
    public String getPlayersVirtualHost(Object player) {
        return "localhost";
    }

    @Override
    public String getUsernameForPlayer(Object player) {
        return "TestUser";
    }

    @Override
    public String getPlatformIdentifier() {
        return "mock";
    }

    @Override
    public ProxyData getProxyData() {
        return new ProxyData(
                "mock",
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList());
    }
}
