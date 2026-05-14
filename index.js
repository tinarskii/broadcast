/**
 * This Source Code Form is subject to the terms 
 * of the Mozilla Public License, v. 2.0. 
 * If a copy of the MPL was not distributed with this file, 
 * You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import Gtk from 'gi://Gtk?version=4.0';
import Adwaita from 'gi://Adw?version=1';
import { createTopBar } from './elements/createTopBar.js';
import { createBottomBar } from './elements/createBottomBar.js';
import { createPreviewArea } from './elements/createPreviewArea.js';
import Gst from 'gi://Gst?version=1.0';
import { createConfirmationDialog, createErrorDialog, createInputDialog } from './elements/createDialog.js';
import { createPreferencesDialog } from './elements/createPreferencesDialog.js';

// Mock data
export const data = {
    scenes: ['Scene 1', 'Scene 2', 'Scene 3'],
    activeSceneIndex: 0,
    isLive: false,
};

Gst.init(null);

const app = new Adwaita.Application({
    application_id: 'com.tinarskii.broadcast',
});

app.connect('activate', () => {
    // Window
    const window = new Adwaita.ApplicationWindow({ application: app });
    window.set_default_size(1280, 720);

    // Toolbar View
    const toolbarView = new Adwaita.ToolbarView();

    // Title Bar
    const header = new Adwaita.HeaderBar();
    header.set_title_widget(new Gtk.Label({ label: 'Broadcast' }));

    const topbar = createTopBar();
    const preview = createPreviewArea();
    const bottombar = createBottomBar();

    // Content
    const content = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
    });
    content.append(topbar.widget);
    content.append(preview.widget);
    content.append(bottombar.widget);

    // Assemble
    toolbarView.add_top_bar(header);
    toolbarView.set_content(content);

    // Show
    window.set_content(toolbarView);
    window.present();

    function refreshUI() {
        topbar.liveIndicator.set_label(data.isLive ? 'LIVE' : 'OFFLINE');
        topbar.liveIndicator.set_sensitive(data.isLive);
        if (data.isLive) {
            topbar.liveIndicator.add_css_class('destructive-action');
        } else {
            topbar.liveIndicator.remove_css_class('destructive-action');
        }

        topbar.sceneButtons.forEach((btn, index) => {
            btn.set_opacity(index === data.activeSceneIndex ? 1 : 0.5);
        });

        if (data.isLive) {
            bottombar.recordButton.set_label('STOP');
            topbar.liveIndicator.set_label('LIVE');
            topbar.liveIndicator.add_css_class('destructive-action');
            topbar.liveIndicator.set_sensitive(true);
        } else {
            bottombar.recordButton.set_label('START');
            topbar.liveIndicator.set_label('OFFLINE');
            topbar.liveIndicator.remove_css_class('destructive-action');
            topbar.liveIndicator.set_sensitive(false);
        }

        bottombar.recordButton.set_label(data.isLive ? 'STOP' : 'START');

        const newSceneLabels = data.scenes.map((scene, index) => {
            const btn = new Gtk.Button({ label: scene });
            if (index !== data.activeSceneIndex) {
                btn.set_opacity(0.5);
            }
            btn.add_css_class("round")
            return btn;
        });

        for (const btn of topbar.sceneButtons) {
            topbar.sceneBtnContainer.remove(btn);
        }

        topbar.sceneButtons = newSceneLabels;

        for (const btn of newSceneLabels) {
            topbar.sceneBtnContainer.append(btn);
        }
    }

    function eventHandler() {
        // On record button click
        bottombar.recordButton.connect('clicked', () => {
            let action = data.isLive ? 'stop' : 'start';

            const dialog = new Adwaita.MessageDialog({
                transient_for: window,
                modal: true,
            });
            dialog.set_heading('Confirm Action');
            dialog.set_body(`Do you wish to ${action} the broadcast?`);
            dialog.add_response('cancel', 'Cancel');
            dialog.add_response('confirm', action === 'start' ? 'Start' : 'Stop');
            dialog.set_default_response('cancel');
            dialog.connect('response', (d, response) => {
                if (response === 'confirm') {
                    data.isLive = !data.isLive;
                    refreshUI();
                }
                d.destroy();
            });

            dialog.show();
        });

        // On scene button click
        topbar.sceneButtons.forEach((btn, index) => {
            btn.connect('clicked', () => {
                data.activeSceneIndex = index;
                refreshUI();
            });
        });

        // On add new scene button click
        topbar.addNewSceneBtn.connect('clicked', () => {
            const dialog = createInputDialog(
                window,
                'Add New Scene',
                'Enter a name for the new scene:',
                'Scene Name',
                (text) => {
                    if (text.length <= 0) {
                        const errorDialog = createErrorDialog(window, 'Invalid Scene Name', 'Scene name cannot be empty.');
                        errorDialog.show();
                        return;
                    }
                    data.scenes.push(text);
                    data.activeSceneIndex = data.scenes.length - 1;
                    refreshUI();
                }
            );
            dialog.show();
        });

        // On remove current scene button click
        topbar.removeCurrentSceneBtn.connect('clicked', () => {
            if (data.scenes.length <= 1) {
                const errorDialog = createErrorDialog(window, 'Cannot Remove Scene', 'At least one scene must exist.');
                errorDialog.show();
                return;
            }

            const dialog = createConfirmationDialog(
                window,
                `Are you sure you want to remove the current scene "${data.scenes[data.activeSceneIndex]}"?`,
                () => {
                    data.scenes.splice(data.activeSceneIndex, 1);
                    if (data.activeSceneIndex >= data.scenes.length) {
                        data.activeSceneIndex = data.scenes.length - 1;
                    }
                    refreshUI();
                }
            );
            dialog.show();
        });

        // On settings button click
        bottombar.settingsButton.connect('clicked', () => {
            if (data.isLive) {
                const errorDialog = createErrorDialog(window, 'Cannot Open Settings', 'Please stop the broadcast before changing settings.');
                errorDialog.show();
                return;
            }
            const dialog = createPreferencesDialog(window);
            dialog.show();
        });
    }


    eventHandler();

});

app.run([]);