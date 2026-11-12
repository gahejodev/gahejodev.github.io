import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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
 const el=$("courses");el.innerHTML="";
 if(!items.length){el.textContent="No published courses yet. Please check back soon.";return}
 for(const item of items){
  const link=document.createElement("a");
  link.className="course-link";
  link.href="./course.html?id="+encodeURIComponent(item.id);
  link.setAttribute("aria-label","Open course "+(item.title||"Untitled"));
  const box=document.createElement("article");box.className="item course-item";
  const h=document.createElement("strong");h.textContent=item.title||"Untitled";
  const p=document.createElement("p");p.className="muted";p.textContent=item.description||"Open this course to view its learning details.";
  const action=document.createElement("span");action.className="course-action";action.textContent="View course →";
  box.append(h,p,action);link.append(box);el.append(link);
 }
}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 $("hello").textContent="Welcome, "+(user.displayName||"Student");$("email").textContent=user.email||"";
 try{
  const db=window.ZeerozFirebase.db;
  const [c,a]=await Promise.all([
   getDocs(query(collection(db,"courses"),where("published","==",true),limit(50))),
   getDocs(query(collection(db,"announcements"),where("published","==",true),limit(30)))
  ]);
  const courseItems=c.docs.map(x=>({id:x.id,...x.data()})).sort((x,y)=>(x.title||"").localeCompare(y.title||""));
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