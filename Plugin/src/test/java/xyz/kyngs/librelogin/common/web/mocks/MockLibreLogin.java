/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web.mocks;

import co.aikar.commands.CommandIssuer;
import co.aikar.commands.CommandManager;
import java.io.File;
import java.io.InputStream;
import java.sql.Timestamp;
import java.util.UUID;
import net.kyori.adventure.audience.Audience;
import org.bstats.charts.CustomChart;
import xyz.kyngs.librelogin.api.Logger;
import xyz.kyngs.librelogin.api.PlatformHandle;
import xyz.kyngs.librelogin.api.crypto.CryptoProvider;
import xyz.kyngs.librelogin.api.crypto.HashedPassword;
import xyz.kyngs.librelogin.api.database.ReadWriteDatabaseProvider;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.database.AuthenticUser;
import xyz.kyngs.librelogin.common.event.AuthenticEventProvider;
import xyz.kyngs.librelogin.common.image.AuthenticImageProjector;
import xyz.kyngs.librelogin.common.premium.AuthenticPremiumProvider;
import xyz.kyngs.librelogin.common.util.CancellableTask;

public class MockLibreLogin extends AuthenticLibreLogin<Object, Object> {

    private final MockDatabaseProvider databaseProvider = new MockDatabaseProvider();
    private final MockPlatformHandle platformHandle = new MockPlatformHandle();
    private final MockCryptoProvider cryptoProvider = new MockCryptoProvider();
    private final MockPremiumProvider premiumProvider = new MockPremiumProvider(this);
    private final AuthenticEventProvider<Object, Object> eventProvider =
            new AuthenticEventProvider<>(this);

    private final MockPluginConfiguration configuration;
    private final MockAuthorizationProvider authorizationProvider;

    public MockLibreLogin() {
        this.logger = provideLogger();
        this.configuration = new MockPluginConfiguration(this.logger);
        this.authorizationProvider = new MockAuthorizationProvider(this);
        registerCryptoProvider(cryptoProvider);
    }

    @Override
    public xyz.kyngs.librelogin.common.config.HoconPluginConfiguration getConfiguration() {
        return configuration;
    }

    @Override
    public xyz.kyngs.librelogin.common.authorization.AuthenticAuthorizationProvider<Object, Object>
            getAuthorizationProvider() {
        return authorizationProvider;
    }

    @Override
    protected PlatformHandle<Object, Object> providePlatformHandle() {
        return platformHandle;
    }

    @Override
    public ReadWriteDatabaseProvider getDatabaseProvider() {
        return databaseProvider;
    }

    @Override
    public PlatformHandle<Object, Object> getPlatformHandle() {
        return platformHandle;
    }

    @Override
    public CryptoProvider getDefaultCryptoProvider() {
        return cryptoProvider;
    }

    @Override
    public AuthenticPremiumProvider getPremiumProvider() {
        return premiumProvider;
    }

    @Override
    public AuthenticEventProvider<Object, Object> getEventProvider() {
        return eventProvider;
    }

    // --- Stubs for abstract methods ---

    @Override
    public CancellableTask repeat(Runnable run, long delay, long period) {
        return null;
    }

    @Override
    public CancellableTask delay(Runnable run, long delay) {
        // Run immediately for tests
        run.run();
        return null;
    }

    @Override
    public CommandManager provideManager() {
        return null;
    }

    @Override
    protected AuthenticImageProjector<Object, Object> provideImageProjector() {
        return null;
    }

    @Override
    protected Logger provideLogger() {
        // Simple console logger
        return new Logger() {
            @Override
            public void info(String message) {
                System.out.println("[INFO] " + message);
            }

            @Override
            public void info(String message, Throwable t) {
                System.out.println("[INFO] " + message);
                t.printStackTrace();
            }

            @Override
            public void warn(String message) {
                System.out.println("[WARN] " + message);
            }

            @Override
            public void warn(String message, Throwable t) {
                System.out.println("[WARN] " + message);
                t.printStackTrace();
            }

            @Override
            public void error(String message) {
                System.err.println("[ERROR] " + message);
            }

            @Override
            public void error(String message, Throwable t) {
                System.err.println("[ERROR] " + message);
                t.printStackTrace();
            }

            @Override
            public void debug(String message, Throwable t) {}

            @Override
            public void debug(String message) {}
        };
    }

    @Override
    public String getVersion() {
        return "0.29.0-MOCK";
    }

    @Override
    public User createUser(
            UUID uuid,
            UUID premiumUUID,
            HashedPassword hashedPassword,
            String lastNickname,
            Timestamp joinDate,
            Timestamp lastSeen,
            String secret,
            String ip,
            Timestamp lastAuthentication,
            String lastServer,
            String email) {
        return new AuthenticUser(
                uuid,
                premiumUUID,
                hashedPassword,
                lastNickname,
                joinDate,
                lastSeen,
                secret,
                ip,
                lastAuthentication,
                lastServer,
                email);
    }

    @Override
    public boolean pluginPresent(String name) {
        return false;
    }

    @Override
    public boolean isPresent(UUID uuid) {
        return platformHandle.getPlayer(uuid) != null;
    }

    @Override
    public Audience getAudienceFromIssuer(CommandIssuer issuer) {
        return Audience.empty();
    }

    @Override
    public Object getPlayerForUUID(UUID uuid) {
        return platformHandle.getPlayer(uuid);
    }

    @Override
    public File getDataFolder() {
        return new File("build/tmp/mock-data");
    }

    @Override
    public Object getPlayerFromIssuer(CommandIssuer issuer) {
        return null;
    }

    @Override
    public void initMetrics(CustomChart... charts) {}

    @Override
    public boolean multiProxyEnabled() {
        return false;
    }

    @Override
    public InputStream getResourceAsStream(String name) {
        return getClass().getClassLoader().getResourceAsStream(name);
    }

    @Override
    public void authorize(Object player, User user, Audience audience) {
        // No-op for mock
    }
}
