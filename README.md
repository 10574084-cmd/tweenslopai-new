# TweenSlop AI — Animation Lab

Static GitHub Pages editor plus an optional Gemini-powered analysis API.

## Frontend

- **Automatic mode:** imports one video, samples up to six frames locally, and sends only those still frames for AI analysis.
- **Manual mode:** imports multiple still images and sends up to six representative images for AI analysis.
- **Audio:** preserve original video audio, replace it with an imported audio track, or mix both. Manual mode uses imported audio.
- **Effects:** combo, bounce, spin, zoom, shake, ghost trail and rainbow glow.
- **Export:** WebM through browser MediaRecorder when supported.

## Enable real Gemini analysis

The AI backend is a Cloudflare Worker. **Do not put the Gemini API key in index.html, GitHub, or any public file.**

1. Create a Gemini API key in Google AI Studio: https://aistudio.google.com/app/apikey
2. In Cloudflare, open **Workers & Pages → Create → Worker**. Create a Worker named `tweenslop-gemini-api`.
3. Open the Worker's **Edit code** view and paste the contents of `worker/index.js`. Deploy it.
4. Open **Settings → Variables and Secrets** for that Worker.
5. Add a secret named `GEMINI_API_KEY` and paste the key there. Save/deploy the updated Worker.
6. Open the Worker's `workers.dev` URL plus `/health`. It should return JSON with `ok: true`.
7. In TweenSlop AI, paste the base Worker URL (without `/api/analyze`) into **Gemini AI backend URL**.
8. Import a video or images and press **Analyze with Gemini**.

The frontend calls `POST /api/analyze`. The Worker sends the sampled JPEG frames to `gemini-3.8-flash` and returns structured animation events. The API key stays in the Cloudflare Worker secret. The Worker currently allows browser requests from `https://10574084-cmd.github.io`.

## Worker files

- `worker/index.js`: Gemini proxy, input limits, CORS and JSON validation.
- `wrangler.toml`: optional Wrangler deployment configuration.

You can deploy using Cloudflare's dashboard editor; Wrangler/terminal is not required for the dashboard method.

## Current AI scope and limitations

- Gemini analyzes **up to six sampled still frames**, not every video frame continuously. This is a visual scene/motion plan, not full frame-by-frame video generation.
- The uploaded video and separate audio are not uploaded as whole files. Only sampled JPEG frames are sent to Gemini. Audio remains in the browser and is played/mixed locally.
- Beat sync is still a simple local pulse; audio-aware beat detection is a future module.
- The current editor applies the returned effects globally during each event window. Per-object masks, subject tracking and editable keyframes are future work.
- Keep clips short for the first prototype. The browser samples at most six frames and the Worker limits requests to 5 MB.
- Gemini API usage is subject to the current account's quotas, model availability and terms. See https://ai.google.dev/gemini-api/docs/models and https://ai.google.dev/gemini-api/docs/pricing.

## GitHub Pages

This repository publishes from the root of `main`:

1. Open **Settings → Pages**.
2. Choose **Deploy from a branch**.
3. Select `main` and `/(root)`, then Save.

Site URL: https://10574084-cmd.github.io/tweenslopai-new/
