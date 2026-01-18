/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.mocks;

import org.jetbrains.annotations.Nullable;
import xyz.kyngs.librelogin.api.crypto.CryptoProvider;
import xyz.kyngs.librelogin.api.crypto.HashedPassword;

public class MockCryptoProvider implements CryptoProvider {

    @Override
    public @Nullable HashedPassword createHash(String password) {
        // Fast hash for benchmarking
        return new HashedPassword("hash:" + password, null, "MOCK");
    }

    @Override
    public boolean matches(String input, HashedPassword password) {
        return password.hash().equals("hash:" + input);
    }

    @Override
    public String getIdentifier() {
        return "MOCK";
    }
}
