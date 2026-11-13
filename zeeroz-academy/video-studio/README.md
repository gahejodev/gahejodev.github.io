# Zeeroz Academy — AI Teacher Video Studio

## Purpose

Create original, long-form educational videos from the Academy's existing lessons, combining one consistent 2D animated teacher with animated diagrams, labels, examples, and subtitles. The first pilot is Biology IX, Chapter 1, Lesson 1.4 — Biological Methods.

## Product principles

- No dependency on Gemini, paid avatar APIs, or per-video generation credits.
- No 10-second clip limit: render complete lessons locally.
- Prefer CPU-friendly 2D animation over diffusion/video-generation models.
- Reuse the lesson text and original SVG diagrams already stored in this repository.
- Keep video production separate from the public student website; publish only approved video metadata and embeds.
- Do not upload automatically until an administrator has previewed and approved the rendered video.
- No credentials, OAuth tokens, service-account keys, or private student data in this repository or browser code.

## Proposed architecture

1. **Lesson adapter** — reads a selected course/chapter/lesson from the existing course JSON package or a published Firebase lesson record.
2. **Lecture planner** — converts headings, paragraphs, lists, key terms, and image references into a sequence of scenes. It must preserve curriculum meaning and avoid inventing facts.
3. **Narration** — offline text-to-speech using a locally installed open-source engine and a separately licensed Urdu/English voice. Voice availability and pronunciation quality must be tested before selecting a default.
4. **Animated teacher** — a custom, consistent 2D SVG character with reusable idle, speaking, pointing, and explaining poses. Lip movement is driven by audio timing/visemes where available; a simple speaking animation is the fallback.
5. **Explainer scene renderer** — HTML/SVG/CSS scenes for diagrams, process steps, definitions, worked examples, and recap cards. Existing Academy SVG assets are reused where appropriate.
6. **Video renderer** — local FFmpeg-based composition of scene frames, narration, subtitles, and optional background music (only properly licensed/original audio).
7. **Review and publishing** — preview the final MP4; after admin approval, upload through YouTube Data API using the channel owner's OAuth consent. Save the YouTube video ID, URL, status, lesson ID, and timestamps to Firebase.
8. **Student lesson player** — show the approved YouTube embed only on the matching lesson.

## Pilot acceptance criteria

- Generate a complete 3–5 minute video for Biology IX, Chapter 1, Lesson 1.4.
- Use one consistent original 2D teacher character throughout.
- Include at least three distinct explainer scenes based on the lesson (scientific method sequence, hypothesis/experiment example, and recap).
- Include readable English captions; Urdu narration/captions can be added after voice quality is validated.
- Render locally without paid APIs or cloud GPU.
- Preserve factual accuracy against the source lesson.
- Produce an MP4 that plays on an ordinary Android phone.
- Keep YouTube publishing optional until the local render and manual review pass.

## Hardware and runtime constraints

The renderer should be designed for a Windows 10/11 laptop with an Intel Core i5 10th-generation CPU and should not require a dedicated GPU for the first 2D pilot. Rendering time will depend on RAM, resolution, frame rate, and narration engine. A 720p/24fps pilot is the initial target; 1080p can follow after performance testing.

## Cost and licensing guardrails

- The application code and core workflow should use free/open-source components.
- "Free software" does not mean every voice, font, image, sound, or hosted service is free to reuse. Check each asset's license and attribution requirements.
- Do not bundle or redistribute a voice model until its model/voice license is verified.
- GitHub Pages and Firebase are for the Academy interface and metadata, not for rendering or storing large MP4 files.
- Local MP4 files should remain on the user's computer until they choose a hosting/publishing route.
- YouTube API quota and OAuth requirements still apply; API access is not a promise of unlimited or automatic publishing.

## Initial implementation sequence

1. Confirm the laptop's Windows version, RAM, and available disk space.
2. Build the local lesson-to-scenes renderer and a sample animated teacher.
3. Add offline narration and synchronize scene durations.
4. Render and inspect the Biology IX 1.4 pilot on the laptop.
5. Add the authenticated admin review screen and Firebase video metadata.
6. Add optional YouTube OAuth upload and automatic lesson embedding.

## Current status

Planning and repository integration review. No production video engine, YouTube OAuth integration, or automatic publishing has been deployed yet.
