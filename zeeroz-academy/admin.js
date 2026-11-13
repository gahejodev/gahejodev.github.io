import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { addDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id);let allowed=false;let courses=[];const db=()=>window.ZeerozFirebase.db;
function status(message){$("status").textContent=message}
function fillCourseSelects(){["chapterCourse","lessonCourse","questionCourse"].forEach(id=>{const s=$(id);s.replaceChildren(new Option("Choose a course",""));courses.forEach(c=>s.add(new Option(c.title,c.id)))})}
async function loadCourses(){const snap=await getDocs(collection(db(),"courses"));courses=snap.docs.map(d=>({id:d.id,...d.data()})).filter(c=>c.published===true).sort((a,b)=>(a.title||"").localeCompare(b.title||""));fillCourseSelects()}
async function loadChapters(courseId){const s=$("lessonChapter");s.replaceChildren(new Option(courseId?"Choose a chapter":"Choose a course first",""));if(!courseId)return;const snap=await getDocs(collection(db(),"courses",courseId,"chapters"));snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order||0)-(b.order||0)).forEach(c=>s.add(new Option(c.title,c.id)))}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{if(!user){location.href="./student-login.html";return}const token=await user.getIdTokenResult(true);if(token.claims.admin!==true){document.body.innerHTML="<main style='font:16px system-ui;max-width:600px;margin:12vh auto;padding:24px'><h1>Access denied</h1><p>This account is not authorised as an Academy administrator.</p><a href='./student-dashboard.html'>Return to Student Desk</a></main>";return}allowed=true;try{await loadCourses();await loadAssessments();await loadManagedCourses();await syncGitHubCourses()}catch(e){status("Could not load admin data: "+e.message)}});
$("logout").addEventListener("click",async()=>{await signOut(window.ZeerozFirebase.auth);location.href="./student-login.html"});
async function publish(name,data){if(!allowed)throw new Error("Administrator permission is required.");await addDoc(collection(db(),name),{...data,published:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:window.ZeerozFirebase.auth.currentUser.uid});status("Published successfully.")}
$("courseForm").addEventListener("submit",async e=>{e.preventDefault();try{await publish("courses",{title:$("courseTitle").value.trim(),description:$("courseDescription").value.trim()});e.target.reset();await loadCourses()}catch(err){status(err.message)}});
$("announcementForm").addEventListener("submit",async e=>{e.preventDefault();try{await publish("announcements",{title:$("announcementTitle").value.trim(),message:$("announcementMessage").value.trim()});e.target.reset()}catch(err){status(err.message)}});
$("chapterCourse").addEventListener("change",async e=>{const id=e.target.value;$("lessonCourse").value=id;try{await loadChapters(id)}catch(err){status(err.message)}});
$("lessonCourse").addEventListener("change",async e=>{try{await loadChapters(e.target.value)}catch(err){status(err.message)}});
$("questionCourse").addEventListener("change",async e=>{try{await loadQuestionChapters(e.target.value)}catch(err){status(err.message)}});
async function loadQuestionChapters(courseId){const s=$("questionChapter");s.replaceChildren(new Option(courseId?"Choose a chapter":"Choose a course first",""));if(!courseId)return;const snap=await getDocs(collection(db(),"courses",courseId,"chapters"));snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order||0)-(b.order||0)).forEach(c=>s.add(new Option(c.title,c.id)))}

$("chapterForm").addEventListener("submit",async e=>{e.preventDefault();try{if(!allowed)throw new Error("Administrator permission is required.");const id=$("chapterCourse").value;if(!id)throw new Error("Select a course.");const old=await getDocs(collection(db(),"courses",id,"chapters"));await addDoc(collection(db(),"courses",id,"chapters"),{title:$("chapterTitle").value.trim(),description:$("chapterDescription").value.trim(),order:old.size+1,published:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:window.ZeerozFirebase.auth.currentUser.uid});e.target.reset();status("Chapter saved successfully.");if($("lessonCourse").value===id)await loadChapters(id)}catch(err){status(err.message)}});
$("lessonForm").addEventListener("submit",async e=>{e.preventDefault();try{if(!allowed)throw new Error("Administrator permission is required.");const courseId=$("lessonCourse").value,chapterId=$("lessonChapter").value,type=$("lessonType").value,content=$("lessonContent").value.trim();if(!courseId||!chapterId)throw new Error("Select a course and chapter.");if(type!=="text"&&!/^https:\/\//i.test(content))throw new Error("Video/PDF link must start with https://");const old=await getDocs(collection(db(),"courses",courseId,"chapters",chapterId,"lessons"));const explanations={en:content,ur:$("lessonUrdu").value.trim(),sd:$("lessonSindhi").value.trim()};await addDoc(collection(db(),"courses",courseId,"chapters",chapterId,"lessons"),{title:$("lessonTitle").value.trim(),type,content,explanations,order:old.size+1,published:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:window.ZeerozFirebase.auth.currentUser.uid});e.target.reset();await loadChapters(courseId);status("Lesson saved successfully.")}catch(err){status(err.message)}});

$("questionForm").addEventListener("submit",async e=>{
 e.preventDefault();
 try{
  if(!allowed)throw new Error("Administrator permission is required.");
  const courseId=$("questionCourse").value,chapterId=$("questionChapter").value;
  if(!courseId||!chapterId)throw new Error("Select a course and chapter.");
  const options={A:$("optionA").value.trim(),B:$("optionB").value.trim(),C:$("optionC").value.trim(),D:$("optionD").value.trim()};
  if(Object.values(options).some(v=>!v))throw new Error("Fill all four options.");
  const old=await getDocs(collection(db(),"courses",courseId,"chapters",chapterId,"questions"));
  await addDoc(collection(db(),"courses",courseId,"chapters",chapterId,"questions"),{
   question:$("questionText").value.trim(),options,correctOption:$("correctOption").value,
   explanation:$("questionExplanation").value.trim(),order:old.size+1,published:true,
   createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:window.ZeerozFirebase.auth.currentUser.uid
  });
  e.target.reset();status("MCQ published successfully.");
 }catch(err){status(err.message)}
});

import { updateDoc, doc, setDoc, writeBatch, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
let assessments=[];
async function loadAssessments(){
 const snap=await getDocs(collection(db(),"assessments"));
 assessments=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.title||"").localeCompare(b.title||""));
 const s=$("assessmentSelect");s.replaceChildren(new Option("Choose an assessment",""));
 assessments.forEach(a=>s.add(new Option((a.title||"Untitled")+(a.published?" · Published":" · Draft"),a.id)));
 const host=$("assessmentAdminList");host.replaceChildren();
 assessments.forEach(a=>{const line=document.createElement("div");line.style.marginTop="10px";const label=document.createElement("strong");label.textContent=(a.title||"Untitled")+" — "+(a.published?"Published":"Draft");const b=document.createElement("button");b.className="btn";b.style.marginLeft="8px";b.textContent=a.published?"Unpublish":"Publish";b.addEventListener("click",async()=>{try{await updateDoc(doc(db(),"assessments",a.id),{published:!a.published,updatedAt:serverTimestamp()});status("Assessment status updated.");await loadAssessments()}catch(e){status(e.message)}});line.append(label,b);host.append(line)});
}
$("assessmentForm").addEventListener("submit",async e=>{e.preventDefault();try{if(!allowed)throw new Error("Administrator permission is required.");const duration=Number($("assessmentDuration").value);if(!Number.isInteger(duration)||duration<1||duration>240)throw new Error("Time limit must be 1–240 minutes.");await addDoc(collection(db(),"assessments"),{title:$("assessmentTitle").value.trim(),courseTitle:$("assessmentCourseTitle").value.trim(),durationMinutes:duration,instructions:$("assessmentInstructions").value.trim(),published:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:window.ZeerozFirebase.auth.currentUser.uid});e.target.reset();status("Draft assessment created. Now add its questions.");await loadAssessments()}catch(err){status(err.message)}});
$("assessmentQuestionType").addEventListener("change",e=>{$("assessmentMcqFields").style.display=e.target.value==="mcq"?"block":"none"});
$("assessmentQuestionForm").addEventListener("submit",async e=>{e.preventDefault();try{if(!allowed)throw new Error("Administrator permission is required.");const aid=$("assessmentSelect").value,type=$("assessmentQuestionType").value,marks=Number($("assessmentQuestionMarks").value);if(!aid)throw new Error("Select an assessment.");if(!Number.isInteger(marks)||marks<1)throw new Error("Enter valid marks.");const old=await getDocs(collection(db(),"assessments",aid,"questions"));const qref=doc(collection(db(),"assessments",aid,"questions"));const data={type,question:$("assessmentQuestionText").value.trim(),marks,order:old.size+1,createdAt:serverTimestamp()};if(type==="mcq"){const options={A:$("assessmentOptionA").value.trim(),B:$("assessmentOptionB").value.trim(),C:$("assessmentOptionC").value.trim(),D:$("assessmentOptionD").value.trim()};if(Object.values(options).some(x=>!x))throw new Error("Fill all four MCQ options.");data.options=options;await setDoc(doc(db(),"assessments",aid,"answerKeys",qref.id),{correctOption:$("assessmentCorrect").value,marks})}await setDoc(qref,data);e.target.reset();$("assessmentMcqFields").style.display="block";status("Assessment question added successfully.")}catch(err){status(err.message)}});

let validatedCoursePackage=null;
function validateCoursePackage(raw){
 if(typeof raw!=="string"||!raw.trim())throw new Error("Pehle Course package box mein AI-prepared JSON paste karein. Khali box validate nahi ho sakta.");
 let p;try{p=JSON.parse(raw)}catch(error){throw new Error("JSON format ghalat hai. Brackets, commas aur quotation marks check karein. Details: "+error.message)}
 if(!p||typeof p!=="object"||Array.isArray(p)||typeof p.title!=="string"||!p.title.trim()||typeof p.description!=="string"||!p.description.trim()||!Array.isArray(p.chapters)||!p.chapters.length)throw new Error("Package mein course title, description aur kam az kam aik chapter lazmi hai.");
 if(p.title.trim().length>120||p.description.trim().length>1200)throw new Error("Course title/description exceeds allowed length.");
 let writes=1,lessons=0,questions=0,writtenQuestions=0;
 p.chapters.forEach((c,i)=>{
  if(!c.title||c.title.trim().length>160)throw new Error("Chapter "+(i+1)+" needs a valid title (maximum 160 characters).");
  writes++;
  (c.lessons||[]).forEach((l,j)=>{
   if(!l.title||!l.content||!["text","video","pdf"].includes(l.type||"text"))throw new Error("Chapter "+(i+1)+", lesson "+(j+1)+" is incomplete or has an invalid type.");
   if(l.title.trim().length>160||l.content.length>12000)throw new Error("Lesson title/content is too long.");
   if(l.explanations!==undefined&&(!l.explanations||typeof l.explanations!=="object"||["ur","sd"].some(k=>l.explanations[k]!==undefined&&(typeof l.explanations[k]!=="string"||l.explanations[k].length>12000))))throw new Error("Lesson Urdu/Sindhi explanations must be text under 12,000 characters.");
   if((l.type==="video"||l.type==="pdf")&&!/^https:\/\//i.test(l.content))throw new Error("Video/PDF lesson links must use HTTPS.");
   writes++;lessons++;
  });
  (c.writtenQuestions||[]).forEach((q,j)=>{
   if(!["crq","erq"].includes(q.type)||!q.question||q.question.trim().length>2000||!Number.isInteger(q.marks)||q.marks<1||q.marks>30||!q.modelAnswer||q.modelAnswer.length>12000||!Array.isArray(q.rubric)||!q.rubric.length)throw new Error("Chapter "+(i+1)+", written question "+(j+1)+" needs type crq/erq, question, marks, model answer and marking rubric.");
   if(q.translations!==undefined&&(!q.translations||typeof q.translations!=="object"))throw new Error("Written-question translations must be an object with ur/sd entries.");
   writes++;writtenQuestions++;
  });
  (c.questions||[]).forEach((q,j)=>{
   if(!q.question||q.question.trim().length>1200||!q.options||!["A","B","C","D"].every(k=>typeof q.options[k]==="string"&&q.options[k].trim()))throw new Error("Chapter "+(i+1)+", MCQ "+(j+1)+" must include a question and four options.");
   if(!["A","B","C","D"].includes(q.correctOption))throw new Error("Chapter "+(i+1)+", MCQ "+(j+1)+" has an invalid correctOption.");
   if(q.translations!==undefined&&(!q.translations||typeof q.translations!=="object"))throw new Error("MCQ translations must be an object with ur/sd entries.");
   writes++;questions++;
  });
 });
 if(writes>450)throw new Error("This package contains "+writes+" records. Split it into smaller courses (maximum 450 records per import).");
 return {package:p,writes,lessons,questions,writtenQuestions,chapters:p.chapters.length};
}
$("previewCoursePackage").addEventListener("click",()=>{
 try{
  if(!allowed)throw new Error("Administrator permission is required.");
  validatedCoursePackage=validateCoursePackage($("coursePackage").value);
  const x=validatedCoursePackage;
  $("coursePackagePreview").textContent="Valid: "+x.package.title+" · "+x.chapters+" chapters · "+x.lessons+" lessons · "+x.questions+" MCQs · "+x.writes+" Firestore records. Existing courses will not be overwritten.";
  $("publishCoursePackage").disabled=false;
 }catch(e){validatedCoursePackage=null;$("publishCoursePackage").disabled=true;$("coursePackagePreview").textContent="Validation error: "+e.message}
});
$("coursePackage").addEventListener("input",()=>{$("publishCoursePackage").disabled=true;validatedCoursePackage=null;$("coursePackagePreview").textContent="Package changed. Validate it again before publishing."});
$("publishCoursePackage").addEventListener("click",async()=>{
 const button=$("publishCoursePackage");
 try{
  if(!allowed||!validatedCoursePackage)throw new Error("Validate a course package first.");
  button.disabled=true;
  const p=validatedCoursePackage.package;
  const existing=await getDocs(collection(db(),"courses"));
  if(existing.docs.some(d=>(d.data().title||"").trim().toLowerCase()===p.title.trim().toLowerCase()))throw new Error("A course with this title already exists. Nothing was changed.");
  const batch=writeBatch(db()),uid=window.ZeerozFirebase.auth.currentUser.uid,stamp=serverTimestamp();
  const courseRef=doc(collection(db(),"courses"));
  batch.set(courseRef,{title:p.title.trim(),description:p.description.trim(),published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
  p.chapters.forEach((chapter,ci)=>{
   const chapterRef=doc(collection(db(),"courses",courseRef.id,"chapters"));
   batch.set(chapterRef,{title:chapter.title.trim(),description:(chapter.description||"").trim(),order:ci+1,published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
   (chapter.lessons||[]).forEach((lesson,li)=>{
    const lessonRef=doc(collection(db(),"courses",courseRef.id,"chapters",chapterRef.id,"lessons"));
    batch.set(lessonRef,{title:lesson.title.trim(),type:lesson.type||"text",content:lesson.content.trim(),explanations:{en:lesson.content.trim(),ur:(lesson.explanations?.ur||"").trim(),sd:(lesson.explanations?.sd||"").trim()},order:li+1,published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
   });
   (chapter.writtenQuestions||[]).forEach((q,qi)=>{
    const writtenRef=doc(collection(db(),"courses",courseRef.id,"chapters",chapterRef.id,"writtenQuestions"));
    batch.set(writtenRef,{type:q.type,question:q.question.trim(),marks:q.marks,modelAnswer:q.modelAnswer.trim(),rubric:q.rubric,translations:q.translations||{},order:qi+1,published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
   });
   (chapter.questions||[]).forEach((q,qi)=>{
    const questionRef=doc(collection(db(),"courses",courseRef.id,"chapters",chapterRef.id,"questions"));
    batch.set(questionRef,{question:q.question.trim(),options:{A:q.options.A.trim(),B:q.options.B.trim(),C:q.options.C.trim(),D:q.options.D.trim()},correctOption:q.correctOption,explanation:(q.explanation||"").trim(),translations:q.translations||{},order:qi+1,published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
   });
  });
  await batch.commit();
  $("coursePackagePreview").textContent="Published successfully: "+p.title+". Course, chapters, lessons and MCQs are now in Firestore.";
  $("coursePackage").value="";validatedCoursePackage=null;
  await loadCourses();
  await loadManagedCourses();
  status("Complete course package published successfully.");
 }catch(e){$("coursePackagePreview").textContent="Publish failed: "+e.message;status(e.message);button.disabled=!validatedCoursePackage}
});


const generateAiCourseButton = $("generateAiCourse");
if (generateAiCourseButton) {
 generateAiCourseButton.addEventListener("click", () => {
  const output = $("aiCourseStatus");
  try {
   if (!allowed) throw new Error("Administrator permission is required.");
   const className = $("aiClass").value.trim();
   const subject = $("aiSubject").value.trim();
   const title = $("aiTitle").value.trim();
   const topic = $("aiTopic").value.trim();
   const syllabusNotes = $("aiSyllabusNotes").value.trim();
   const chapters = Math.min(5, Math.max(1, Number($("aiChapterCount").value) || 1));
   const lessons = Math.min(4, Math.max(1, Number($("aiLessonsPerChapter").value) || 2));
   const mcqs = Math.min(8, Math.max(1, Number($("aiMcqsPerChapter").value) || 5));
   if (!className || !subject || !title || !topic) throw new Error("Class, subject, course title aur topic/outline fill karein.");
   const prompt = `Act as an expert Pakistan/Sindh school curriculum teacher and assessment designer. Create an original course package as STRICT JSON only for the Zeeroz Academy admin importer.

CLASS: ${className}
SUBJECT: ${subject}
COURSE TITLE: ${title}
TOPICS / CHAPTER OUTLINE: ${topic}
OFFICIAL SYLLABUS NOTES: ${syllabusNotes || "Not supplied. Do not claim verified official syllabus alignment. Stay within the given topics."}

REQUIREMENTS:
- Create exactly ${chapters} chapter(s).
- Each chapter must contain exactly ${lessons} original text lesson(s) and exactly ${mcqs} MCQs.
- Lessons must be age-appropriate, clear, accurate, detailed enough to teach the topic, and include examples and key terms.
- MCQs must have four plausible options A-D, one correctOption, and a short explanation.
- Do not fabricate official references, textbook page numbers, source URLs, or quotations. If facts are uncertain, say so.
- Use original wording. Do not reproduce copyrighted textbook passages.
- Return valid JSON only: no markdown fences, no introduction, no trailing comments.
- Match this exact schema:
{
  "title": "string",
  "description": "string",
  "chapters": [
    {
      "title": "string",
      "description": "string",
      "lessons": [
        {"title": "string", "type": "text", "content": "string"}
      ],
      "questions": [
        {
          "question": "string",
          "options": {"A": "string", "B": "string", "C": "string", "D": "string"},
          "correctOption": "A",
          "explanation": "string"
        }
      ]
    }
  ]
}
Ensure all JSON strings are correctly escaped and the response can be parsed by JSON.parse().`;
   $("aiPromptOutput").value = prompt;
   $("copyAiPrompt").disabled = false;
   output.textContent = "Prompt tayyar hai. Copy karein, Gemini website par paste karein, phir uska JSON result Bulk course publisher mein paste karein.";
  } catch (error) {
   output.textContent = "Prompt error: " + error.message;
  }
 });
}
const copyAiPromptButton = $("copyAiPrompt");
if (copyAiPromptButton) copyAiPromptButton.addEventListener("click", async () => {
 try {
  await navigator.clipboard.writeText($("aiPromptOutput").value);
  $("aiCourseStatus").textContent = "Prompt copied. Ab Gemini open karke paste karein.";
 } catch (error) {
  $("aiPromptOutput").focus();
  $("aiPromptOutput").select();
  $("aiCourseStatus").textContent = "Auto-copy unavailable. Prompt select ho gaya hai; Copy command use karein.";
 }
});


// GitHub -> Firebase automatic course publisher.
// Public GitHub files are read-only source material; Firestore writes use the signed-in
// administrator's Firebase Auth token and existing admin-only Firestore rules.
const GITHUB_COURSE_INDEX = "https://gahejodev.github.io/zeeroz-academy/content/courses/index.json";
const GITHUB_COURSE_BASE = "https://gahejodev.github.io/";
let githubSyncRunning = false;

function safeCourseId(value) {
 const id = String(value || "").toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
 if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(id)) throw new Error("GitHub course index contains an invalid course id.");
 return id;
}

async function publishGitHubPackage(item) {
 const courseId = safeCourseId(item.id);
 if (typeof item.path !== "string" || !/^zeeroz-academy\/content\/courses\/[a-z0-9-]+\.json$/.test(item.path)) {
  throw new Error("GitHub course index contains an unsafe package path.");
 }
 const courseRef = doc(db(),"courses",courseId);
 const existing = await getDoc(courseRef);
 const response = await fetch(GITHUB_COURSE_BASE + item.path + "?v=" + encodeURIComponent(item.version||"1"),{cache:"no-store"});
 if (!response.ok) throw new Error("Could not download course package: "+item.path+" ("+response.status+")");
 const parsed = validateCoursePackage(await response.text());
 const p = parsed.package;
 const version = String(item.version||"1");
 if (existing.exists()) {
  const old = existing.data();
  if (String(old.sourceVersion||"") === version && old.sourcePackageId === courseId) {
   return {status:"already",title:old.title||p.title};
  }
  if ((old.title||"").trim().toLowerCase() !== p.title.trim().toLowerCase()) {
   return {status:"duplicate",title:p.title};
  }
 }
 const allCourses = await getDocs(collection(db(),"courses"));
 if (allCourses.docs.some(d=>d.id!==courseId&&(d.data().title||"").trim().toLowerCase()===p.title.trim().toLowerCase())) {
  return {status:"duplicate",title:p.title};
 }
 const batch=writeBatch(db()),uid=window.ZeerozFirebase.auth.currentUser.uid,stamp=serverTimestamp();
 if(existing.exists()){
  const oldChapters=await getDocs(collection(db(),"courses",courseId,"chapters"));
  for(const oldChapter of oldChapters.docs){
   const [oldLessons,oldQuestions,oldWritten]=await Promise.all([
    getDocs(collection(db(),"courses",courseId,"chapters",oldChapter.id,"lessons")),
    getDocs(collection(db(),"courses",courseId,"chapters",oldChapter.id,"questions")),
    getDocs(collection(db(),"courses",courseId,"chapters",oldChapter.id,"writtenQuestions"))
   ]);
   oldLessons.docs.forEach(d=>batch.delete(d.ref));
   oldQuestions.docs.forEach(d=>batch.delete(d.ref));
   oldWritten.docs.forEach(d=>batch.delete(d.ref));
   batch.delete(oldChapter.ref);
  }
 }
 batch.set(courseRef,{
  title:p.title.trim(),description:p.description.trim(),published:true,
  createdAt:existing.exists()?(existing.data().createdAt||stamp):stamp,
  updatedAt:stamp,createdBy:existing.exists()?(existing.data().createdBy||uid):uid,
  sourcePackageId:courseId,sourceVersion:version
 });
 p.chapters.forEach((chapter,ci)=>{
  const chapterRef=doc(collection(db(),"courses",courseId,"chapters"));
  batch.set(chapterRef,{title:chapter.title.trim(),description:(chapter.description||"").trim(),order:ci+1,published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
  (chapter.lessons||[]).forEach((lesson,li)=>{
   const lessonRef=doc(collection(db(),"courses",courseId,"chapters",chapterRef.id,"lessons"));
   batch.set(lessonRef,{title:lesson.title.trim(),type:lesson.type||"text",content:lesson.content.trim(),explanations:{en:lesson.content.trim(),ur:(lesson.explanations?.ur||"").trim(),sd:(lesson.explanations?.sd||"").trim()},order:li+1,published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
  });
  (chapter.writtenQuestions||[]).forEach((q,qi)=>{
   const writtenRef=doc(collection(db(),"courses",courseId,"chapters",chapterRef.id,"writtenQuestions"));
   batch.set(writtenRef,{type:q.type,question:q.question.trim(),marks:q.marks,modelAnswer:q.modelAnswer.trim(),rubric:q.rubric,order:qi+1,published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
  });
  (chapter.questions||[]).forEach((q,qi)=>{
   const questionRef=doc(collection(db(),"courses",courseId,"chapters",chapterRef.id,"questions"));
   batch.set(questionRef,{question:q.question.trim(),options:{A:q.options.A.trim(),B:q.options.B.trim(),C:q.options.C.trim(),D:q.options.D.trim()},correctOption:q.correctOption,explanation:(q.explanation||"").trim(),order:qi+1,published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
  });
 });
 if(parsed.writes + (existing.exists()?parsed.writes:0) > 450) throw new Error("Course refresh is larger than the safe Firestore batch limit.");
 await batch.commit();
 return {status:existing.exists()?"updated":"published",title:p.title};
}

async function syncGitHubCourses() {
 const out=$("githubSyncStatus");
 if (!out || !allowed || githubSyncRunning) return;
 githubSyncRunning=true;
 const button=$("syncGitHubCourses");if(button)button.disabled=true;
 out.textContent="GitHub course index check ho raha hai…";
 try {
  const response=await fetch(GITHUB_COURSE_INDEX+"?t="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw new Error("Course index load nahi hua ("+response.status+").");
  const index=await response.json();
  if(index.schemaVersion!==1 || !Array.isArray(index.packages))throw new Error("GitHub course index format invalid hai.");
  if(!index.packages.length){out.textContent="GitHub sync ready hai. Abhi repository mein koi course package listed nahi; naya package aate hi auto-publish hoga.";return}
  let published=0,updated=0,already=0,duplicates=0,failed=[];
  for(const item of index.packages){
   try{
    const result=await publishGitHubPackage(item);
    if(result.status==="published")published++;
    else if(result.status==="updated")updated++;
    else if(result.status==="already")already++;
    else duplicates++;
   }catch(error){failed.push((item.title||item.id||"Course")+": "+error.message)}
  }
  await loadCourses();await loadManagedCourses();
  out.textContent="GitHub sync complete — "+published+" new course(s) published, "+updated+" existing course(s) refreshed, "+already+" unchanged, "+duplicates+" duplicate title(s) skipped."+(failed.length?" Errors: "+failed.join(" | "):"");
 } catch(error) {
  out.textContent="GitHub sync issue: "+error.message+" Existing courses are safe; press Sync now to retry.";
 } finally {
  githubSyncRunning=false;if(button)button.disabled=false;
 }
}
const syncButton=$("syncGitHubCourses");
if(syncButton)syncButton.addEventListener("click",syncGitHubCourses);

// Administrator course review and maintenance tools.
async function loadManagedCourses() {
 const host=$("courseManagementList");if(!host||!allowed)return;
 const snap=await getDocs(collection(db(),"courses"));
 const items=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.title||"").localeCompare(b.title||""));
 host.replaceChildren();
 if(!items.length){host.textContent="Abhi koi course nahi hai.";return}
 items.forEach(course=>{
  const card=document.createElement("article");card.style.cssText="border:1px solid #e5eaf4;border-radius:12px;padding:14px;margin:10px 0;background:#fbfcff";
  const title=document.createElement("input");title.value=course.title||"";title.maxLength=120;title.setAttribute("aria-label","Course title");
  const description=document.createElement("textarea");description.value=course.description||"";description.maxLength=1200;description.rows=2;description.setAttribute("aria-label","Course description");
  const meta=document.createElement("p");meta.className="hint";meta.textContent=(course.published?"Visible to students":"Hidden from students")+" · ID: "+course.id;
  const actions=document.createElement("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap";
  const save=document.createElement("button");save.className="btn";save.textContent="Save changes";
  save.addEventListener("click",async()=>{try{if(!title.value.trim()||!description.value.trim())throw new Error("Title aur description khali nahi ho sakte.");await updateDoc(doc(db(),"courses",course.id),{title:title.value.trim(),description:description.value.trim(),updatedAt:serverTimestamp()});status("Course updated.");await loadCourses();await loadManagedCourses()}catch(e){status("Update failed: "+e.message)}});
  const visibility=document.createElement("button");visibility.className="btn";visibility.textContent=course.published?"Hide from students":"Publish to students";
  visibility.addEventListener("click",async()=>{try{await updateDoc(doc(db(),"courses",course.id),{published:!course.published,updatedAt:serverTimestamp()});status(course.published?"Course hidden from students.":"Course published to students.");await loadCourses();await loadManagedCourses()}catch(e){status("Status update failed: "+e.message)}});
  const remove=document.createElement("button");remove.className="btn";remove.style.background="#a83232";remove.textContent="Delete course";
  remove.addEventListener("click",async()=>{if(!window.confirm("Permanently delete "+(course.title||"this course")+" and all its chapters, lessons and MCQs?"))return;remove.disabled=true;try{const refs=[];const chapters=await getDocs(collection(db(),"courses",course.id,"chapters"));for(const ch of chapters.docs){const [lessons,questions,written]=await Promise.all([getDocs(collection(db(),"courses",course.id,"chapters",ch.id,"lessons")),getDocs(collection(db(),"courses",course.id,"chapters",ch.id,"questions")),getDocs(collection(db(),"courses",course.id,"chapters",ch.id,"writtenQuestions"))]);lessons.docs.forEach(d=>refs.push(d.ref));questions.docs.forEach(d=>refs.push(d.ref));written.docs.forEach(d=>refs.push(d.ref));refs.push(ch.ref)}refs.push(doc(db(),"courses",course.id));for(let i=0;i<refs.length;i+=400){const batch=writeBatch(db());refs.slice(i,i+400).forEach(ref=>batch.delete(ref));await batch.commit()}status("Course and all its content deleted.");await loadCourses();await loadManagedCourses()}catch(e){status("Delete failed: "+e.message);remove.disabled=false}});
  actions.append(save,visibility,remove);card.append(title,description,meta,actions);host.append(card);
 });
}
