import Gtk from 'gi://Gtk?version=4.0';

export function createPreviewArea() {
    const preview = new Gtk.DrawingArea({
        hexpand: true,
        vexpand: true,
    });

    preview.set_draw_func((area, ctx, width, height) => {
        ctx.setSourceRGB(0, 0, 0);
        ctx.paint();

        const targetWidth = width;
        const targetHeight = targetWidth * 9 / 16;

        let drawWidth = targetWidth;
        let drawHeight = targetHeight;

        if (drawHeight > height) {
            drawHeight = height;
            drawWidth = drawHeight * 16 / 9;
        }

        const x = (width - drawWidth) / 2;
        const y = (height - drawHeight) / 2;

        ctx.setSourceRGB(0, 1, 0);
        ctx.rectangle(x, y, drawWidth, drawHeight);
        ctx.fill();
    });

    return { widget: preview, preview };
}