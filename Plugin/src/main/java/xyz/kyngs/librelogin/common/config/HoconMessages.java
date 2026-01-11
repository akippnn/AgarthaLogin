/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.config;

import java.io.IOException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.TextComponent;
import net.kyori.adventure.text.minimessage.MiniMessage;
import org.spongepowered.configurate.CommentedConfigurationNode;
import xyz.kyngs.librelogin.api.BiHolder;
import xyz.kyngs.librelogin.api.LibreLoginPlugin;
import xyz.kyngs.librelogin.api.Logger;
import xyz.kyngs.librelogin.api.configuration.CorruptedConfigurationException;
import xyz.kyngs.librelogin.api.configuration.Messages;
import xyz.kyngs.librelogin.common.config.migrate.messages.FirstMessagesMigrator;
import xyz.kyngs.librelogin.common.config.migrate.messages.SecondMessagesMigrator;
import xyz.kyngs.librelogin.common.config.migrate.messages.ThirdMessagesMigrator;
import xyz.kyngs.librelogin.common.util.GeneralUtil;
import xyz.kyngs.utils.legacymessage.LegacyMessage;

public class HoconMessages implements Messages {

    private static final MiniMessage SERIALIZER = MiniMessage.builder().build();
    private final Map<String, TextComponent> messages;
    private final Logger logger;
    private ConfigurateConfiguration rawMessages;

    // Store locale-specific messages (e.g. en-US -> {key -> msg})
    private final Map<Locale, Map<String, TextComponent>> localeMessages = new HashMap<>();

    public HoconMessages(Logger logger) {
        this.logger = logger;
        messages = new HashMap<>();
    }

    public Map<String, TextComponent> getMessages() {
        return messages;
    }

    @Override
    public TextComponent getMessage(String key, String... replacements) {
        var message = messages.get(key);
        if (message == null) return null; // Handle null message

        if (replacements.length == 0) return message;

        var replaceMap = new HashMap<String, String>();
        String toReplace = null;

        for (int i = 0; i < replacements.length; i++) {
            if (i % 2 != 0) {
                replaceMap.put(toReplace, replacements[i]);
            } else {
                toReplace = replacements[i];
            }
        }

        return GeneralUtil.formatComponent(message, replaceMap);
    }

    @Override
    public TextComponent getMessage(String key, Locale locale, String... replacements) {
        if (locale != null) {
            // Try specific locale (e.g. en-US)
            var map = localeMessages.get(locale);
            if (map != null && map.containsKey(key)) {
                return format(map.get(key), replacements);
            }
            // Try language only (e.g. en) if different
            if (!locale.getLanguage().equals(locale.toLanguageTag())) {
                var langMap = localeMessages.get(new Locale(locale.getLanguage()));
                if (langMap != null && langMap.containsKey(key)) {
                    return format(langMap.get(key), replacements);
                }
            }
        }
        // Fallback to default
        return getMessage(key, replacements);
    }

    private TextComponent format(TextComponent message, String... replacements) {
        if (replacements.length == 0) return message;
        var replaceMap = new HashMap<String, String>();
        String toReplace = null;
        for (int i = 0; i < replacements.length; i++) {
            if (i % 2 != 0) replaceMap.put(toReplace, replacements[i]);
            else toReplace = replacements[i];
        }
        return GeneralUtil.formatComponent(message, replaceMap);
    }

    private void loadLocales(LibreLoginPlugin<?, ?> plugin) {
        localeMessages.clear();
        try (var in = plugin.getClass().getResourceAsStream("/locales/available_locales.txt")) {
            if (in == null) return;
            var reader = new java.io.BufferedReader(new java.io.InputStreamReader(in));
            reader.lines()
                    .forEach(
                            lang -> {
                                if (lang.isBlank()) return;
                                try (var confIn =
                                        plugin.getClass()
                                                .getResourceAsStream(
                                                        "/locales/messages_" + lang + ".conf")) {
                                    if (confIn == null) return;

                                    var loader =
                                            org.spongepowered.configurate.hocon
                                                    .HoconConfigurationLoader.builder()
                                                    .source(
                                                            () ->
                                                                    new java.io.BufferedReader(
                                                                            new java.io
                                                                                    .InputStreamReader(
                                                                                    confIn)))
                                                    .build();
                                    var root = loader.load();

                                    var map = new HashMap<String, TextComponent>();
                                    extractKeys("", root, map);

                                    localeMessages.put(
                                            Locale.forLanguageTag(lang.replace('_', '-')), map);
                                } catch (Exception e) {
                                    logger.warn("Failed to load locale " + lang);
                                    e.printStackTrace();
                                }
                            });
        } catch (Exception e) {
            e.printStackTrace();
        }
        logger.info("Loaded " + localeMessages.size() + " extra locales");
    }

    @Override
    public void reload(LibreLoginPlugin<?, ?> plugin)
            throws IOException, CorruptedConfigurationException {
        // Load generated locales first
        loadLocales(plugin);

        var adept =
                new ConfigurateConfiguration(
                        plugin.getDataFolder(),
                        "messages.conf",
                        Set.of(new BiHolder<>(MessageKeys.class, "")),
                        """
                          !!THIS FILE IS WRITTEN IN THE HOCON FORMAT!!
                          The hocon format is very similar to JSON, but it has some extra features.
                          You can find more information about the format on the sponge wiki:
                          https://docs.spongepowered.org/stable/en/server/getting-started/configuration/hocon.html
                          ----------------------------------------------------------------------------------------
                          LibreLogin Messages
                          ----------------------------------------------------------------------------------------
                          This file contains all of the messages used by the plugin, you are welcome to fit it to your needs.
                          The messages can be written both in the legacy format and in the MiniMessage format. For example, the following message is completely valid: <bold>&aReloaded!</bold>
                          You can find more information about LibreLogin on the github page:
                          https://github.com/Navio1430/LibreLoginProd
                        """,
                        logger,
                        new FirstMessagesMigrator(),
                        new SecondMessagesMigrator(),
                        new ThirdMessagesMigrator());

        messages.clear(); // Clear old default messages
        extractKeys("", adept.getHelper().configuration(), messages);
        rawMessages = adept;
    }

    private void extractKeys(
            String prefix, CommentedConfigurationNode node, Map<String, TextComponent> target) {
        node.childrenMap()
                .forEach(
                        (key, value) -> {
                            if (!(key instanceof String str)) return;

                            if (value.childrenMap().isEmpty()) {
                                var string = value.getString();

                                if (string == null) return;

                                target.put(
                                        prefix + str,
                                        Component.empty()
                                                .append(
                                                        SERIALIZER.deserialize(
                                                                LegacyMessage.fromLegacy(
                                                                        string, "&"))));
                            } else {
                                extractKeys(prefix + str + ".", value, target);
                            }
                        });
    }

    public String getRawMessage(String key) {
        return rawMessages.getHelper().getString(key);
    }

    @Override
    public boolean isEmpty(String key) {
        return getRawMessage(key).equals(" ");
    }
}
