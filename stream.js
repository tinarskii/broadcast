import Gst from 'gi://Gst?version=1.0';
import GLib from 'gi://GLib?version=2.0';
import { currentFrame } from './elements/createPreviewArea.js';
import { getStreamConfig } from './streamConfig.js';

Gst.init(null);

let pipeline = null;
let pushFrameSource = null;
let bus = null;

function cleanupStream() {
    if (pushFrameSource) {
        GLib.source_remove(pushFrameSource);
        pushFrameSource = null;
    }
    if (pipeline) {
        pipeline.set_state(Gst.State.NULL);
        pipeline = null;
    }
    if (bus) {
        bus.remove_signal_watch();
        bus = null;
    }
}

export function startStream() {
    if (pipeline) cleanupStream();

    const { resolution, frameRate, videoBitrate, streamURL, streamKey, location } = getStreamConfig();
    if (!streamURL.trim() || !streamKey.trim()) {
        logError(new Error('Missing stream URL or stream key'), 'Stream Error');
        return false;
    }

    pipeline = Gst.parse_launch(`
        appsrc name=src format=time is-live=true 
        caps=video/x-raw,format=RGB,width=${resolution.width},height=${resolution.height},framerate=${frameRate}/1 
        ! queue
        ! videoconvert 
        ! x264enc tune=zerolatency bitrate=${videoBitrate} 
        ! queue
        ! flvmux streamable=true 
        ! queue
        ! rtmp2sink location="${location}"
    `);
    const appsrc = Gst.Bin.prototype.get_by_name.call(pipeline, 'src');

    const caps = Gst.Caps.from_string(
        `video/x-raw,format=RGB,width=${resolution.width},height=${resolution.height},framerate=${frameRate}/1`
    );
    appsrc.set_property('caps', caps);
    appsrc.set_property('format', Gst.Format.TIME);
    appsrc.set_property('is-live', true);
    appsrc.set_property('block', true);
    appsrc.set_property('max-bytes', resolution.width * resolution.height * 3 * 2);

    bus = pipeline.get_bus();
    bus.add_signal_watch();
    bus.connect('message::error', (bus, msg) => {
        const [err, debug] = msg.parse_error();
        logError(err, "Stream Error");
        log(debug);
        cleanupStream();
    });
    bus.connect('message::warning', (bus, msg) => {
        const [warn, debug] = msg.parse_warning();
        log(`Stream warning: ${warn.message}`);
        if (debug) log(debug);
    });
    bus.connect('message::state-changed', (bus, msg) => {
        if (msg.src !== pipeline) return;
        const [oldState, newState] = msg.parse_state_changed();
        log(`Pipeline state changed from ${Gst.Element.state_get_name(oldState)} to ${Gst.Element.state_get_name(newState)}`);
    });
    bus.connect('message::eos', () => {
        log('Stream ended (EOS).');
        cleanupStream();
    });

    pipeline.set_state(Gst.State.PLAYING);

    let frameCount = 0;
    pushFrameSource = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000 / frameRate, () => {
        const frame = currentFrame;
        if (!frame?.bytes) return GLib.SOURCE_CONTINUE;
        if (frame.width !== resolution.width || frame.height !== resolution.height) {
            return GLib.SOURCE_CONTINUE;
        }

        const buffer = Gst.Buffer.new_wrapped(frame.bytes);
        const duration = 1000000000n / BigInt(frameRate);
        buffer.pts = BigInt(frameCount) * duration;
        buffer.duration = duration;
        frameCount++;

        const flowReturn = appsrc.emit('push-buffer', buffer);
        if (flowReturn !== Gst.FlowReturn.OK) {
            log(`Stopping frame push due to flow return: ${flowReturn}`);
            cleanupStream();
            return GLib.SOURCE_REMOVE;
        }
        return GLib.SOURCE_CONTINUE;
    });

    return true;
}

export function endStream() {
    cleanupStream();
    return true;
}
