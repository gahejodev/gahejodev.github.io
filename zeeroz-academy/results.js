import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {collection,getDocs,query,orderBy} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const host=document.getElementById("results");
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 try{
  const q=query(collection(window.ZeerozFirebase.db,"students",user.uid,"quizAttempts"),orderBy("createdAt","desc"));
  const snap=await getDocs(q);host.replaceChildren();
  if(snap.empty){host.textContent="You have not attempted any quizzes yet.";return}
  snap.docs.forEach(d=>{
   const x=d.data(),card=document.createElement("article");card.className="card";
   const h=document.createElement("h2");h.textContent=x.chapterTitle||"Chapter quiz";
   const p=document.createElement("p");p.textContent=x.courseTitle||"";
   const score=document.createElement("strong");score.textContent="Score: "+x.score+"/"+x.totalQuestions+" · "+x.percentage+"%";
   const date=document.createElement("p");date.className="muted";date.textContent=x.createdAt?.toDate?x.createdAt.toDate().toLocaleString():"Recently completed";
   card.append(h,p,score,date);host.append(card);
  });
 }catch(e){host.textContent="Unable to load results: "+e.message}
});
