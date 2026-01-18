/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.mocks;

import java.util.UUID;
import xyz.kyngs.librelogin.api.premium.PremiumException;
import xyz.kyngs.librelogin.api.premium.PremiumUser;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.premium.AuthenticPremiumProvider;

public class MockPremiumProvider extends AuthenticPremiumProvider {

    public MockPremiumProvider(AuthenticLibreLogin<?, ?> plugin) {
        super(plugin);
    }

    @Override
    public PremiumUser getUserForName(String name) throws PremiumException {
        // Mock response - always return a dummy premium user for specific names, or
        // throw/return null
        if (name.equalsIgnoreCase("PremiumUser")) {
            return new PremiumUser(UUID.randomUUID(), "PremiumUser", true);
        }
        return null;
    }

    @Override
    public PremiumUser getUserForUUID(UUID uuid) throws PremiumException {
        return null;
    }
}
