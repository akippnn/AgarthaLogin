/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.mocks;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import xyz.kyngs.librelogin.api.database.ReadWriteDatabaseProvider;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.common.database.AuthenticUser;

public class MockDatabaseProvider implements ReadWriteDatabaseProvider {

    private final Map<UUID, User> usersByUuid = new ConcurrentHashMap<>();
    private final Map<String, User> usersByName = new ConcurrentHashMap<>();

    @Override
    public User getByName(String name) {
        return usersByName.get(name.toLowerCase());
    }

    @Override
    public User getByUUID(UUID uuid) {
        return usersByUuid.get(uuid);
    }

    @Override
    public User getByPremiumUUID(UUID uuid) {
        for (User user : usersByUuid.values()) {
            if (uuid.equals(user.getPremiumUUID())) {
                return user;
            }
        }
        return null;
    }

    @Override
    public Collection<User> getAllUsers() {
        return usersByUuid.values();
    }

    @Override
    public Collection<User> getByIP(String ip) {
        return usersByUuid.values().stream().filter(u -> ip.equals(u.getIp())).toList();
    }

    @Override
    public void insertUser(User user) {
        if (user instanceof AuthenticUser) {
            usersByUuid.put(user.getUuid(), user);
            usersByName.put(user.getLastNickname().toLowerCase(), user);
        } else {
            throw new IllegalArgumentException("MockDatabaseProvider only supports AuthenticUser");
        }
    }

    @Override
    public void insertUsers(Collection<User> users) {
        for (User user : users) {
            insertUser(user);
        }
    }

    @Override
    public void updateUser(User user) {
        // In-memory map updates by reference mostly, but re-putting ensures keys are
        // correct if changed (though UUID shouldn't change)
        usersByUuid.put(user.getUuid(), user);
        usersByName.put(user.getLastNickname().toLowerCase(), user);
    }

    @Override
    public void deleteUser(User user) {
        usersByUuid.remove(user.getUuid());
        usersByName.remove(user.getLastNickname().toLowerCase());
    }
}
