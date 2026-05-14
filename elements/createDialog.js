import Gtk from "gi://Gtk?version=4.0";
import Adwaita from 'gi://Adw?version=1';

export function createErrorDialog(window, title, message) {
    const errorDialog = new Adwaita.MessageDialog({
        transient_for: window,
        modal: true,
    });
    errorDialog.set_heading(title);
    errorDialog.set_body(message);
    errorDialog.add_response('ok', 'OK');
    errorDialog.set_default_response('ok');
    errorDialog.connect('response', (ed, er) => {
        ed.destroy();
    });
    return errorDialog;
}

export function createConfirmationDialog(window, message, onConfirm) {
    const confirmDialog = new Adwaita.MessageDialog({
        transient_for: window,
        modal: true,
    });
    confirmDialog.set_heading('Confirm Action');
    confirmDialog.set_body(message);
    confirmDialog.add_response('cancel', 'Cancel');
    confirmDialog.add_response('confirm', 'Confirm');
    confirmDialog.set_default_response('cancel');
    confirmDialog.connect('response', (cd, response) => {
        if (response === 'confirm') {
            onConfirm();
        }
        cd.destroy();
    });
    return confirmDialog;
}

export function createInputDialog(window, title, message, placeholder, onConfirm) {
    const inputDialog = new Adwaita.MessageDialog({
        transient_for: window,
        modal: true,
    });
    inputDialog.set_heading(title);
    inputDialog.set_body(message);
    const entry = new Gtk.Entry();
    entry.set_placeholder_text(placeholder);
    inputDialog.set_extra_child(entry);
    inputDialog.add_response('cancel', 'Cancel');
    inputDialog.add_response('confirm', 'Confirm');
    inputDialog.set_default_response('confirm');
    inputDialog.connect('response', (id, response) => {
        if (response === 'confirm') {
            const text = entry.get_text().trim();
            onConfirm(text);//let caller handle
        }
        id.destroy();
    });
    return inputDialog;
}