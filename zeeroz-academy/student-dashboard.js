import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id);
$("logout").addEventListener("click",async()=>{if(window.ZeerozFirebase)await signOut(window.ZeerozFirebase.auth);location.href="./student-login.html"});
function renderList(target,items,empty){const el=$(target);el.innerHTML="";if(!items.length){el.textContent=empty;return}for(const d of items){const box=document.createElement("article");box.className="item";const h=document.createElement("strong");h.textContent=d.title||"Untitled";const p=document.createElement("p");p.className="muted";p.textContent=d.description||d.message||"";box.append(h,p);el.append(box)}}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 $("hello").textContent="Welcome, "+(user.displayName||"Student");$("email").textContent=user.email||"";
 try{
  const db=window.ZeerozFirebase.db;
  const [c,a]=await Promise.all([
   getDocs(query(collection(db,"courses"),where("published","==",true),limit(50))),
   getDocs(query(collection(db,"announcements"),where("published","==",true),limit(30)))
  ]);
  const courseItems=c.docs.map(x=>x.data()).sort((x,y)=>(x.title||"").localeCompare(y.title||""));
  const announcementItems=a.docs.map(x=>x.data()).sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0));
  renderList("courses",courseItems,"No published courses yet. Please check back soon.");
  renderList("announcements",announcementItems,"No announcements yet.");
 }catch(e){renderList("courses",[],"Unable to load courses. Ask the Academy administrator to check Firestore setup.");renderList("announcements",[],"Unable to load announcements.");console.error(e)}
});
