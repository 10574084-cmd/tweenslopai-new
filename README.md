# TweenSlop AI — Animation Lab

A static browser-based animation editor with an on-device computer-vision model.

## Current prototype

- **Automatic mode:** imports a video, samples up to six frames locally, and analyzes them with MediaPipe Object Detector.
- **Manual mode:** imports several still images and analyzes up to six representative images.
- **Local vision AI:** EfficientDet-Lite0 detects common objects and their bounding boxes in the browser. A motion planner maps detections and changes between frames to animation events.
- **Audio:** preserve the video's original audio, replace it with an imported track, or mix both. Manual mode uses imported audio.
- **Effects:** combo, bounce, spin, zoom, shake, ghost trail and rainbow glow.
- **Export:** WebM through browser MediaRecorder when supported.

## How the local AI works

The page loads MediaPipe Tasks Vision from jsDelivr and the EfficientDet-Lite0 int8 model from Google's MediaPipe model storage. Inference runs in the browser. Videos, images and audio are not uploaded to a model API.

The detector recognizes a fixed set of common object categories (COCO) and returns category labels, confidence scores and bounding boxes. The app uses those detections to create a simple animation plan. It is a genuine trained vision model, but it is **not** a generative chat model and does not understand arbitrary characters or produce new video frames.

The first model load needs an internet connection. The model is around 4.6 MB; the WebAssembly runtime is loaded separately. Supported browser/device performance varies. GPU is tried first, with CPU fallback.

## GitHub Pages

1. Open **Settings → Pages**.
2. Choose **Deploy from a branch**.
3. Select branch `main` and folder `/(root)`.
4. Save and wait for publishing.

Site URL: https://10574084-cmd.github.io/tweenslopai-new/

## Current limitations

- The video is sampled at up to six points, not processed continuously frame by frame.
- Detection covers common COCO categories only. Small, obscured, stylized or unusual characters may not be detected.
- The current renderer applies effects to the whole frame; bounding-box subject isolation and per-object motion are future work.
- Beat sync remains a basic local pulse, not a dedicated music beat detector.
- Manual clips currently last 1.25 seconds each; editable multi-track keyframes are future work.
- Export is WebM. MP4 export is not included.
- Large videos can use substantial memory. Short clips are recommended.

## Privacy

The selected media stays in the browser in this version. The JavaScript library and model weights are downloaded from their published hosting locations, but the video/image/audio content is not sent to an AI API.
