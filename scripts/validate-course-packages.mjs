import { readFile } from "node:fs/promises";
import path from "node:path";

const registryPath = "zeeroz-academy/content/courses/index.json";
const fail = [];
const report = [];
const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const registry = await readJson(registryPath);

if (registry.schemaVersion !== 1 || !Array.isArray(registry.packages)) {
  throw new Error("Course registry must use schemaVersion 1 and contain a packages array.");
}

const seenIds = new Set();
const seenPaths = new Set();
for (const entry of registry.packages) {
  const id = String(entry?.id || "");
  const expectedPath = `zeeroz-academy/content/courses/${id}.json`;
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(id)) {
    fail.push(`Invalid course id: ${id || "(empty)"}`);
    continue;
  }
  if (seenIds.has(id)) fail.push(`Duplicate course id: ${id}`);
  seenIds.add(id);
  if (entry.path !== expectedPath || path.normalize(entry.path) !== entry.path) {
    fail.push(`Unsafe or mismatched path for ${id}: ${entry.path}`);
    continue;
  }
  if (seenPaths.has(entry.path)) fail.push(`Duplicate package path: ${entry.path}`);
  seenPaths.add(entry.path);

  let course;
  try {
    course = await readJson(entry.path);
  } catch (error) {
    fail.push(`Cannot read/parse ${entry.path}: ${error.message}`);
    continue;
  }
  if (course.id !== id) fail.push(`${id}: package id does not match registry id.`);
  if (typeof course.title !== "string" || !course.title.trim() || course.title.length > 120) fail.push(`${id}: invalid course title.`);
  if (typeof course.description !== "string" || !course.description.trim() || course.description.length > 1200) fail.push(`${id}: invalid course description.`);
  if (!Array.isArray(course.chapters) || course.chapters.length === 0) {
    fail.push(`${id}: course must contain at least one chapter.`);
    continue;
  }

  let writes = 1, lessons = 0, mcqs = 0, written = 0;
  course.chapters.forEach((chapter, ci) => {
    if (typeof chapter.title !== "string" || !chapter.title.trim() || chapter.title.length > 160) {
      fail.push(`${id}: chapter ${ci + 1} has an invalid title.`);
    }
    writes++;
    for (const [li, lesson] of (chapter.lessons || []).entries()) {
      lessons++; writes++;
      if (typeof lesson.title !== "string" || !lesson.title.trim() ||
          typeof lesson.content !== "string" || !lesson.content.trim() ||
          !["text", "video", "pdf"].includes(lesson.type || "text") ||
          lesson.title.length > 160 || lesson.content.length > 12000) {
        fail.push(`${id}: chapter ${ci + 1}, lesson ${li + 1} is invalid.`);
      }
      if (["video", "pdf"].includes(lesson.type) && !/^https:\/\//i.test(lesson.content || "")) {
        fail.push(`${id}: chapter ${ci + 1}, lesson ${li + 1} must use an HTTPS URL.`);
      }
      for (const lang of ["ur", "sd"]) {
        const value = lesson.explanations?.[lang];
        if (value !== undefined && (typeof value !== "string" || value.length > 12000)) {
          fail.push(`${id}: chapter ${ci + 1}, lesson ${li + 1} has invalid ${lang} explanation.`);
        }
      }
    }
    for (const [qi, question] of (chapter.questions || []).entries()) {
      mcqs++; writes++;
      const optionsValid = ["A", "B", "C", "D"].every((key) =>
        typeof question.options?.[key] === "string" && question.options[key].trim()
      );
      if (typeof question.question !== "string" || !question.question.trim() ||
          question.question.length > 1200 || !optionsValid ||
          !["A", "B", "C", "D"].includes(question.correctOption)) {
        fail.push(`${id}: chapter ${ci + 1}, MCQ ${qi + 1} is invalid.`);
      }
    }
    for (const [wi, question] of (chapter.writtenQuestions || []).entries()) {
      written++; writes++;
      if (!["crq", "erq"].includes(question.type) ||
          typeof question.question !== "string" || !question.question.trim() || question.question.length > 2000 ||
          !Number.isInteger(question.marks) || question.marks < 1 || question.marks > 30 ||
          typeof question.modelAnswer !== "string" || !question.modelAnswer.trim() || question.modelAnswer.length > 12000 ||
          !Array.isArray(question.rubric) || question.rubric.length === 0) {
        fail.push(`${id}: chapter ${ci + 1}, written question ${wi + 1} is invalid.`);
      }
    }
  });
  if (writes > 450) fail.push(`${id}: ${writes} Firestore writes exceed the safe 450-write importer limit.`);
  report.push({ id, chapters: course.chapters.length, lessons, mcqs, written, firestoreWrites: writes });
}

if (fail.length) {
  console.error("Course package validation failed:");
  for (const message of fail) console.error(" - " + message);
  process.exitCode = 1;
} else {
  const totals = report.reduce((sum, item) => ({
    courses: sum.courses + 1,
    chapters: sum.chapters + item.chapters,
    lessons: sum.lessons + item.lessons,
    mcqs: sum.mcqs + item.mcqs,
    written: sum.written + item.written
  }), { courses: 0, chapters: 0, lessons: 0, mcqs: 0, written: 0 });
  console.log("All course packages passed structural validation.");
  console.log(JSON.stringify(totals, null, 2));
}
