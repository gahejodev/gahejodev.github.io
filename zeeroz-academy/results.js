import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {collection,getDocs,query,where,orderBy} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const host=document.getElementById("results");
function card(title,subtitle,score,date){const c=document.createElement("article");c.className="card";const h=document.createElement("h2");h.textContent=title;const p=document.createElement("p");p.textContent=subtitle;const s=document.createElement("strong");s.textContent=score;const d=document.createElement("p");d.className="muted";d.textContent=date;c.append(h,p,s,d);return c}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 try{
  const db=window.ZeerozFirebase.db;
  const oldQ=query(collection(db,"students",user.uid,"quizAttempts"),orderBy("createdAt","desc"));
  const oldSnap=await getDocs(oldQ);const items=oldSnap.docs.map(d=>({kind:"practice",data:d.data()}));
  const as=await getDocs(query(collection(db,"assessments"),where("published","==",true)));
  for(const a of as.docs){const attempts=await getDocs(query(collection(db,"assessments",a.id,"attempts"),where("uid","==",user.uid)));attempts.docs.forEach(d=>items.push({kind:"assessment",assessmentId:a.id,attemptId:d.id,data:d.data()}))}
  items.sort((a,b)=>(b.data.createdAt?.seconds||b.data.submittedAt?.seconds||0)-(a.data.createdAt?.seconds||a.data.submittedAt?.seconds||0));
  host.replaceChildren();if(!items.length){host.textContent="You have not attempted any quizzes or assessments yet.";return}
  items.forEach(item=>{const x=item.data;const title=x.chapterTitle||x.assessmentTitle||"Assessment";const subtitle=x.courseTitle||("Status: "+(x.status||"Submitted"));const score=x.status==="graded"?"Score: "+x.score+"/"+x.totalMarks+" · "+x.percentage+"%":(x.percentage!==undefined?"Score: "+x.score+"/"+x.totalQuestions+" · "+x.percentage+"%":"Awaiting teacher review");const date=x.createdAt?.toDate?x.createdAt.toDate().toLocaleString():x.submittedAt?.toDate?x.submittedAt.toDate().toLocaleString():"Recently completed";const c=card(title,subtitle,score,date);if(item.kind==="assessment"&&x.status==="graded"&&x.percentage>=50){const link=document.createElement("a");link.className="btn";link.href="./certificate.html?assessmentId="+encodeURIComponent(item.assessmentId)+"&attemptId="+encodeURIComponent(item.attemptId);link.textContent="View certificate";c.append(link)}if(item.kind==="assessment"&&x.feedback){const f=document.createElement("p");f.textContent="Teacher feedback: "+x.feedback;c.append(f)}host.append(c)});
 }catch(e){host.textContent="Unable to load results: "+e.message}
});
