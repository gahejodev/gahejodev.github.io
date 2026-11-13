import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {collection,doc,getDoc,getDocs,query,where,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id),db=()=>window.ZeerozFirebase.db;
const params=new URLSearchParams(location.search),courseId=params.get("courseId"),chapterId=params.get("chapterId");
let user=null,questions=[],courseTitle="",chapterTitle="";
const language=localStorage.getItem("zeerozCourseLanguage")||"en";
const translated=(q,field)=>language==="en"?(q[field]||""):(q.translations?.[language]?.[field]||q[field]||"");
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
onAuthStateChanged(window.ZeerozFirebase.auth,async u=>{
 const languageSelect=$("quizLanguage");if(languageSelect){languageSelect.value=language;languageSelect.addEventListener("change",()=>{localStorage.setItem("zeerozCourseLanguage",languageSelect.value);location.reload()});}
 if(!u){location.href="./student-login.html";return}user=u;
 if(!courseId||!chapterId){$("quizTitle").textContent="Quiz not found";$("quizInfo").textContent="Open a quiz from a course chapter.";return}
 try{
  const pair=await Promise.all([getDoc(doc(db(),"courses",courseId)),getDoc(doc(db(),"courses",courseId,"chapters",chapterId))]);
  const c=pair[0],ch=pair[1];
  if(!c.exists()||!ch.exists()||c.data().published!==true||ch.data().published!==true)throw new Error("This chapter is not available.");
  courseTitle=c.data().title||"Course";chapterTitle=ch.data().title||"Chapter";
  $("quizTitle").textContent=chapterTitle+" · Practice Quiz";$("quizInfo").textContent=courseTitle;
  const qs=await getDocs(query(collection(db(),"courses",courseId,"chapters",chapterId,"questions"),where("published","==",true)));
  questions=qs.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order||0)-(b.order||0));
  const host=$("questions");host.replaceChildren();
  if(!questions.length){host.append(el("p","status","No published MCQs are available for this chapter yet."));$("submitQuiz").disabled=true;return}
  questions.forEach((q,i)=>{
   const card=el("section","question");card.append(el("h3","",(i+1)+". "+(translated(q,"question")||"Question")));
   ["A","B","C","D"].forEach(k=>{const label=el("label","option");const input=document.createElement("input");input.type="radio";input.name=q.id;input.value=k;input.required=true;label.append(input,document.createTextNode(k+". "+(language==="en"?(q.options?.[k]||""):(q.translations?.[language]?.options?.[k]||q.options?.[k]||"")) ));card.append(label)});
   host.append(card);
  });
 }catch(e){$("quizInfo").textContent=e.message;$("submitQuiz").disabled=true}
});
$("quizForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!user||!questions.length)return;
 const answers={};let correct=0;
 for(const q of questions){const picked=document.querySelector('input[name="'+CSS.escape(q.id)+'"]:checked');if(!picked){$("result").textContent="Please answer every question.";return}answers[q.id]=picked.value;if(picked.value===q.correctOption)correct++}
 const total=questions.length,percentage=Math.round((correct/total)*100),result=$("result");
 $("submitQuiz").disabled=true;
 try{
  await addDoc(collection(db(),"students",user.uid,"quizAttempts"),{uid:user.uid,courseId,chapterId,courseTitle,chapterTitle,totalQuestions:total,correctAnswers:correct,score:correct,percentage,answers,createdAt:serverTimestamp()});
  const panel=el("section","result");panel.append(el("h2","","Quiz completed!"),el("p","","Your score: "+correct+" / "+total),el("p","","Percentage: "+percentage+"%"));
  questions.forEach((q,i)=>panel.append(el("p","",(i+1)+". "+(answers[q.id]===q.correctOption?"Correct":"Incorrect")+" — Correct answer: "+q.correctOption+(translated(q,"explanation")?" · "+translated(q,"explanation"):""))));
  const link=el("a","btn","View all results");link.href="./results.html";panel.append(link);result.replaceChildren(panel);
 }catch(err){$("submitQuiz").disabled=false;result.textContent="Could not save your result: "+err.message}
});
