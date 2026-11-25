# TweenSlop AI — Animation Lab

A static browser-based prototype for a two-mode Tweenslop animation editor.

## Current prototype

- **Automatic mode:** imports one video and previews it on a canvas with motion presets.
- **Manual mode:** imports multiple still images and sequences them as 1.25-second clips.
- **Audio:** preserve the video's original audio, replace it with an imported track, or mix both. Manual mode uses the imported audio.
- **Effects:** Tweenslop combo, bounce, spin, zoom punch, shake, ghost trail and rainbow glow.
- **Export:** records the canvas as a WebM file using browser MediaRecorder support.

## GitHub Pages

This repository is designed to publish directly from the root of the `main` branch:

1. Open **Settings → Pages**.
2. Choose **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**.
4. Save and wait for Pages to publish.

Site URL: https://10574084-cmd.github.io/tweenslopai-new/

## Current limitations

This is an editor prototype, not a completed AI video generator.

- Automatic mode currently uses local animation presets. It does not yet call an AI model or semantically understand the contents of a video.
- Beat sync is a simple rhythmic visual pulse, not a dedicated beat-detection model.
- Manual image clips currently last 1.25 seconds each; a multi-track timeline and per-clip keyframes are future work.
- Export is WebM. MP4 export is not included.
- Large videos can use substantial memory. Short clips are recommended.
- Supported video/audio codecs depend on the browser. Chromium-based browsers are recommended.

## Planned next modules

1. AI scene and subject analysis.
2. Automatic frame extraction and subject segmentation.
3. Beat detection from imported audio.
4. Editable multi-track timeline and per-clip keyframes.
5. MP4 encoding and advanced export settings.
6. A secure backend integration for AI inference. API keys must stay server-side.

All media in this prototype is processed locally in the browser. The current version does not upload user media to an AI service.
