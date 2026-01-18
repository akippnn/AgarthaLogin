/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.mocks;

import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.api.event.events.AuthenticatedEvent;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.authorization.AuthenticAuthorizationProvider;

public class MockAuthorizationProvider extends AuthenticAuthorizationProvider<Object, Object> {

    public MockAuthorizationProvider(AuthenticLibreLogin<Object, Object> plugin) {
        super(plugin);
    }

    @Override
    public boolean isAuthorized(Object player) {
        return true;
    }

    @Override
    public void authorize(
            User user, Object player, AuthenticatedEvent.AuthenticationReason reason) {
        // No-op
    }

    @Override
    public void startTracking(User user, Object player) {
        // No-op to avoid scheduling tasks or messing with audience
    }
}
