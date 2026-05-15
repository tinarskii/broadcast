import Gtk from 'gi://Gtk?version=4.0';
import Adwaita from 'gi://Adw?version=1';
import { data } from '../index.js';
import { createErrorDialog, createInputDialog } from './createDialog.js';
import {
    getColorOptions,
    getPlacementLabel,
    getPlacementOptions,
    getWeightOptions,
    makeDefaultTextElement,
} from '../sceneStore.js';

function getActiveScene() {
    return data.scenes[data.activeSceneIndex];
}

function colorLabel(id) {
    return getColorOptions().find((item) => item.id === id)?.label ?? 'Black';
}

function weightLabel(id) {
    return getWeightOptions().find((item) => item.id === id)?.label ?? 'Regular';
}

export function showElementsDialog(window, onChanged) {
    const dialog = new Adwaita.MessageDialog({
        transient_for: window,
        modal: true,
    });
    dialog.set_heading('Elements');
    dialog.set_body(`Scene: ${getActiveScene()?.name ?? '-'}`);
    dialog.add_response('close', 'Close');
    dialog.set_default_response('close');
    dialog.connect('response', (d) => d.destroy());

    const root = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        margin_top: 8,
        margin_bottom: 8,
    });

    const list = new Gtk.ListBox({
        selection_mode: Gtk.SelectionMode.SINGLE,
        vexpand: true,
    });
    list.set_size_request(540, 280);

    const actions = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 6,
        homogeneous: true,
    });
    const addButton = new Gtk.Button({ label: 'Add Text' });
    const removeButton = new Gtk.Button({ label: 'Remove' });
    const upButton = new Gtk.Button({ label: 'Up' });
    const downButton = new Gtk.Button({ label: 'Down' });
    const configButton = new Gtk.Button({ label: 'Configure' });
    actions.append(addButton);
    actions.append(removeButton);
    actions.append(upButton);
    actions.append(downButton);
    actions.append(configButton);

    root.append(list);
    root.append(actions);
    dialog.set_extra_child(root);

    function selectedIndex() {
        const row = list.get_selected_row();
        return row ? row.get_index() : null;
    }

    function createDropDown(options, selectedId) {
        const labels = new Gtk.StringList();
        options.forEach((item) => labels.append(item.label));
        const dropdown = new Gtk.DropDown({ model: labels });
        const selectedIndex = options.findIndex((item) => item.id === selectedId);
        dropdown.set_selected(selectedIndex >= 0 ? selectedIndex : 0);
        return dropdown;
    }

    function createLabeledRow(labelText, child) {
        const row = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 8,
        });
        const label = new Gtk.Label({
            label: labelText,
            xalign: 0,
            width_chars: 8,
        });
        child.set_hexpand(true);
        row.append(label);
        row.append(child);
        return row;
    }

    function setRowSelectedByIndex(index) {
        if (index === null) {
            data.selectedElementIndex = null;
            return;
        }
        const row = list.get_row_at_index(index);
        if (!row) {
            data.selectedElementIndex = null;
            return;
        }
        list.select_row(row);
        data.selectedElementIndex = index;
    }

    function refreshList(preferredSelection = null) {
        let row = list.get_first_child();
        while (row) {
            const next = row.get_next_sibling();
            list.remove(row);
            row = next;
        }

        const scene = getActiveScene();
        if (!scene?.elements) {
            data.selectedElementIndex = null;
            onChanged();
            return;
        }

        scene.elements.forEach((element, index) => {
            const label = new Gtk.Label({
                xalign: 0,
                label: `${index + 1}. "${element.text ?? ''}"  •  ${getPlacementLabel(element.placement)}  •  ${element.fontSize ?? 48}px  •  ${weightLabel(element.fontWeight)}  •  ${colorLabel(element.color)}`,
            });
            const row = new Gtk.ListBoxRow();
            row.set_child(label);
            list.append(row);
        });

        let nextSelection = preferredSelection;
        if (nextSelection === null) nextSelection = data.selectedElementIndex;
        if (nextSelection !== null && scene.elements[nextSelection]) {
            setRowSelectedByIndex(nextSelection);
        } else {
            data.selectedElementIndex = null;
        }

        onChanged();
    }

    list.connect('row-selected', (_, row) => {
        data.selectedElementIndex = row ? row.get_index() : null;
        onChanged();
    });

    addButton.connect('clicked', () => {
        const input = createInputDialog(
            window,
            'Add Text Element',
            'Text content:',
            'Type text',
            (text) => {
                if (!text) {
                    const err = createErrorDialog(window, 'Invalid Text', 'Text cannot be empty.');
                    err.show();
                    return;
                }
                const scene = getActiveScene();
                scene.elements.push(makeDefaultTextElement(text));
                refreshList(scene.elements.length - 1);
            }
        );
        input.show();
    });

    removeButton.connect('clicked', () => {
        const index = selectedIndex();
        if (index === null) return;
        const scene = getActiveScene();
        scene.elements.splice(index, 1);
        const next = index >= scene.elements.length ? scene.elements.length - 1 : index;
        refreshList(next >= 0 ? next : null);
    });

    upButton.connect('clicked', () => {
        const index = selectedIndex();
        if (index === null || index <= 0) return;
        const scene = getActiveScene();
        [scene.elements[index - 1], scene.elements[index]] = [scene.elements[index], scene.elements[index - 1]];
        refreshList(index - 1);
    });

    downButton.connect('clicked', () => {
        const index = selectedIndex();
        const scene = getActiveScene();
        if (index === null || index >= scene.elements.length - 1) return;
        [scene.elements[index + 1], scene.elements[index]] = [scene.elements[index], scene.elements[index + 1]];
        refreshList(index + 1);
    });

    configButton.connect('clicked', () => {
        const index = selectedIndex();
        if (index === null) return;
        const scene = getActiveScene();
        const element = scene.elements[index];

        const configDialog = new Adwaita.MessageDialog({
            transient_for: window,
            modal: true,
        });
        configDialog.set_heading('Configure Text');
        configDialog.set_body('Edit text appearance and placement');
        configDialog.add_response('cancel', 'Cancel');
        configDialog.add_response('save', 'Save');
        configDialog.set_default_response('save');

        const form = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 8,
        });
        form.set_size_request(620, -1);
        const textEntry = new Gtk.Entry({ text: element.text ?? '' });
        const placementOptions = getPlacementOptions();
        const weightOptions = getWeightOptions();
        const colorOptions = getColorOptions();
        const placementDropdown = createDropDown(placementOptions, element.placement ?? 'center');
        const weightDropdown = createDropDown(weightOptions, element.fontWeight ?? 'regular');
        const colorDropdown = createDropDown(colorOptions, element.color ?? 'black');
        const fontSizeAdjustment = new Gtk.Adjustment({
            lower: 12,
            upper: 1000,
            step_increment: 1,
            page_increment: 24,
            value: element.fontSize ?? 48,
        });
        const fontSizeScale = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            draw_value: false,
            hexpand: true,
            adjustment: fontSizeAdjustment,
        });
        const fontSizeSpin = new Gtk.SpinButton({
            adjustment: fontSizeAdjustment,
            digits: 0,
            numeric: true,
        });
        fontSizeSpin.set_width_chars(6);
        fontSizeScale.set_size_request(440, -1);
        const fontSizeRow = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 8,
        });
        fontSizeRow.append(fontSizeScale);
        fontSizeRow.append(fontSizeSpin);
        fontSizeScale.connect('value-changed', () => {
            const value = Math.round(fontSizeScale.get_value());
            if (fontSizeSpin.get_value_as_int() !== value) {
                fontSizeSpin.set_value(value);
            }
        });
        fontSizeSpin.connect('value-changed', () => {
            const value = fontSizeSpin.get_value_as_int();
            if (Math.round(fontSizeScale.get_value()) !== value) {
                fontSizeScale.set_value(value);
            }
        });
        textEntry.set_placeholder_text('Text');
        form.append(createLabeledRow('Text', textEntry));
        form.append(createLabeledRow('Placement', placementDropdown));
        form.append(createLabeledRow('Size (px)', fontSizeRow));
        form.append(createLabeledRow('Weight', weightDropdown));
        form.append(createLabeledRow('Color', colorDropdown));
        configDialog.set_extra_child(form);

        configDialog.connect('response', (d, response) => {
            if (response === 'save') {
                const nextText = textEntry.get_text().trim();
                const nextPlacement = placementOptions[placementDropdown.get_selected()]?.id ?? 'center';
                const nextWeight = weightOptions[weightDropdown.get_selected()]?.id ?? 'regular';
                const nextColor = colorOptions[colorDropdown.get_selected()]?.id ?? 'black';
                const nextFont = fontSizeSpin.get_value_as_int();

                if (!nextText) {
                    const err = createErrorDialog(window, 'Invalid Text', 'Text cannot be empty.');
                    err.show();
                    d.destroy();
                    return;
                }
                if (!Number.isFinite(nextFont) || nextFont < 12 || nextFont > 1000) {
                    const err = createErrorDialog(window, 'Invalid Size', 'Font size must be between 12px and 1000px.');
                    err.show();
                    d.destroy();
                    return;
                }

                element.text = nextText;
                element.placement = nextPlacement;
                element.fontSize = nextFont;
                element.fontWeight = nextWeight;
                element.color = nextColor;
                refreshList(index);
            }
            d.destroy();
        });

        configDialog.show();
    });

    refreshList();
    dialog.show();
}
