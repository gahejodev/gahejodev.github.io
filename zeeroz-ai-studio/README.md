# ZEEROZ AI STUDIO

Standalone source repository for the Zeeroz lesson video creator.

## Live application
https://gahejodev.github.io/zeeroz-ai-studio/

## Academy integration
- Uses the existing Zeeroz Academy Firebase Authentication project.
- Requires the Firebase custom claim `admin: true`.
- Loads course registry and lesson packages from the Academy's public course library.
- Academy remains the source of lesson content; Studio is deployed separately.

## Current working production path
1. Select a course, chapter and lesson from Academy.
2. Choose the saved lesson explanation language (English, Urdu or Sindhi).
3. Build and review a storyboard from that selected lesson; no manual text paste is needed.
4. For the current one-click narration pipeline, select English or Urdu and a male/female neural voice (Urdu: Fasih/Aegis; English: Ryan/Amy).
5. The browser synthesizes narration scene by scene, retaining exact audio timing for scene transitions.
6. The 3D teacher lip-syncs to the generated audio while the science visual changes with the matching scene.
7. The browser records one combined video in the best browser-reported native format (MP4 where supported, otherwise WebM).

## 3D subject templates
The procedural Three.js engine currently recognizes selected topics and provides reusable animated templates for:
- Biology: cell, chloroplast, mitochondrion and DNA
- Chemistry: atom and simple water-molecule model
- Physics: force/motion vectors, travelling wave and electric circuit
- Mathematics: basic 3D geometry; unmatched lessons use a neutral concept visual instead of an unrelated Biology model

The models are rule-based visual aids. They are not yet a universal AI model that understands every lesson or produces scientifically exact animations for all topics.

## Social Queue handoff
- The selected narration file now has an in-browser audio preview showing its decoded duration and file size before 3D lip-sync/export. Preview uses native media controls, does not autoplay, and stays local to the browser. A Clear selected audio control removes the current external or generated voice track, stops preview playback and releases its temporary object URL. The 3D video export (MP4 or WebM) can be saved directly into the Academy Social Queue without copying a video URL.
- Video bytes are stored in the browser's IndexedDB database `zeeroz-social-media`; Firestore stores only the admin-only post metadata and local attachment key.
- Open the Social Queue in the same browser/device to preview or download the attached local video.
- This is a local handoff, not a cloud upload. Clearing browser site data or changing devices can make the local attachment unavailable.

## Current limits
- Teacher avatar: open-source 3D face/shoulders avatar with audio-driven lip-sync; no full-body gestures or custom Zeeroz rig yet.
- Neural TTS: Urdu male/female (Fasih/Aegis) and English male/female (Ryan/Amy) models. Sindhi neural voice is not yet verified.
- Export: browser MediaRecorder output; both 16:9 scene-preview and 9:16 3D teacher paths select MP4 when the browser reports support, otherwise WebM. The Device readiness panel checks canvas capture, MediaRecorder, reported MIME types, Web Audio, WebGL 2, AudioWorklet, IndexedDB and online/offline state. A reported MIME type does not guarantee a low-memory device can finish a long encode. Both exports can be cancelled before download; cancellation stops recording/playback, releases local streams and does not create a partial output. Voice-track preview object URLs are released on file replacement and page exit. Direct YouTube publishing is not included.
- Requires a modern browser with WebGL 2, AudioWorklet, Web Audio and MediaRecorder for the full 3D teacher workflow; the first Urdu voice use downloads a model of roughly 64 MB. Keep the tab open during generation.

## Privacy and security
Urdu voice synthesis and video recording run in the browser. Firebase browser configuration is public by design. Admin authorization relies on Firebase custom claims and must also be enforced by Firebase Security Rules. Never commit service-account keys or private API secrets.


## Verified free runtime and licence notes — 2026-11-21
- Three.js 0.170.0 and ONNX Runtime Web 1.26.0 are pinned and MIT licensed.
- Talking Avatar is pinned at `@interviewflowai/talking-avatar@0.3.0`; SDK/avatar/lip-sync model are MIT; training-data attribution is CC BY 4.0: https://github.com/interviewflowai/talking-avatar
- `@diffusionstudio/piper-wasm@1.0.0` wrapper declares MIT, but its build includes eSpeak NG phonemizer/data under GPL-3.0-or-later. Keep source/licence notices available; the complete phonemizer stack is not MIT-only: https://github.com/diffusionstudio/piper-wasm and https://github.com/rhasspy/espeak-ng
- Urdu Fasih/Aegis and English Ryan/Amy repositories declare MIT; retain author attribution. Voice models are about 63–64 MB and download on demand. Hugging Face anonymous limits can change; there is no guaranteed bandwidth quota. No API key, card or paid inference is required by the current browser path.
- jsDelivr is available without a subscription, subject to service policies: https://www.jsdelivr.com/terms
- Current GitHub Free Actions terms (checked 2026-11-25): private-repository standard runners draw from a $12 USD/month included compute amount, not a fixed minutes quota; at the standard 2-core Linux rate of $0.006/minute this is roughly 2,000 minutes, while Windows/macOS and other runner types cost differently. GitHub Free includes 500 MB artifact storage and 10 GB cache per repository. Standard runners in public repositories and GitHub Pages remain free. If no valid payment method is on file, usage is blocked after included compute is exhausted; if a valid payment method is on file, additional use can be billed. No billing settings or paid services are changed by this project: https://docs.github.com/en/billing/concepts/product-billing/github-actions

## Device preflight and format-aware export — 2026-11-25
- Added a browser-native compatibility panel before lesson selection. It reports canvas capture, MediaRecorder, the first browser-reported MP4/WebM type, Web Audio, WebGL 2, AudioWorklet, IndexedDB and online/offline state.
- 16:9 scene exports now use MP4 when reported as supported, otherwise WebM; the downloaded extension and status reflect the selected MIME type. The 9:16 3D path already used native MP4/WebM selection.
- These checks use browser APIs only; no new package, API key, account, backend, storage service or billing activation was added. A reported MIME type does not guarantee a long encode will finish on a constrained device.
- References: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static and https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream. GitHub Free limits above were checked against current GitHub billing documentation.


## Hybrid local-first video production — 2026-11-25
- The default path remains fully browser-local after the app and voice models are loaded: Academy lesson → storyboard → local neural narration → procedural Three.js science model → talking 3D teacher lip-sync → browser MP4/WebM export.
- Optional AI B-roll workflow: build a scene-specific educational prompt from the selected storyboard scene, open Google Flow, generate a short MP4/WebM visual, and import it into the Studio. The imported clip is composited into the science-display area during the final 9:16 export; the Zeeroz 3D teacher, local narration, lesson text and export remain in the browser. The AI clip is muted in the composite so it does not replace the lesson narration.
- AI B-roll is optional. If no clip is imported or the "Use this AI clip" toggle is off, the local animated science engine remains the visual source. Clearing the clip restores the local 3D visual path.
- Recommended imported clip: 5–8 seconds, MP4 or WebM, under 150 MB. Large clips may exceed mobile browser memory or encoder limits. Preview and verify the scientific accuracy of every AI-generated visual before publishing.
- No Gemini API key is placed in browser code, local storage, Firestore or Git. Google Flow availability/credits and any API billing are separate from the local renderer. Direct API generation is intentionally not enabled until a secure server-side provider, model availability, Google Cloud project and billing configuration are confirmed.
- The hybrid UI is an AI-assisted import-and-composite workflow, not a claim that the Studio itself currently generates AI video through an API. Social publishing remains governed by the separate Social Queue provider connection states.


## Local video storage preflight — 2026-11-27
- The Device readiness panel now calls the browser-native StorageManager.estimate() API when the browser exposes it and reports approximate free space for the local Social Queue.
- Before IndexedDB handoff, the Studio compares the video size plus a small safety margin with the reported estimate. If space looks low, it asks before continuing; the estimate is approximate and does not reserve quota.
- If IndexedDB reports QuotaExceededError, the Studio explains that the video was not added and suggests reviewing old local attachments or keeping the downloaded export elsewhere. The Studio never deletes existing user videos automatically.
- StorageManager.estimate() and IndexedDB are browser-native; no new package, API key, paid storage, permission request, persistence grant or billing activation is added. Browser quotas and eviction policies vary by device/browser, and an estimate is not a guarantee.
- Reference: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
