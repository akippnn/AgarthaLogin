package xyz.kyngs.librelogin.common.command.commands.agartha;

import co.aikar.commands.annotation.CommandAlias;
import co.aikar.commands.annotation.Subcommand;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import xyz.kyngs.librelogin.common.AuthenticLibreLogin;
import xyz.kyngs.librelogin.common.command.Command;
import xyz.kyngs.librelogin.common.web.WebSessionManager;

import static xyz.kyngs.librelogin.common.config.ConfigurationKeys.ADMIN_LIST;
import static xyz.kyngs.librelogin.common.config.ConfigurationKeys.WEB_PUBLIC_URL;

@CommandAlias("agarthalogin")
public class AgarthaLoginCommand<P> extends Command<P> {

    public AgarthaLoginCommand(AuthenticLibreLogin<P, ?> plugin) {
        super(plugin);
    }

    @Subcommand("adminpanel")
    public void onAdminPanel(P player) {
        String username = plugin.getPlatformHandle().getName(player);
        if (!plugin.getConfiguration().get(ADMIN_LIST).contains(username)) {
            plugin.getPlatformHandle().sendMessage(player, Component.text("You are not authorized to use this command.", NamedTextColor.RED));
            return;
        }

        String token = plugin.getWebServer().getSessionManager().createAdminToken();
        String url = plugin.getConfiguration().get(WEB_PUBLIC_URL) + "?token=" + token;

        Component message = Component.text("Click here to access the admin panel.", NamedTextColor.GOLD)
                .clickEvent(ClickEvent.openUrl(url));
        
        plugin.getPlatformHandle().sendMessage(player, message);
    }

    @Subcommand("apply")
    public void onApply(P player, String code) {
        String username = plugin.getPlatformHandle().getName(player);
         if (!plugin.getConfiguration().get(ADMIN_LIST).contains(username)) {
            plugin.getPlatformHandle().sendMessage(player, Component.text("You are not authorized to use this command.", NamedTextColor.RED));
            return;
        }
        
        Runnable action = plugin.getWebServer().getSessionManager().getAndRemoveAdminAction(code);
        if (action != null) {
            action.run();
            plugin.getPlatformHandle().sendMessage(player, Component.text("Action executed successfully.", NamedTextColor.GREEN));
        } else {
            plugin.getPlatformHandle().sendMessage(player, Component.text("Invalid or expired code.", NamedTextColor.RED));
        }
    }
}
