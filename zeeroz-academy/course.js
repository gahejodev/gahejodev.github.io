import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id),db=()=>window.ZeerozFirebase.db;
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 const id=new URLSearchParams(location.search).get("id"),host=$("learningContent");
 if(!id){$("courseTitle").textContent="Course not found";$("courseDescription").textContent="No course was selected. Return to the Student Dashboard.";host.textContent="Please open a course from your dashboard.";return}
 try{
  const snap=await getDoc(doc(db(),"courses",id));
  if(!snap.exists()||snap.data().published!==true){$("courseTitle").textContent="Course not available";$("courseDescription").textContent="This course may have been unpublished or removed.";host.textContent="Please return to the Student Dashboard.";return}
  const data=snap.data();$("courseTitle").textContent=data.title||"Untitled course";$("courseDescription").textContent=data.description||"No course description has been added yet.";
  const chaptersSnap=await getDocs(collection(db(),"courses",id,"chapters"));
  const chapters=chaptersSnap.docs.map(d=>({id:d.id,...d.data()})).filter(c=>c.published===true).sort((a,b)=>(a.order||0)-(b.order||0));
  host.replaceChildren();
  if(!chapters.length){host.className="empty";host.textContent="No chapters have been added yet. Please check again later.";return}
  host.className="";
  for(let i=0;i<chapters.length;i++){
   const chapter=chapters[i],card=node("article","chapter"),heading=node("h3","",`Chapter ${chapter.order||i+1}: ${chapter.title||"Untitled chapter"}`);
   card.append(heading);if(chapter.description)card.append(node("p","muted",chapter.description));
   const lessonSnap=await getDocs(collection(db(),"courses",id,"chapters",chapter.id,"lessons"));
   const lessons=lessonSnap.docs.map(d=>({id:d.id,...d.data()})).filter(l=>l.published===true).sort((a,b)=>(a.order||0)-(b.order||0));
   if(!lessons.length)card.append(node("p","muted","Lessons will be added soon."));
   lessons.forEach((lesson,j)=>{
    const item=node("section","lesson");item.append(node("strong","",`Lesson ${lesson.order||j+1}: ${lesson.title||"Untitled lesson"}`));
    if(lesson.type==="text")item.append(node("p","lesson-content",lesson.content||""));
    else if(lesson.type==="video"){const a=node("a","", "Open video lesson");a.href=lesson.content;a.target="_blank";a.rel="noopener noreferrer";item.append(node("p","", "Video lesson: "),a)}
    else if(lesson.type==="pdf"){const a=node("a","", "Open PDF / notes");a.href=lesson.content;a.target="_blank";a.rel="noopener noreferrer";item.append(node("p","", "Study material: "),a)}
    else item.append(node("p","muted",lesson.content||""));
    card.append(item)
   });
   host.append(card)
  }
 }catch(error){console.error(error);host.className="empty";host.textContent="Unable to load course content. Please check your connection or contact the Academy administrator."}
});
