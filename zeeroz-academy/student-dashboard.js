import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {getGrades,getSubject,sortCoursePackages,sortSequence} from "./course-order.mjs";
const $=id=>document.getElementById(id);
$("logout").addEventListener("click",async()=>{if(window.ZeerozFirebase)await signOut(window.ZeerozFirebase.auth);location.href="./student-login.html"});
function renderAnnouncements(target,items,empty){
 const el=$(target);el.innerHTML="";
 if(!items.length){el.textContent=empty;return}
 for(const d of items){const box=document.createElement("article");box.className="item";const h=document.createElement("strong");h.textContent=d.title||"Untitled";const p=document.createElement("p");p.className="muted";p.textContent=d.message||"";box.append(h,p);el.append(box);}
}
function addStyles(){
 if(document.getElementById("coursePathStyles"))return;
 const style=document.createElement("style");style.id="coursePathStyles";style.textContent=`
 #courses{margin-top:12px}.course-path{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 14px}.course-path span{background:#edf2fb;color:#53617a;border-radius:9px;padding:8px 11px;font-size:11px;font-weight:850}.course-path span.active{background:#071b49;color:#fff}.course-select-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.course-select-card{width:100%;text-align:left;background:#f9fbff;border:1px solid #e1e9f6;border-radius:14px;padding:16px;cursor:pointer;color:#071b49}.course-select-card:hover{border-color:#0757e8;background:#f1f6ff}.course-select-card strong{display:block;font-size:15px}.course-select-card small{display:block;color:#65718a;margin-top:5px;font-size:11px}.course-chapter-list{display:grid;gap:9px}.course-chapter{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#f9fbff;border:1px solid #e1e9f6;border-radius:13px;padding:14px}.course-chapter strong{display:block;color:#071b49}.course-chapter small{display:block;color:#65718a;margin-top:4px}.course-chapter a{color:#0757e8;font-size:12px;font-weight:850;white-space:nowrap}.course-back{border:1px solid #d8e2f2;background:#fff;color:#071b49;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer;margin-bottom:12px}.course-help{font-size:12px;color:#65718a;margin:0 0 12px}@media(max-width:600px){.course-select-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.course-select-card{padding:13px}.course-chapter{align-items:flex-start;flex-direction:column}.course-chapter a{white-space:normal}}`;
 document.head.append(style);
}
let courseRecords=[],selectedGrade=null,selectedSubject=null;
function chapterBelongsToGrade(ch,record,grade){const chapterGrades=getGrades(ch);return chapterGrades.length?chapterGrades.includes(grade):record.grades.length===1&&record.grades[0]===grade;}
function renderCourses(){
 const el=$("courses");el.replaceChildren();el.classList.remove("empty");addStyles();
 const path=document.createElement("div");path.className="course-path";
 [["1. Select class",selectedGrade===null],["2. Select subject",selectedGrade!==null&&selectedSubject===null],["3. Select chapter",selectedSubject!==null]].forEach(([label,active])=>{const s=document.createElement("span");s.textContent=label;if(active)s.classList.add("active");path.append(s)});el.append(path);
 const back=document.createElement("button");back.className="course-back";back.textContent="← Back";back.hidden=selectedGrade===null;back.addEventListener("click",()=>{if(selectedSubject!==null)selectedSubject=null;else selectedGrade=null;renderCourses()});el.append(back);
 const records=courseRecords.filter(r=>!selectedGrade||r.grades.includes(selectedGrade));
 if(selectedGrade===null){
  const grid=document.createElement("div");grid.className="course-select-grid";
  ["IX","X","XI","XII"].forEach(g=>{const rows=courseRecords.filter(r=>r.grades.includes(g));const subjects=new Set(rows.map(r=>r.subject));const card=document.createElement("button");card.className="course-select-card";const strong=document.createElement("strong");strong.textContent="Class "+g;const small=document.createElement("small");small.textContent=subjects.size+" subjects available";card.append(strong,small);card.addEventListener("click",()=>{selectedGrade=g;selectedSubject=null;renderCourses()});grid.append(card)});
  el.append(grid);return;
 }
 if(selectedSubject===null){
  const subjects=[...new Set(records.map(r=>r.subject))].sort((x,y)=>x.localeCompare(y));
  if(!subjects.length){el.textContent="No published subjects for this class yet.";return}
  const grid=document.createElement("div");grid.className="course-select-grid";
  subjects.forEach(subject=>{const rows=records.filter(r=>r.subject===subject);const count=rows.reduce((n,r)=>n+r.chapters.length,0);const card=document.createElement("button");card.className="course-select-card";const strong=document.createElement("strong");strong.textContent=subject;const small=document.createElement("small");small.textContent=count+" chapters";card.append(strong,small);card.addEventListener("click",()=>{selectedSubject=subject;renderCourses()});grid.append(card)});
  el.append(grid);return;
 }
 const rows=records.filter(r=>r.subject===selectedSubject),list=document.createElement("div");list.className="course-chapter-list";
 rows.forEach(r=>r.chapters.filter(ch=>chapterBelongsToGrade(ch,r,selectedGrade)).forEach(ch=>{const item=document.createElement("article");item.className="course-chapter";const info=document.createElement("div"),title=document.createElement("strong"),meta=document.createElement("small");title.textContent=ch.title||"Untitled chapter";meta.textContent=(r.title||selectedSubject)+" · "+(ch.lessonCount??0)+" lessons";info.append(title,meta);const link=document.createElement("a");link.href="./course.html?id="+encodeURIComponent(r.id)+"&chapter="+encodeURIComponent(ch.id);link.textContent="Open chapter →";item.append(info,link);list.append(item)}));
 if(!list.children.length){el.textContent="No published chapters in this subject yet.";}else el.append(list);
}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 $("hello").textContent="Welcome, "+(user.displayName||"Student");$("email").textContent=user.email||"";
 try{
  const db=window.ZeerozFirebase.db;
  const [c,a]=await Promise.all([getDocs(query(collection(db,"courses"),where("published","==",true))),getDocs(query(collection(db,"announcements"),where("published","==",true),limit(30)))]);
  const courses=c.docs.map(x=>({id:x.id,...x.data()}));
  courseRecords=(await Promise.all(courses.map(async course=>{
   const grades=getGrades(course);if(!grades.length)return null;
   const snap=await getDocs(query(collection(db,"courses",course.id,"chapters"),where("published","==",true)));
   const chapters=sortSequence(snap.docs.map(d=>({id:d.id,...d.data()})));
   return {id:course.id,title:course.title||"Untitled course",subject:getSubject(course),grades,chapters};
  }))).filter(Boolean);
  courseRecords=sortCoursePackages(courseRecords);
  renderCourses();
  const announcementItems=a.docs.map(x=>x.data()).sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0));
  renderAnnouncements("announcements",announcementItems,"No announcements yet.");
 }catch(e){$("courses").textContent="Unable to load courses. Ask the Academy administrator to check Firestore setup.";renderAnnouncements("announcements",[],"Unable to load announcements.");console.error(e)}
});