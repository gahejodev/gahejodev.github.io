import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { addDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id);let allowed=false;let courses=[];const db=()=>window.ZeerozFirebase.db;
function status(message){$("status").textContent=message}
function fillCourseSelects(){["chapterCourse","lessonCourse","questionCourse"].forEach(id=>{const s=$(id);s.replaceChildren(new Option("Choose a course",""));courses.forEach(c=>s.add(new Option(c.title,c.id)))})}
async function loadCourses(){const snap=await getDocs(collection(db(),"courses"));courses=snap.docs.map(d=>({id:d.id,...d.data()})).filter(c=>c.published===true).sort((a,b)=>(a.title||"").localeCompare(b.title||""));fillCourseSelects()}
async function loadChapters(courseId){const s=$("lessonChapter");s.replaceChildren(new Option(courseId?"Choose a chapter":"Choose a course first",""));if(!courseId)return;const snap=await getDocs(collection(db(),"courses",courseId,"chapters"));snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order||0)-(b.order||0)).forEach(c=>s.add(new Option(c.title,c.id)))}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{if(!user){location.href="./student-login.html";return}const token=await user.getIdTokenResult(true);if(token.claims.admin!==true){document.body.innerHTML="<main style='font:16px system-ui;max-width:600px;margin:12vh auto;padding:24px'><h1>Access denied</h1><p>This account is not authorised as an Academy administrator.</p><a href='./student-dashboard.html'>Return to Student Desk</a></main>";return}allowed=true;try{await loadCourses();await loadAssessments()}catch(e){status("Could not load admin data: "+e.message)}});
$("logout").addEventListener("click",async()=>{await signOut(window.ZeerozFirebase.auth);location.href="./student-login.html"});
async function publish(name,data){if(!allowed)throw new Error("Administrator permission is required.");await addDoc(collection(db(),name),{...data,published:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:window.ZeerozFirebase.auth.currentUser.uid});status("Published successfully.")}
$("courseForm").addEventListener("submit",async e=>{e.preventDefault();try{await publish("courses",{title:$("courseTitle").value.trim(),description:$("courseDescription").value.trim()});e.target.reset();await loadCourses()}catch(err){status(err.message)}});
$("announcementForm").addEventListener("submit",async e=>{e.preventDefault();try{await publish("announcements",{title:$("announcementTitle").value.trim(),message:$("announcementMessage").value.trim()});e.target.reset()}catch(err){status(err.message)}});
$("chapterCourse").addEventListener("change",async e=>{const id=e.target.value;$("lessonCourse").value=id;try{await loadChapters(id)}catch(err){status(err.message)}});
$("lessonCourse").addEventListener("change",async e=>{try{await loadChapters(e.target.value)}catch(err){status(err.message)}});
$("questionCourse").addEventListener("change",async e=>{try{await loadQuestionChapters(e.target.value)}catch(err){status(err.message)}});
async function loadQuestionChapters(courseId){const s=$("questionChapter");s.replaceChildren(new Option(courseId?"Choose a chapter":"Choose a course first",""));if(!courseId)return;const snap=await getDocs(collection(db(),"courses",courseId,"chapters"));snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order||0)-(b.order||0)).forEach(c=>s.add(new Option(c.title,c.id)))}

$("chapterForm").addEventListener("submit",async e=>{e.preventDefault();try{if(!allowed)throw new Error("Administrator permission is required.");const id=$("chapterCourse").value;if(!id)throw new Error("Select a course.");const old=await getDocs(collection(db(),"courses",id,"chapters"));await addDoc(collection(db(),"courses",id,"chapters"),{title:$("chapterTitle").value.trim(),description:$("chapterDescription").value.trim(),order:old.size+1,published:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:window.ZeerozFirebase.auth.currentUser.uid});e.target.reset();status("Chapter saved successfully.");if($("lessonCourse").value===id)await loadChapters(id)}catch(err){status(err.message)}});
$("lessonForm").addEventListener("submit",async e=>{e.preventDefault();try{if(!allowed)throw new Error("Administrator permission is required.");const courseId=$("lessonCourse").value,chapterId=$("lessonChapter").value,type=$("lessonType").value,content=$("lessonContent").value.trim();if(!courseId||!chapterId)throw new Error("Select a course and chapter.");if(type!=="text"&&!/^https:\/\//i.test(content))throw new Error("Video/PDF link must start with https://");const old=await getDocs(collection(db(),"courses",courseId,"chapters",chapterId,"lessons"));await addDoc(collection(db(),"courses",courseId,"chapters",chapterId,"lessons"),{title:$("lessonTitle").value.trim(),type,content,order:old.size+1,published:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:window.ZeerozFirebase.auth.currentUser.uid});e.target.reset();await loadChapters(courseId);status("Lesson saved successfully.")}catch(err){status(err.message)}});

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

import { updateDoc, doc, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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
 let writes=1,lessons=0,questions=0;
 p.chapters.forEach((c,i)=>{
  if(!c.title||c.title.trim().length>160)throw new Error("Chapter "+(i+1)+" needs a valid title (maximum 160 characters).");
  writes++;
  (c.lessons||[]).forEach((l,j)=>{
   if(!l.title||!l.content||!["text","video","pdf"].includes(l.type||"text"))throw new Error("Chapter "+(i+1)+", lesson "+(j+1)+" is incomplete or has an invalid type.");
   if(l.title.trim().length>160||l.content.length>12000)throw new Error("Lesson title/content is too long.");
   if((l.type==="video"||l.type==="pdf")&&!/^https:\/\//i.test(l.content))throw new Error("Video/PDF lesson links must use HTTPS.");
   writes++;lessons++;
  });
  (c.questions||[]).forEach((q,j)=>{
   if(!q.question||q.question.trim().length>1200||!q.options||!["A","B","C","D"].every(k=>typeof q.options[k]==="string"&&q.options[k].trim()))throw new Error("Chapter "+(i+1)+", MCQ "+(j+1)+" must include a question and four options.");
   if(!["A","B","C","D"].includes(q.correctOption))throw new Error("Chapter "+(i+1)+", MCQ "+(j+1)+" has an invalid correctOption.");
   writes++;questions++;
  });
 });
 if(writes>450)throw new Error("This package contains "+writes+" records. Split it into smaller courses (maximum 450 records per import).");
 return {package:p,writes,lessons,questions,chapters:p.chapters.length};
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
    batch.set(lessonRef,{title:lesson.title.trim(),type:lesson.type||"text",content:lesson.content.trim(),order:li+1,published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
   });
   (chapter.questions||[]).forEach((q,qi)=>{
    const questionRef=doc(collection(db(),"courses",courseRef.id,"chapters",chapterRef.id,"questions"));
    batch.set(questionRef,{question:q.question.trim(),options:{A:q.options.A.trim(),B:q.options.B.trim(),C:q.options.C.trim(),D:q.options.D.trim()},correctOption:q.correctOption,explanation:(q.explanation||"").trim(),order:qi+1,published:true,createdAt:stamp,updatedAt:stamp,createdBy:uid});
   });
  });
  await batch.commit();
  $("coursePackagePreview").textContent="Published successfully: "+p.title+". Course, chapters, lessons and MCQs are now in Firestore.";
  $("coursePackage").value="";validatedCoursePackage=null;
  await loadCourses();
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
