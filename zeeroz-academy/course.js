import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=id=>document.getElementById(id),db=()=>window.ZeerozFirebase.db;
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}

function inlineFormat(parent,text){
 const pattern=/(!\[([^\]]*)\]\((https:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*]+)\*)/g;
 let last=0,match;
 while((match=pattern.exec(text))){
  if(match.index>last)parent.append(document.createTextNode(text.slice(last,match.index)));
  if(match[1]){
   const figure=node("figure","lesson-figure"),img=node("img","lesson-image");
   img.src=match[3];img.alt=match[2]||"Educational illustration";img.loading="lazy";img.decoding="async";
   img.addEventListener("error",()=>{figure.remove();});
   figure.append(img);if(match[2])figure.append(node("figcaption","",match[2]));parent.append(figure);
  }else if(match[4]){const strong=node("strong","");strong.textContent=match[5];parent.append(strong);}
  else if(match[6]){const code=node("code","inline-code",match[7]);parent.append(code);}
  else if(match[8]){const em=node("em","");em.textContent=match[9];parent.append(em);}
  last=pattern.lastIndex;
 }
 if(last<text.length)parent.append(document.createTextNode(text.slice(last)));
}

function renderMarkdown(container,source){
 container.replaceChildren();
 const lines=String(source||"").replace(/\r/g,"").split("
");
 let i=0;
 while(i<lines.length){
  const line=lines[i].trim();
  if(!line){i++;continue;}
  if(/^\|.*\|$/.test(line)){
   const rows=[];while(i<lines.length&&/^\|.*\|$/.test(lines[i].trim())){rows.push(lines[i].trim().slice(1,-1).split("|").map(x=>x.trim()));i++;}
   const useful=rows.filter(r=>!r.every(c=>/^:?-{3,}:?$/.test(c)));
   if(useful.length){const table=node("table","lesson-table"),thead=node("thead",""),tbody=node("tbody","");useful.forEach((r,ri)=>{const tr=node("tr","");r.forEach(cell=>{const el=node(ri===0?"th":"td","");inlineFormat(el,cell);tr.append(el)});(ri===0?thead:tbody).append(tr)});table.append(thead,tbody);container.append(table)}
   continue;
  }
  const heading=line.match(/^(#{1,3})\s+(.+)$/);
  if(heading){const level=Math.min(4,Number(heading[1].length)+1),h=node("h"+level,"lesson-heading");inlineFormat(h,heading[2]);container.append(h);i++;continue;}
  if(/^---+$/.test(line)){container.append(node("hr","lesson-rule"));i++;continue;}
  if(/^>\s?/.test(line)){const quote=node("aside","lesson-callout");inlineFormat(quote,line.replace(/^>\s?/,""));container.append(quote);i++;continue;}
  if(/^[-*]\s+/.test(line)){
   const list=node("ul","lesson-list");
   while(i<lines.length&&/^\s*[-*]\s+/.test(lines[i])){const li=node("li","");inlineFormat(li,lines[i].replace(/^\s*[-*]\s+/,""));list.append(li);i++;}
   container.append(list);continue;
  }
  if(/^\d+[.)]\s+/.test(line)){
   const list=node("ol","lesson-list");
   while(i<lines.length&&/^\s*\d+[.)]\s+/.test(lines[i])){const li=node("li","");inlineFormat(li,lines[i].replace(/^\s*\d+[.)]\s+/,""));list.append(li);i++;}
   container.append(list);continue;
  }
  const p=node("p","lesson-paragraph");inlineFormat(p,line);container.append(p);i++;
 }
}

onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return;}
 const id=new URLSearchParams(location.search).get("id"),host=$("learningContent");
 if(!id){$("courseTitle").textContent="Course not found";$("courseDescription").textContent="No course was selected. Return to the Student Dashboard.";host.textContent="Please open a course from your dashboard.";return;}
 try{
  const snap=await getDoc(doc(db(),"courses",id));
  if(!snap.exists()||snap.data().published!==true){$("courseTitle").textContent="Course not available";$("courseDescription").textContent="This course may have been unpublished or removed.";host.textContent="Please return to the Student Dashboard.";return;}
  const data=snap.data();$("courseTitle").textContent=data.title||"Untitled course";$("courseDescription").textContent=data.description||"No course description has been added yet.";
  const chaptersSnap=await getDocs(query(collection(db(),"courses",id,"chapters"),where("published","==",true)));
  const chapters=chaptersSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order||0)-(b.order||0));
  host.replaceChildren();if(!chapters.length){host.className="empty";host.textContent="No chapters have been added yet. Please check again later.";return;}host.className="";
  let lessonTotal=0;
  const prepared=[];
  for(let i=0;i<chapters.length;i++){
   const chapter=chapters[i];
   const lessonSnap=await getDocs(query(collection(db(),"courses",id,"chapters",chapter.id,"lessons"),where("published","==",true)));
   const lessons=lessonSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order||0)-(b.order||0));
   lessonTotal+=lessons.length;prepared.push({chapter,lessons,written});
  }
  const stats=node("div","course-stats");
  [["CHAPTERS",chapters.length],["LESSONS",lessonTotal],["YOUR STUDY SPACE","Ready"]].forEach(([label,value])=>{const box=node("div","course-stat");box.append(node("span","",label),node("strong","",String(value)));stats.append(box)});
  host.append(stats);
  prepared.forEach(({chapter,lessons,written},i)=>{
   const card=node("article","chapter");
   const top=node("div","chapter-top");
   top.append(node("span","chapter-number","CHAPTER "+String(chapter.order||i+1).padStart(2,"0")),node("span","chapter-count",lessons.length+" learning "+(lessons.length===1?"lesson":"lessons")));
   const heading=node("h2","chapter-title",chapter.title||"Untitled chapter");top.append(heading);card.append(top);
   if(chapter.description)card.append(node("p","chapter-description",chapter.description));
   if(!lessons.length)card.append(node("p","muted","Lessons will be added soon."));
   lessons.forEach((lesson,j)=>{
    const item=node("section","lesson");
    const lessonHead=node("div","lesson-head");
    lessonHead.append(node("span","lesson-index",String(lesson.order||j+1).padStart(2,"0")),node("div","lesson-head-copy"));
    lessonHead.lastChild.append(node("span","lesson-label","LEARNING LESSON"),node("h3","lesson-title",lesson.title||"Untitled lesson"));
    item.append(lessonHead);
    if(lesson.type==="text"){const body=node("div","lesson-content");renderMarkdown(body,lesson.content||"");item.append(body);}
    else if(lesson.type==="video"||lesson.type==="pdf"){
     const a=node("a","resource-link",lesson.type==="video"?"Watch video lesson":"Open study PDF");a.href=lesson.content;a.target="_blank";a.rel="noopener noreferrer";item.append(a);
    }else{const body=node("div","lesson-content");renderMarkdown(body,lesson.content||"");item.append(body);}
    card.append(item);
   });
   const writtenSnap=await getDocs(query(collection(db(),"courses",id,"chapters",chapter.id,"writtenQuestions"),where("published","==",true)));
   const written=writtenSnap.docs.map(d=>d.data()).sort((a,b)=>(a.order||0)-(b.order||0));
   if(written.length){const practice=node("section","written-practice");practice.append(node("h3","chapter-title","Written practice — CRQs and ERQs"));written.forEach((q,qi)=>{const block=node("article","written-question");block.append(node("h4","lesson-title",(q.type||"").toUpperCase()+" "+(qi+1)+" · "+(q.marks||0)+" marks"));block.append(node("p","lesson-paragraph",q.question));const details=node("details","answer-details");details.append(node("summary","","View model answer and marking guide"));const answer=node("div","lesson-content");renderMarkdown(answer,q.modelAnswer||"");details.append(answer);if(Array.isArray(q.rubric)&&q.rubric.length){const rubric=node("ul","lesson-list");q.rubric.forEach(item=>rubric.append(node("li","",item)));details.append(node("h4","lesson-title","Marking guide"),rubric)}block.append(details);practice.append(block)});card.append(practice)}
   const quizLink=node("a","quiz-button","Practice this chapter");quizLink.href="./quiz.html?courseId="+encodeURIComponent(id)+"&chapterId="+encodeURIComponent(chapter.id);card.append(quizLink);
   host.append(card);
  });
 }catch(error){console.error(error);host.className="empty";host.textContent="Unable to load course content. Please check your connection or contact the Academy administrator.";}
});
