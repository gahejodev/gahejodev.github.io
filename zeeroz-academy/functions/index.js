const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");

setGlobalOptions({ region: "us-central1", maxInstances: 3, timeoutSeconds: 120 });
const geminiApiKey = defineSecret("GEMINI_API_KEY");

function cleanText(value, field, max = 1200, required = true) {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null)) return "";
    throw new HttpsError("invalid-argument", field + " must be text.");
  }
  const result = value.trim();
  if (required && !result) throw new HttpsError("invalid-argument", field + " is required.");
  if (result.length > max) throw new HttpsError("invalid-argument", field + " is too long.");
  return result;
}

function validatePackage(p) {
  if (!p || typeof p !== "object" || Array.isArray(p) ||
      typeof p.title !== "string" || !p.title.trim() ||
      typeof p.description !== "string" || !p.description.trim() ||
      !Array.isArray(p.chapters) || p.chapters.length < 1 || p.chapters.length > 10) {
    throw new HttpsError("internal", "AI returned an incomplete course package. Please try again with a narrower topic.");
  }
  let writes = 1;
  for (const [ci, chapter] of p.chapters.entries()) {
    if (!chapter || typeof chapter.title !== "string" || !chapter.title.trim() ||
        !Array.isArray(chapter.lessons) || chapter.lessons.length < 1 ||
        !Array.isArray(chapter.questions)) {
      throw new HttpsError("internal", "AI output chapter " + (ci + 1) + " is incomplete.");
    }
    writes++;
    for (const lesson of chapter.lessons) {
      if (!lesson || typeof lesson.title !== "string" || typeof lesson.content !== "string" ||
          !lesson.title.trim() || !lesson.content.trim() || lesson.type !== "text") {
        throw new HttpsError("internal", "AI returned an invalid text lesson.");
      }
      writes++;
    }
    for (const q of chapter.questions) {
      if (!q || typeof q.question !== "string" || !q.options ||
          !["A", "B", "C", "D"].every(k => typeof q.options[k] === "string" && q.options[k].trim()) ||
          !["A", "B", "C", "D"].includes(q.correctOption)) {
        throw new HttpsError("internal", "AI returned an invalid MCQ.");
      }
      writes++;
    }
  }
  if (writes > 450) throw new HttpsError("internal", "Generated package is too large to publish in one batch.");
  return p;
}

exports.generateCoursePackage = onCall(
  { secrets: [geminiApiKey], enforceAppCheck: false },
  async (request) => {
    if (!request.auth || request.auth.token.admin !== true) {
      throw new HttpsError("permission-denied", "Only an Academy administrator can generate course drafts.");
    }

    const className = cleanText(request.data?.className, "Class", 80);
    const subject = cleanText(request.data?.subject, "Subject", 80);
    const title = cleanText(request.data?.title, "Course title", 120);
    const topic = cleanText(request.data?.topic, "Topic / chapter outline", 1600);
    const syllabusNotes = cleanText(request.data?.syllabusNotes, "Syllabus notes", 3500, false);
    const chapterCount = Math.min(5, Math.max(1, Number(request.data?.chapterCount) || 1));
    const lessonsPerChapter = Math.min(4, Math.max(1, Number(request.data?.lessonsPerChapter) || 2));
    const mcqsPerChapter = Math.min(8, Math.max(1, Number(request.data?.mcqsPerChapter) || 5));

    const prompt = `You are an expert Pakistan/Sindh school curriculum instructional designer.
Create an ORIGINAL draft course package as strict JSON only.
Class: ${className}
Subject: ${subject}
Course title: ${title}
Topic / outline supplied by administrator: ${topic}
Syllabus notes supplied by administrator: ${syllabusNotes || "No official syllabus notes supplied. Stay within the named topic; do not claim exact official syllabus alignment."}

Create exactly ${chapterCount} chapters, each with exactly ${lessonsPerChapter} concise but useful original text lessons and exactly ${mcqsPerChapter} MCQs.
Each lesson should have title, type:"text", and age-appropriate content with clear explanations and examples.
Each MCQ must have question, options object with A/B/C/D, correctOption (A/B/C/D), and explanation.
Use accurate, unambiguous questions. Do not invent textbook page numbers, official curriculum references, quotations, or source URLs. If uncertain, state uncertainty in the lesson content rather than fabricating facts.
Output schema:
{"title":"string","description":"string","chapters":[{"title":"string","description":"string","lessons":[{"title":"string","type":"text","content":"string"}],"questions":[{"question":"string","options":{"A":"string","B":"string","C":"string","D":"string"},"correctOption":"A","explanation":"string"}]}]}
Do not include markdown fences or any text outside the JSON.`;

    let response;
    try {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" + encodeURIComponent(geminiApiKey.value());
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.25, responseMimeType: "application/json" }
        })
      });
      response = await result.json();
      if (!result.ok) {
        console.error("Gemini API request failed", result.status, response?.error?.message);
        throw new HttpsError("unavailable", "AI service request failed. Check the Gemini API key and quota, then try again.");
      }
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("Gemini request error", error);
      throw new HttpsError("unavailable", "Could not reach the AI service. Please try again.");
    }

    const raw = response?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!raw) throw new HttpsError("internal", "AI returned an empty response. Please try a smaller topic.");
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (error) {
      console.error("Gemini returned invalid JSON", error);
      throw new HttpsError("internal", "AI response was not valid course JSON. Please generate again.");
    }

    const coursePackage = validatePackage(parsed);
    return {
      coursePackage,
      reviewNotice: "AI draft only. Check syllabus coverage, facts, wording and answer keys before publishing.",
      model: "gemini-3.8-flash"
    };
  }
);
