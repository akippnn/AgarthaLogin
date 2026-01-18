/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.mocks;

import java.util.Collections;
import xyz.kyngs.librelogin.api.Logger;
import xyz.kyngs.librelogin.common.config.HoconPluginConfiguration;
import xyz.kyngs.librelogin.common.config.key.ConfigurationKey;

public class MockPluginConfiguration extends HoconPluginConfiguration {

    public MockPluginConfiguration(Logger logger) {
        super(logger, Collections.emptyList());
    }

    @Override
    public <T> T get(ConfigurationKey<T> key) {
        return key.defaultValue();
    }
}
