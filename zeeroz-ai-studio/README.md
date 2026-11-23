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
7. The browser records a single combined WebM file for download.

## 3D subject templates
The procedural Three.js engine currently recognizes selected topics and provides reusable animated templates for:
- Biology: cell, chloroplast, mitochondrion and DNA
- Chemistry: atom and simple water-molecule model
- Physics: force/motion vectors, travelling wave and electric circuit
- Mathematics: basic 3D geometry; unmatched lessons use a neutral concept visual instead of an unrelated Biology model

The models are rule-based visual aids. They are not yet a universal AI model that understands every lesson or produces scientifically exact animations for all topics.

## Social Queue handoff
- The selected narration file now has an in-browser audio preview showing its decoded duration and file size before 3D lip-sync/export. Preview uses native media controls, does not autoplay, and stays local to the browser. The 3D WebM export can be saved directly into the Academy Social Queue without copying a video URL.
- Video bytes are stored in the browser's IndexedDB database `zeeroz-social-media`; Firestore stores only the admin-only post metadata and local attachment key.
- Open the Social Queue in the same browser/device to preview or download the attached local video.
- This is a local handoff, not a cloud upload. Clearing browser site data or changing devices can make the local attachment unavailable.

## Current limits
- Teacher avatar: open-source 3D face/shoulders avatar with audio-driven lip-sync; no full-body gestures or custom Zeeroz rig yet.
- Neural TTS: Urdu male/female (Fasih/Aegis) and English male/female (Ryan/Amy) models. Sindhi neural voice is not yet verified.
- Export: browser MediaRecorder output (MP4 only when natively supported; otherwise WebM). Long 3D exports can be cancelled before download; cancellation stops audio/video streams and does not create a partial output. Voice-track preview object URLs are released on file replacement and page exit. Direct YouTube publishing is not included.
- Requires a modern browser with WebGL, Web Audio and MediaRecorder; the first Urdu voice use downloads a model of roughly 64 MB. Keep the tab open during generation.

## Privacy and security
Urdu voice synthesis and video recording run in the browser. Firebase browser configuration is public by design. Admin authorization relies on Firebase custom claims and must also be enforced by Firebase Security Rules. Never commit service-account keys or private API secrets.


## Verified free runtime and licence notes — 2026-11-21
- Three.js 0.170.0 and ONNX Runtime Web 1.26.0 are pinned and MIT licensed.
- Talking Avatar is pinned at `@interviewflowai/talking-avatar@0.3.0`; SDK/avatar/lip-sync model are MIT; training-data attribution is CC BY 4.0: https://github.com/interviewflowai/talking-avatar
- `@diffusionstudio/piper-wasm@1.0.0` wrapper declares MIT, but its build includes eSpeak NG phonemizer/data under GPL-3.0-or-later. Keep source/licence notices available; the complete phonemizer stack is not MIT-only: https://github.com/diffusionstudio/piper-wasm and https://github.com/rhasspy/espeak-ng
- Urdu Fasih/Aegis and English Ryan/Amy repositories declare MIT; retain author attribution. Voice models are about 63–64 MB and download on demand. Hugging Face anonymous limits can change; there is no guaranteed bandwidth quota. No API key, card or paid inference is required by the current browser path.
- jsDelivr is available without a subscription, subject to service policies: https://www.jsdelivr.com/terms
- GitHub Free includes 2,000 Actions minutes/month for private repos and 500 MB artifact storage; public Pages builds are free. Do not enable spending or larger runners: https://docs.github.com/en/billing/concepts/product-billing/github-actions
