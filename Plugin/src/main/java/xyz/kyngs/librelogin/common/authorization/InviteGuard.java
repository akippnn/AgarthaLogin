/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.authorization;

import org.jetbrains.annotations.Nullable;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.config.ConfigurationKeys;

/**
 * Single source of truth for invite-system checks. All invite-related decisions in the codebase
 * MUST delegate here.
 */
public final class InviteGuard {

    private InviteGuard() {} // Utility class

    /**
     * Determines whether a player needs an invite to proceed.
     *
     * @param plugin The plugin instance (for config access).
     * @param user The user object, or null if the user doesn't exist in the DB yet.
     * @return true if the player MUST provide an invite before they can register/login.
     */
    public static boolean needsInvite(AuthenticLibreLogin<?, ?> plugin, @Nullable User user) {
        if (!plugin.getConfiguration().get(ConfigurationKeys.INVITES_ENABLED)) {
            return false;
        }

        // No user record at all → definitely needs invite (Geyser first-join, etc.)
        if (user == null) {
            return true;
        }

        // Already has an invite → no need
        if (user.getInvitedBy() != null) {
            return false;
        }

        // Check admin immunity
        if (plugin.getConfiguration().get(ConfigurationKeys.INVITES_ADMINS_IMMUNE)) {
            var adminList = plugin.getConfiguration().get(ConfigurationKeys.ADMIN_LIST);
            if (adminList != null && adminList.contains(user.getLastNickname())) {
                return false; // Admin is immune
            }
        }

        return true; // Needs invite
    }

    /**
     * Checks if a player should be blocked from transferring to a non-limbo server. Call this from
     * Velocity Blockers.onServerConnect and Paper Blockers.onTeleport.
     *
     * @return true if the transfer should be DENIED (player needs invite or is unauthorized).
     */
    public static <P, S> boolean shouldBlockServerTransfer(
            AuthenticLibreLogin<P, S> plugin, P player, S targetServer) {
        var uuid = plugin.getPlatformHandle().getUUIDForPlayer(player);
        var user = plugin.getDatabaseProvider().getByUUID(uuid);

        if (!needsInvite(plugin, user)) {
            return false; // Player has an invite, allow transfer
        }

        // Check if target is a limbo server — if so, allow it
        // (they need to be IN limbo, not blocked FROM limbo)
        return !plugin.getServerHandler().getLimboServers().contains(targetServer);
    }
}
