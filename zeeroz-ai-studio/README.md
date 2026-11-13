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
4. For the current one-click narration pipeline, select Urdu and a male Fasih or female Aegis neural voice.
5. The browser synthesizes narration scene by scene, retaining exact audio timing for scene transitions.
6. The 3D teacher lip-syncs to the generated audio while the science visual changes with the matching scene.
7. The browser records a single combined WebM file for download.

## 3D subject templates
The procedural Three.js engine currently recognizes selected topics and provides reusable animated templates for:
- Biology: cell, chloroplast, mitochondrion and DNA
- Chemistry: atom and simple water-molecule model
- Physics: travelling wave and electric circuit
- Mathematics: basic 3D geometry

The models are rule-based visual aids. They are not yet a universal AI model that understands every lesson or produces scientifically exact animations for all topics.

## Current limits
- Teacher avatar: open-source 3D face/shoulders avatar with audio-driven lip-sync; no full-body gestures or custom Zeeroz rig yet.
- Neural TTS: verified Urdu male/female models only. Sindhi/English neural voice generation is not yet included.
- Export: browser WebM; MP4 conversion and direct YouTube publishing are not included.
- Requires a modern browser with WebGL, Web Audio and MediaRecorder; the first Urdu voice use downloads a model of roughly 64 MB. Keep the tab open during generation.

## Privacy and security
Urdu voice synthesis and video recording run in the browser. Firebase browser configuration is public by design. Admin authorization relies on Firebase custom claims and must also be enforced by Firebase Security Rules. Never commit service-account keys or private API secrets.
