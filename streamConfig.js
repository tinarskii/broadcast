import Gio from 'gi://Gio';

const settings = new Gio.Settings({ schemaId: 'com.tinarskii.broadcast' });

export function parseResolution(resolutionLabel) {
    const map = {
        '480p (SD)': { width: 854, height: 480 },
        '720p (HD)': { width: 1280, height: 720 },
        '1080p (Full HD)': { width: 1920, height: 1080 },
        '1440p (QHD)': { width: 2560, height: 1440 },
        '2160p (4K)': { width: 3840, height: 2160 },
    };
    return map[resolutionLabel] ?? map['720p (HD)'];
}

export function buildRtmpLocation(streamURL, streamKey) {
    const url = streamURL.trim();
    const key = streamKey.trim();

    if (!url) return key;
    if (!key) return url;
    if (url.endsWith('/')) return `${url}${key}`;
    return `${url}/${key}`;
}

export function getStreamConfig() {
    const resolution = parseResolution(settings.get_string('video-resolution'));
    const frameRate = parseInt(settings.get_string('frame-rate'), 10);
    const videoBitrate = parseInt(settings.get_string('video-quality'), 10);
    const streamURL = settings.get_string('stream-url');
    const streamKey = settings.get_string('stream-key');
    const location = buildRtmpLocation(streamURL, streamKey);

    return {
        resolution,
        frameRate: Number.isFinite(frameRate) && frameRate > 0 ? frameRate : 30,
        videoBitrate: Number.isFinite(videoBitrate) && videoBitrate > 0 ? videoBitrate : 4500,
        streamURL,
        streamKey,
        location,
    };
}
