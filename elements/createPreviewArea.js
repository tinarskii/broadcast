import Gtk from 'gi://Gtk?version=4.0';
import Cairo from 'cairo';
import Gdk from 'gi://Gdk?version=4.0';
import { getStreamConfig } from '../streamConfig.js';
import { data } from '../index.js';

export let currentFrame = null;

export function getCurrentFrame() {
    return currentFrame;
}

function resolveColor(colorName) {
    const colors = {
        black: [0, 0, 0, 1],
        white: [1, 1, 1, 1],
        red: [0.85, 0.1, 0.1, 1],
        green: [0.1, 0.65, 0.2, 1],
        blue: [0.1, 0.35, 0.9, 1],
        yellow: [0.95, 0.75, 0.1, 1],
    };
    return colors[colorName] ?? colors.black;
}

function getTextRect(element, streamWidth, streamHeight) {
    const fontSize = element.fontSize ?? 48;
    const text = element.text ?? '';
    const textWidth = text.length * fontSize * 0.6;
    const textHeight = fontSize;
    const padding = 48;
    const placement = element.placement ?? 'center';

    if (placement === 'custom') {
        const customX = element.x ?? 40;
        const customY = element.y ?? 80;
        return {
            left: customX,
            top: customY - textHeight,
            width: textWidth,
            height: textHeight,
            baselineY: customY,
        };
    }

    const leftMap = {
        left: padding,
        center: (streamWidth - textWidth) / 2,
        right: streamWidth - padding - textWidth,
    };
    const baselineMap = {
        top: padding + textHeight,
        center: streamHeight / 2 + textHeight / 2,
        bottom: streamHeight - padding,
    };

    const horizontal = placement.endsWith('left') ? 'left' : placement.endsWith('right') ? 'right' : 'center';
    const vertical = placement.startsWith('top') ? 'top' : placement.startsWith('bottom') ? 'bottom' : 'center';
    const left = leftMap[horizontal];
    const baselineY = baselineMap[vertical];

    return {
        left,
        top: baselineY - textHeight,
        width: textWidth,
        height: textHeight,
        baselineY,
    };
}

export function createPreviewArea() {
    const preview = new Gtk.DrawingArea({
        hexpand: true,
        vexpand: true,
    });

    let dragElementIndex = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let dragStartX = 0;
    let dragStartY = 0;

    function getRenderMetrics(widgetWidth, widgetHeight, streamWidth, streamHeight) {
        const scaleX = widgetWidth / streamWidth;
        const scaleY = widgetHeight / streamHeight;
        const scale = Math.min(scaleX, scaleY);
        const drawWidth = streamWidth * scale;
        const drawHeight = streamHeight * scale;
        const offsetX = (widgetWidth - drawWidth) / 2;
        const offsetY = (widgetHeight - drawHeight) / 2;
        return { scale, drawWidth, drawHeight, offsetX, offsetY };
    }

    function mapWidgetToStream(widgetX, widgetY) {
        const { resolution } = getStreamConfig();
        const streamWidth = resolution.width;
        const streamHeight = resolution.height;
        const widgetWidth = preview.get_width();
        const widgetHeight = preview.get_height();
        const metrics = getRenderMetrics(widgetWidth, widgetHeight, streamWidth, streamHeight);
        const streamX = (widgetX - metrics.offsetX) / metrics.scale;
        const streamY = (widgetY - metrics.offsetY) / metrics.scale;
        return {
            x: Math.max(0, Math.min(streamWidth, streamX)),
            y: Math.max(0, Math.min(streamHeight, streamY)),
        };
    }

    function pickTextElementAt(streamX, streamY) {
        const activeScene = data.scenes[data.activeSceneIndex];
        if (!activeScene?.elements) return null;
        const { resolution } = getStreamConfig();
        const streamWidth = resolution.width;
        const streamHeight = resolution.height;

        for (let i = activeScene.elements.length - 1; i >= 0; i--) {
            const element = activeScene.elements[i];
            if (element.type !== 'text' || !element.text) continue;
            const rect = getTextRect(element, streamWidth, streamHeight);
            if (streamX >= rect.left && streamX <= rect.left + rect.width && streamY >= rect.top && streamY <= rect.top + rect.height) {
                return i;
            }
        }

        return null;
    }

    const drag = Gtk.GestureDrag.new();
    drag.connect('drag-begin', (_, startX, startY) => {
        dragStartX = startX;
        dragStartY = startY;
        const pointer = mapWidgetToStream(startX, startY);
        const pickedIndex = pickTextElementAt(pointer.x, pointer.y);
        if (pickedIndex === null) {
            data.selectedElementIndex = null;
            dragElementIndex = null;
            preview.queue_draw();
            return;
        }

        data.selectedElementIndex = pickedIndex;
        dragElementIndex = pickedIndex;
        const activeScene = data.scenes[data.activeSceneIndex];
        const element = activeScene.elements[pickedIndex];
        const { resolution } = getStreamConfig();
        const rect = getTextRect(element, resolution.width, resolution.height);
        dragOffsetX = pointer.x - rect.left;
        dragOffsetY = pointer.y - rect.baselineY;
        element.placement = 'custom';
        preview.queue_draw();
    });
    drag.connect('drag-update', (_, offsetX, offsetY) => {
        if (dragElementIndex === null) return;
        const pointer = mapWidgetToStream(dragStartX + offsetX, dragStartY + offsetY);
        const activeScene = data.scenes[data.activeSceneIndex];
        const element = activeScene?.elements?.[dragElementIndex];
        if (!element) return;
        element.x = Math.round(pointer.x - dragOffsetX);
        element.y = Math.round(pointer.y - dragOffsetY);
        if (typeof data.persistScenes === 'function') {
            data.persistScenes();
        }
        preview.queue_draw();
    });
    drag.connect('drag-end', () => {
        dragElementIndex = null;
    });
    preview.add_controller(drag);

    preview.set_draw_func((area, ctx, width, height) => {
        // Always render at stream resolution
        const { resolution } = getStreamConfig();
        const streamWidth = resolution.width;
        const streamHeight = resolution.height;

        const surface = new Cairo.ImageSurface(Cairo.Format.RGB24, streamWidth, streamHeight);
        const offCtx = new Cairo.Context(surface);

        offCtx.setSourceRGB(0, 0, 0);
        offCtx.paint();

        offCtx.setSourceRGB(1, 1, 1); // white
        offCtx.rectangle(0, 0, streamWidth, streamHeight);
        offCtx.fill();

        const activeScene = data.scenes[data.activeSceneIndex];
        if (activeScene?.elements) {
            for (let i = 0; i < activeScene.elements.length; i++) {
                const element = activeScene.elements[i];
                if (element.type !== 'text') continue;
                if (!element.text) continue;
                offCtx.selectFontFace('Sans', Cairo.FontSlant.NORMAL, element.fontWeight === 'bold' ? Cairo.FontWeight.BOLD : Cairo.FontWeight.NORMAL);
                offCtx.setFontSize(element.fontSize ?? 48);
                const [r, g, b, a] = resolveColor(element.color);
                const rect = getTextRect(element, streamWidth, streamHeight);
                offCtx.setSourceRGBA(r, g, b, a);
                offCtx.moveTo(rect.left, rect.baselineY);
                offCtx.showText(element.text);

                if (i === data.selectedElementIndex) {
                    offCtx.setSourceRGBA(0.15, 0.45, 1, 0.95);
                    offCtx.setLineWidth(2);
                    offCtx.rectangle(rect.left - 4, rect.top - 4, rect.width + 8, rect.height + 8);
                    offCtx.stroke();
                }
            }
        }

        // Scale to fit the widget for display
        const metrics = getRenderMetrics(width, height, streamWidth, streamHeight);

        ctx.save();
        ctx.translate(metrics.offsetX, metrics.offsetY);
        ctx.scale(metrics.scale, metrics.scale);
        ctx.setSourceSurface(surface, 0, 0);
        ctx.paint();
        ctx.restore();

        // Save for streaming at exact resolution
        surface.flush();
        const pixbuf = Gdk.pixbuf_get_from_surface(surface, 0, 0, streamWidth, streamHeight);
        if (pixbuf) {
            const pixels = pixbuf.get_pixels();
            const rowstride = pixbuf.get_rowstride();
            const channels = pixbuf.get_n_channels();
            const frame = new Uint8Array(streamWidth * streamHeight * 3);

            for (let y = 0; y < streamHeight; y++) {
                for (let x = 0; x < streamWidth; x++) {
                    const srcOffset = y * rowstride + x * channels;
                    const dstOffset = (y * streamWidth + x) * 3;
                    frame[dstOffset] = pixels[srcOffset];
                    frame[dstOffset + 1] = pixels[srcOffset + 1];
                    frame[dstOffset + 2] = pixels[srcOffset + 2];
                }
            }

            currentFrame = {
                bytes: frame,
                width: streamWidth,
                height: streamHeight,
            };
        }
    });

    return { widget: preview };
}