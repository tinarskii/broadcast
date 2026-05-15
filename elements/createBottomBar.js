import Gtk from 'gi://Gtk?version=4.0';
import { data } from '../index.js';

export function createBottomBar() {
    const recordButton = new Gtk.Button({ label: data.isLive ? 'STOP' : 'START' });
    const elementsButton = new Gtk.Button({ label: 'Elements' });
    const settingsButton = new Gtk.Button({ label: 'Settings' });
    elementsButton.set_margin_top(10);
    elementsButton.set_margin_bottom(10);
    elementsButton.set_margin_start(10);
    settingsButton.set_margin_top(10);
    settingsButton.set_margin_bottom(10);
    settingsButton.set_margin_end(10);
    const bottomBar = new Gtk.CenterBox();
    recordButton.set_margin_top(10);
    recordButton.set_margin_bottom(10);
    bottomBar.set_start_widget(elementsButton);
    bottomBar.set_center_widget(recordButton);
    bottomBar.set_end_widget(settingsButton);
    return {
        widget: bottomBar,
        elementsButton,
        recordButton,
        settingsButton
    };
}
