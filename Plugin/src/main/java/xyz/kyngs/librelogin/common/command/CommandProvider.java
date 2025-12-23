/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.command;

import co.aikar.commands.CommandManager;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import net.kyori.adventure.audience.Audience;
import net.kyori.adventure.text.TextComponent;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import xyz.kyngs.librelogin.api.database.User;
import xyz.kyngs.librelogin.common.AuthenticHandler;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.command.commands.agartha.AgarthaLoginCommand;
import xyz.kyngs.librelogin.common.command.commands.staff.LibreLoginCommand;

public class CommandProvider<P, S> extends AuthenticHandler<P, S> {

    private final CommandManager<?, ?, ?, ?, ?, ?> manager;
    private final Cache<UUID, Object> confirmCache =
            Caffeine.newBuilder().expireAfterWrite(30, TimeUnit.SECONDS).build();
    private final RateLimiter<UUID> limiter = new RateLimiter<>(1, 1000);
    private static final LegacyComponentSerializer ACF_SERIALIZER =
            LegacyComponentSerializer.legacyAmpersand();

    public CommandProvider(AuthenticLibreLogin<P, S> plugin) {
        super(plugin);
        manager = plugin.provideManager();

        manager.registerCommand(new AgarthaLoginCommand<>(plugin));

        // Disabled commands in favor of Web Auth
        /*
        manager.registerCommand(new LoginCommand<>(plugin));
        // ...
        manager.registerCommand(new PremiumEnableCommand<>(plugin));

        manager.registerCommand(new LibreLoginCommand<>(plugin));
        manager.registerCommand(new StaffCommand<>(plugin));
        */
    }

    public void registerConfirm(UUID uuid) {
        confirmCache.put(uuid, new Object());
    }

    public void onConfirm(P player, Audience audience, User user) {
        if (confirmCache.asMap().remove(user.getUuid()) == null)
            throw new InvalidCommandArgument(plugin.getMessages().getMessage("error-no-confirm"));

        audience.sendMessage(plugin.getMessages().getMessage("info-enabling"));

        LibreLoginCommand.enablePremium(player, user, plugin, true);

        plugin.getDatabaseProvider().updateUser(user);

        platformHandle.kick(player, plugin.getMessages().getMessage("kick-premium-info-enabled"));
    }

    public TextComponent getMessage(String key) {
        return plugin.getMessages().getMessage(key);
    }

    private String getMessageAsString(String key) {
        return ACF_SERIALIZER.serialize(getMessage(key));
    }

    public RateLimiter<UUID> getLimiter() {
        return limiter;
    }

    public void injectMessages() {
        var locales = manager.getLocales();
        var localeMap = new HashMap<String, String>();

        localeMap.put("acf-core.permission_denied", getMessageAsString("error-no-permission"));
        localeMap.put(
                "acf-core.permission_denied_parameter", getMessageAsString("error-no-permission"));
        localeMap.put("acf-core.invalid_syntax", getMessageAsString("error-invalid-syntax"));
        localeMap.put("acf-core.unknown_command", getMessageAsString("error-unknown-command"));

        plugin.getMessages()
                .getMessages()
                .forEach(
                        (key, value) -> {
                            if (key.startsWith("syntax")) {
                                localeMap.put(key, ACF_SERIALIZER.serialize(value));
                            } else if (key.startsWith("autocomplete")) {
                                var serialized = ACF_SERIALIZER.serialize(value);
                                manager.getCommandReplacements()
                                        .addReplacement(
                                                key,
                                                serialized.isBlank()
                                                        ? serialized
                                                        : serialized + " @nothing");
                            }
                        });

        locales.addMessageStrings(locales.getDefaultLocale(), localeMap);
    }

    public static class RateLimiter<T> {
        private final Cache<T, Long> cache;
        private final long window;

        public RateLimiter(int permits, long window) {
            this.window = window;
            this.cache =
                    Caffeine.newBuilder().expireAfterWrite(window, TimeUnit.MILLISECONDS).build();
        }

        public boolean tryAcquire(T key) {
            if (cache.getIfPresent(key) != null) return false;
            cache.put(key, System.currentTimeMillis() + window);
            return true;
        }
    }
}
