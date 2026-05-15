import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';
import Adwaita from 'gi://Adw?version=1';

const settings = new Gio.Settings({ schemaId: "com.tinarskii.broadcast" });
const videoResolutionOptions = [
    "480p (SD)",
    "720p (HD)",
    "1080p (Full HD)",
    "1440p (QHD)",
    "2160p (4K)"
];

const frameRateOptions = [
    "24 Fps",
    "30 Fps",
    "60 Fps",
    "120 Fps"
];

const videoQualityOptions = [
    "1200kbps (Low)",
    "3000kbps (Fair)",
    "4500kbps (Standard)",
    "6000kbps (High)",
    "8000kbps (Very High)"
];

const audioQualityOptions = [
    "96kbps (Low)",
    "160kbps (Standard)",
    "192kbps (High)",
    "256kbps (Very High)"
];
const defaultIngestURL = [
    {
        label: "Twitch",
        url: "rtmp://ingest.global-contribute.live-video.net/app/"
    },
    {
        label: "Kick",
        url: "rtmps://fa723fc1b171.global-contribute.live-video.net/app/"
    },
    {
        label: "YouTube",
        url: "rtmp://a.rtmp.youtube.com/live2"
    },
    {
        label: "Other (choose)",
        url: ""
    }

]

export function createPreferencesDialog(parent) {
    const dialog = new Adwaita.PreferencesDialog({ title: "Settings" });
    const page = new Adwaita.PreferencesPage();
    dialog.add(page);

    const streamingGroup = new Adwaita.PreferencesGroup({ title: 'Streaming' });
    page.add(streamingGroup);

    const outputGroup = new Adwaita.PreferencesGroup({ title: 'Output' });
    page.add(outputGroup);

    // == Streaming Settings ==
    const streamKeyRow = new Adwaita.PasswordEntryRow({ title: 'Stream Key' });
    streamKeyRow.set_text(settings.get_string('stream-key'));

    const streamURLRow = new Adwaita.EntryRow({ title: 'Stream URL' });
    streamURLRow.set_text(settings.get_string('stream-url'));

    const urlCombo = new Adwaita.ComboRow({ title: 'Platform' });
    const urlStore = new Gtk.StringList();
    defaultIngestURL.forEach(item => urlStore.append(item.label));
    urlCombo.set_model(urlStore);
    const currentURL = settings.get_string('stream-url');
    const matchedIndex = defaultIngestURL.findIndex(item => item.url === currentURL);
    urlCombo.set_selected(matchedIndex >= 0 ? matchedIndex : defaultIngestURL.length - 1);
    streamURLRow.set_sensitive(matchedIndex === -1 || streamURLRow.get_text() === "");

    urlCombo.connect('notify::selected', (row) => {
        const selectedIndex = row.get_selected();
        if (selectedIndex >= 0 && selectedIndex < defaultIngestURL.length) {
            const selectedURL = defaultIngestURL[selectedIndex].url;
            streamURLRow.set_text(selectedURL);
            streamURLRow.set_sensitive(selectedURL === "");
            settings.set_string('stream-url', selectedURL);
        }
    });

    streamingGroup.add(streamKeyRow);
    streamingGroup.add(urlCombo);
    streamingGroup.add(streamURLRow);
    // == 

    // == Output Settings ==
    const outputResolutionRow = new Adwaita.ComboRow({ title: 'Output Resolution' });
    const resolutionStore = new Gtk.StringList();
    videoResolutionOptions.forEach(res => resolutionStore.append(res));
    outputResolutionRow.set_model(resolutionStore);
    const currentResolution = settings.get_string('video-resolution');
    const currentIndex = videoResolutionOptions.indexOf(currentResolution);
    outputResolutionRow.set_selected(currentIndex >= 0 ? currentIndex : 0);

    const outputAudioRow = new Adwaita.ComboRow({ title: 'Output Audio Quality' });
    const audioStore = new Gtk.StringList();
    audioQualityOptions.forEach(audio => audioStore.append(audio));
    outputAudioRow.set_model(audioStore);
    const currentAudioQuality = settings.get_string('audio-quality');
    const currentAudioIndex = audioQualityOptions.indexOf(currentAudioQuality);
    outputAudioRow.set_selected(currentAudioIndex >= 0 ? currentAudioIndex : 0);

    const outputVideoRow = new Adwaita.ComboRow({ title: 'Output Video Quality' });
    const videoStore = new Gtk.StringList();
    videoQualityOptions.forEach(video => videoStore.append(video));
    outputVideoRow.set_model(videoStore);
    const currentVideoQuality = settings.get_string('video-quality');
    const currentVideoIndex = videoQualityOptions.indexOf(currentVideoQuality);
    outputVideoRow.set_selected(currentVideoIndex >= 0 ? currentVideoIndex : 0);

    const outputFrameRateRow = new Adwaita.ComboRow({ title: 'Output Frame Rate' });
    const frameRateStore = new Gtk.StringList();
    frameRateOptions.forEach(rate => frameRateStore.append(rate));
    outputFrameRateRow.set_model(frameRateStore);
    const currentFrameRate = settings.get_string('frame-rate');
    const currentFrameRateIndex = frameRateOptions.indexOf(currentFrameRate);
    outputFrameRateRow.set_selected(currentFrameRateIndex >= 0 ? currentFrameRateIndex : 0);

    outputGroup.add(outputResolutionRow);
    outputGroup.add(outputFrameRateRow);
    outputGroup.add(outputVideoRow);
    outputGroup.add(outputAudioRow);
    // ==

    // == On edit handlers ==
    streamKeyRow.connect('changed', (entry) => {
        const newKey = entry.get_text().trim();
        settings.set_string('stream-key', newKey);
    });
    streamURLRow.connect('changed', (entry) => {
        const newURL = entry.get_text().trim();
        settings.set_string('stream-url', newURL);
    });
    outputResolutionRow.connect('notify::selected', (row) => {
        const selectedIndex = row.get_selected();

        if (selectedIndex >= 0 && selectedIndex < videoResolutionOptions.length) {
            const newResolution = videoResolutionOptions[selectedIndex];
            settings.set_string('video-resolution', newResolution);
        }
    });
    outputAudioRow.connect('notify::selected', (row) => {
        const selectedIndex = row.get_selected();
        if (selectedIndex >= 0 && selectedIndex < audioQualityOptions.length) {
            const newAudioQuality = audioQualityOptions[selectedIndex];
            settings.set_string('audio-quality', newAudioQuality);
        }
    });
    outputVideoRow.connect('notify::selected', (row) => {
        const selectedIndex = row.get_selected();
        if (selectedIndex >= 0 && selectedIndex < videoQualityOptions.length) {
            const newVideoQuality = videoQualityOptions[selectedIndex];
            settings.set_string('video-quality', newVideoQuality);
        }
    });
    outputFrameRateRow.connect('notify::selected', (row) => {
        const selectedIndex = row.get_selected();
        if (selectedIndex >= 0 && selectedIndex < frameRateOptions.length) {
            const newFrameRate = frameRateOptions[selectedIndex];
            settings.set_string('frame-rate', newFrameRate);
        }
    });
    // ==

    dialog.present(parent);
    return dialog;
}