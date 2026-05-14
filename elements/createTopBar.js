import Gtk from 'gi://Gtk?version=4.0';
import { data } from '../index.js';

export function createTopBar() {
    const topbar = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
    });
    const spacer = new Gtk.Box({ hexpand: true });
    const liveIndicator = new Gtk.Button({ label: data.isLive ? 'LIVE' : 'OFFLINE' });
    if (data.isLive) { liveIndicator.add_css_class('destructive-action'); liveIndicator.set_sensitive(true); }
    else { liveIndicator.remove_css_class('destructive-action'); liveIndicator.set_sensitive(false); }

    const sceneLabels = data.scenes.map((scene, index) => {
        const btn = new Gtk.Button({ label: scene });
        if (index !== data.activeSceneIndex) {
            btn.set_opacity(0.5);
        }
        btn.add_css_class("round")
        return btn;
    });
    const sceneBtnContainer = new Gtk.Box({
        spacing: 0
    });
    sceneBtnContainer.add_css_class('linked');
    sceneBtnContainer.set_margin_start(10);
    sceneBtnContainer.set_margin_top(10);
    sceneBtnContainer.set_margin_bottom(10);

    for (const btn of sceneLabels) {
        sceneBtnContainer.append(btn);
    }

    topbar.append(sceneBtnContainer);

    const actionBtnContainer = new Gtk.Box({
        spacing: 0
    });
    actionBtnContainer.add_css_class('linked');
    actionBtnContainer.set_margin_start(10);
    actionBtnContainer.set_margin_top(10);
    actionBtnContainer.set_margin_bottom(10);

    const addNewSceneBtn = new Gtk.Button({ label: '+' });
    // addNewSceneBtn.add_css_class('suggested-action');
    addNewSceneBtn.add_css_class('circular');    
    const removeCurrentSceneBtn = new Gtk.Button({ label: '-' });
    removeCurrentSceneBtn.add_css_class('destructive-action');
    removeCurrentSceneBtn.add_css_class('circular');

    actionBtnContainer.append(addNewSceneBtn);
    actionBtnContainer.append(removeCurrentSceneBtn);

    liveIndicator.set_margin_end(10);
    liveIndicator.set_margin_top(10);
    liveIndicator.set_margin_bottom(10);

    topbar.append(sceneBtnContainer);
    topbar.append(actionBtnContainer);
    topbar.append(spacer);
    topbar.append(liveIndicator);

    return {
        widget: topbar,
        liveIndicator,
        sceneButtons: sceneLabels,
        addNewSceneBtn,
        removeCurrentSceneBtn,
        sceneBtnContainer
    };
}