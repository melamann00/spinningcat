import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const FRAME_COUNT = 16;
const INTERVAL_MS = 100;
const ICON_SIZE = 26;

export default class SpinCatExtension extends Extension {
    enable() {
        this._tick = 0;

        // Preload all spin frames from the extension's frames/ folder
        this._frames = [];
        for (let i = 0; i < FRAME_COUNT; i++) {
            const name = `frame_${String(i).padStart(2, '0')}.png`;
            const file = Gio.File.new_for_path(`${this.path}/frames/${name}`);
            this._frames.push(new Gio.FileIcon({file}));
        }

        // true = no dropdown menu, we only want an icon-like button
        this._button = new PanelMenu.Button(0.0, 'Spinning Cat', true);

        this._icon = new St.Icon({
            gicon: this._frames[0],
            icon_size: ICON_SIZE,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._button.add_child(this._icon);

        // Clicking the cat opens the Activities overview
        this._button.connect('button-press-event', () => {
            Main.overview.toggle();
            return Clutter.EVENT_STOP;
        });

        // index 0 in the 'left' box = far left corner
        Main.panel.addToStatusArea(this.uuid, this._button, 0, 'left');

        // Hide the workspace indicator pill next to the cat
        Main.panel.statusArea.activities?.hide();

        this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, INTERVAL_MS, () => {
            this._tick = (this._tick + 1) % FRAME_COUNT;
            this._icon.gicon = this._frames[this._tick];
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }
        Main.panel.statusArea.activities?.show();
        this._button?.destroy();
        this._button = null;
        this._icon = null;
        this._frames = null;
    }
}
