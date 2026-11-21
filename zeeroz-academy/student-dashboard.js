import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {getGrade,getSubject,sortCoursePackages} from "./course-order.mjs";
const $=id=>document.getElementById(id);
$("logout").addEventListener("click",async()=>{if(window.ZeerozFirebase)await signOut(window.ZeerozFirebase.auth);location.href="./student-login.html"});
function renderAnnouncements(target,items,empty){
 const el=$(target);el.innerHTML="";
 if(!items.length){el.textContent=empty;return}
 for(const d of items){
  const box=document.createElement("article");box.className="item";
  const h=document.createElement("strong");h.textContent=d.title||"Untitled";
  const p=document.createElement("p");p.className="muted";p.textContent=d.message||"";
  box.append(h,p);el.append(box);
 }
}
function renderCourses(items){
 const el=$("courses");el.replaceChildren();el.classList.remove("empty");
 if(!items.length){el.classList.add("empty");el.textContent="No published courses yet. Please check back soon.";return}
 if(!document.getElementById("courseGroupStyles")){const style=document.createElement("style");style.id="courseGroupStyles";style.textContent=".course-subject-group{margin:15px 0 20px}.course-group-heading{font-size:13px;color:#3157d5;margin:0 0 9px;padding-bottom:8px;border-bottom:1px solid #e5eaf4}.course-group-list{display:grid;gap:8px}.course-group-list .course-item{margin:0}";document.head.append(style)}
 const groups=new Map();for(const item of sortCoursePackages(items)){const grade=getGrade(item),subject=getSubject(item),key=grade+"|"+subject;if(!groups.has(key))groups.set(key,{grade,subject,items:[]});groups.get(key).items.push(item)}
 for(const g of groups.values()){const section=document.createElement("section");section.className="course-subject-group";const heading=document.createElement("h3");heading.className="course-group-heading";heading.textContent=(g.grade?"Class "+g.grade+" · ":"")+g.subject;const list=document.createElement("div");list.className="course-group-list";for(const item of g.items){const link=document.createElement("a");link.className="course-link";link.href="./course.html?id="+encodeURIComponent(item.id);link.setAttribute("aria-label","Open course "+(item.title||"Untitled"));const box=document.createElement("article");box.className="item course-item";const h=document.createElement("strong");h.textContent=item.title||"Untitled";const p=document.createElement("p");p.className="muted";p.textContent=item.description||"Open this course to view its learning details.";const action=document.createElement("span");action.className="course-action";action.textContent="View course →";box.append(h,p,action);link.append(box);list.append(link)}section.append(heading,list);el.append(section)}
}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 $("hello").textContent="Welcome, "+(user.displayName||"Student");$("email").textContent=user.email||"";
 try{
  const db=window.ZeerozFirebase.db;
  const [c,a]=await Promise.all([
   getDocs(query(collection(db,"courses"),where("published","==",true))),
   getDocs(query(collection(db,"announcements"),where("published","==",true),limit(30)))
  ]);
  const courseItems=c.docs.map(x=>({id:x.id,...x.data()}));
  const announcementItems=a.docs.map(x=>x.data()).sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0));
  renderCourses(courseItems);
  renderAnnouncements("announcements",announcementItems,"No announcements yet.");
 }catch(e){
  renderCourses([]);
  $("courses").textContent="Unable to load courses. Ask the Academy administrator to check Firestore setup.";
  renderAnnouncements("announcements",[],"Unable to load announcements.");
  console.error(e);
 }
});