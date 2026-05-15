import Gio from 'gi://Gio';

const settings = new Gio.Settings({ schemaId: 'com.tinarskii.broadcast' });
const SCENES_KEY = 'scenes-data';

const placementOptions = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center-left', label: 'Center Left' },
    { id: 'center', label: 'Center' },
    { id: 'center-right', label: 'Center Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' },
    { id: 'custom', label: 'Custom (Drag on preview)' },
];

const sizeOptions = [
    { id: 'small', label: 'Small', value: 32 },
    { id: 'medium', label: 'Medium', value: 48 },
    { id: 'large', label: 'Large', value: 64 },
    { id: 'huge', label: 'Huge', value: 96 },
];

const colorOptions = [
    { id: 'black', label: 'Black' },
    { id: 'white', label: 'White' },
    { id: 'red', label: 'Red' },
    { id: 'green', label: 'Green' },
    { id: 'blue', label: 'Blue' },
    { id: 'yellow', label: 'Yellow' },
];

const weightOptions = [
    { id: 'regular', label: 'Regular' },
    { id: 'bold', label: 'Bold' },
];

export function getPlacementOptions() {
    return placementOptions;
}

export function getSizeOptions() {
    return sizeOptions;
}

export function getColorOptions() {
    return colorOptions;
}

export function getWeightOptions() {
    return weightOptions;
}

export function getPlacementLabel(id) {
    return placementOptions.find((item) => item.id === id)?.label ?? 'Center';
}

export function getSizeLabel(value) {
    const option = sizeOptions.find((item) => item.value === value);
    return option ? option.label : `${value}px`;
}

function hasScenesKey() {
    return settings.list_keys().includes(SCENES_KEY);
}

function isValidPlacement(value) {
    return placementOptions.some((item) => item.id === value);
}

function isValidColor(value) {
    return colorOptions.some((item) => item.id === value);
}

function isValidWeight(value) {
    return weightOptions.some((item) => item.id === value);
}

function parseColorName(color) {
    if (Array.isArray(color) && color.length >= 3) return 'black';
    return isValidColor(color) ? color : 'black';
}

export function makeDefaultTextElement(text) {
    return {
        type: 'text',
        text,
        placement: 'center',
        fontSize: 64,
        fontWeight: 'regular',
        color: 'black',
        x: 48,
        y: 120,
    };
}

export function makeScene(name) {
    return {
        name,
        elements: [makeDefaultTextElement(name)],
    };
}

function normalizeElement(element) {
    const base = makeDefaultTextElement('Text');
    if (!element || typeof element !== 'object') return base;
    if (element.type !== 'text') return base;
    const text = typeof element.text === 'string' && element.text.trim() ? element.text.trim() : 'Text';
    const fontSize = Number.isFinite(element.fontSize) && element.fontSize > 0 ? Math.round(element.fontSize) : base.fontSize;
    const placement = isValidPlacement(element.placement) ? element.placement : base.placement;
    const fontWeight = isValidWeight(element.fontWeight) ? element.fontWeight : base.fontWeight;
    const color = parseColorName(element.color);
    const x = Number.isFinite(element.x) ? Math.round(element.x) : base.x;
    const y = Number.isFinite(element.y) ? Math.round(element.y) : base.y;
    return {
        type: 'text',
        text,
        placement,
        fontSize,
        fontWeight,
        color,
        x,
        y,
    };
}

function normalizeScene(scene, index) {
    const fallbackName = `Scene ${index + 1}`;
    const name = typeof scene?.name === 'string' && scene.name.trim() ? scene.name.trim() : fallbackName;
    const rawElements = Array.isArray(scene?.elements) ? scene.elements : [];
    const elements = rawElements.map((item) => normalizeElement(item)).filter(Boolean);
    if (elements.length === 0) {
        elements.push(makeDefaultTextElement(name));
    }
    return { name, elements };
}

export function loadScenes() {
    const defaults = [makeScene('Scene 1'), makeScene('Scene 2'), makeScene('Scene 3')];
    if (!hasScenesKey()) return defaults;
    const raw = settings.get_string(SCENES_KEY);
    if (!raw?.trim()) return defaults;
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return defaults;
        return parsed.map((item, index) => normalizeScene(item, index));
    } catch {
        return defaults;
    }
}

export function saveScenes(scenes) {
    if (!hasScenesKey()) return;
    settings.set_string(SCENES_KEY, JSON.stringify(scenes));
}
