package net.dege.digirep;

import androidx.appcompat.app.AppCompatDelegate;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ThemeBars")
public class ThemeBarsPlugin extends Plugin {

    @PluginMethod
    public void setDarkMode(final PluginCall call) {
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));

        getBridge().executeOnMainThread(() -> {
            AppCompatDelegate.setDefaultNightMode(
                dark ? AppCompatDelegate.MODE_NIGHT_YES : AppCompatDelegate.MODE_NIGHT_NO
            );
            call.resolve();
        });
    }
}
