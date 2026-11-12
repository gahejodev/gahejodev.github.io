import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { addDoc, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id);let allowed=false;let courses=[];const db=()=>window.ZeerozFirebase.db;
function status(message){$("status").textContent=message}
function fillCourseSelects(){["chapterCourse","lessonCourse","questionCourse"].forEach(id=>{const s=$(id);s.replaceChildren(new Option("Choose a course",""));courses.forEach(c=>s.add(new Option(c.title,c.id)))})}
async function loadCourses(){const snap=await getDocs(collection(db(),"courses"));courses=snap.docs.map(d=>({id:d.id,...d.data()})).filter(c=>c.published===true).sort((a,b)=>(a.title||"").localeCompare(b.title||""));fillCourseSelects()}
async function loadChapters(courseId){const s=$("lessonChapter");s.replaceChildren(new Option(courseId?"Choose a chapter":"Choose a course first",""));if(!courseId)return;const snap=await getDocs(collection(db(),"courses",courseId,"chapters"));snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order||0)-(b.order||0)).forEach(c=>s.add(new Option(c.title,c.id)))}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{if(!user){location.href="./student-login.html";return}const token=await user.getIdTokenResult(true);if(token.claims.admin!==true){document.body.innerHTML="<main style='font:16px system-ui;max-width:600px;margin:12vh auto;padding:24px'><h1>Access denied</h1><p>This account is not authorised as an Academy administrator.</p><a href='./student-dashboard.html'>Return to Student Desk</a></main>";return}allowed=true;try{await loadCourses()}catch(e){status("Could not load courses: "+e.message)}});
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

import { updateDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
let assessments=[];
async function loadAssessments(){
 const snap=await getDocs(collection(db(),"assessments"));
 assessments=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.title||"").localeCompare(b.title||""));
 const s=$("assessmentSelect");s.replaceChildren(new Option("Choose an assessment",""));
 assessments.forEach(a=>s.add(new Option((a.title||"Untitled")+(a.published?" · Published":" · Draft"),a.id)));
 const host=$("assessmentAdminList");host.replaceChildren();
 assessments.forEach(a=>{const line=document.createElement("div");line.style.marginTop="10px";const label=document.createElement("strong");label.textContent=(a.title||"Untitled")+" — "+(a.published?"Published":"Draft");const b=document.createElement("button");b.className="btn";b.style.marginLeft="8px";b.textContent=a.published?"Unpublish":"Publish";b.addEventListener("click",async()=>{try{await updateDoc(doc(db(),"assessments",a.id),{published:!a.published,updatedAt:serverTimestamp()});status("Assessment status updated.");await loadAssessments()}catch(e){status(e.message)}});line.append(label,b);host.append(line)});
}
const oldLoadCourses=loadCourses;
const assessmentPoll=setInterval(()=>{if(allowed){clearInterval(assessmentPoll);loadAssessments().catch(e=>status(e.message))}},500);
$("assessmentForm").addEventListener("submit",async e=>{e.preventDefault();try{if(!allowed)throw new Error("Administrator permission is required.");const duration=Number($("assessmentDuration").value);if(!Number.isInteger(duration)||duration<1||duration>240)throw new Error("Time limit must be 1–240 minutes.");await addDoc(collection(db(),"assessments"),{title:$("assessmentTitle").value.trim(),courseTitle:$("assessmentCourseTitle").value.trim(),durationMinutes:duration,instructions:$("assessmentInstructions").value.trim(),published:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:window.ZeerozFirebase.auth.currentUser.uid});e.target.reset();status("Draft assessment created. Now add its questions.");await loadAssessments()}catch(err){status(err.message)}});
$("assessmentQuestionType").addEventListener("change",e=>{$("assessmentMcqFields").style.display=e.target.value==="mcq"?"block":"none"});
$("assessmentQuestionForm").addEventListener("submit",async e=>{e.preventDefault();try{if(!allowed)throw new Error("Administrator permission is required.");const aid=$("assessmentSelect").value,type=$("assessmentQuestionType").value,marks=Number($("assessmentQuestionMarks").value);if(!aid)throw new Error("Select an assessment.");if(!Number.isInteger(marks)||marks<1)throw new Error("Enter valid marks.");const old=await getDocs(collection(db(),"assessments",aid,"questions"));const qref=doc(collection(db(),"assessments",aid,"questions"));const data={type,question:$("assessmentQuestionText").value.trim(),marks,order:old.size+1,createdAt:serverTimestamp()};if(type==="mcq"){const options={A:$("assessmentOptionA").value.trim(),B:$("assessmentOptionB").value.trim(),C:$("assessmentOptionC").value.trim(),D:$("assessmentOptionD").value.trim()};if(Object.values(options).some(x=>!x))throw new Error("Fill all four MCQ options.");data.options=options;await setDoc(doc(db(),"assessments",aid,"answerKeys",qref.id),{correctOption:$("assessmentCorrect").value,marks})}await setDoc(qref,data);e.target.reset();$("assessmentMcqFields").style.display="block";status("Assessment question added successfully.")}catch(err){status(err.message)}});
