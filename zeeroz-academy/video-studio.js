import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
const $=id=>document.getElementById(id);
let packages=[],courseData=null,scenes=[],sceneIndex=0,allowed=false,playbackToken=0;
const status=m=>$("status").textContent=m;
function clean(s){return String(s||"").replace(/!\[[^\]]*\]\([^)]*\)/g,"").replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/^\s*[-*]\s+/gm,"").replace(/^\s*\d+[.)]\s+/gm,"").replace(/\s+/g," ").trim()}
function fill(select,items,placeholder){select.replaceChildren(new Option(placeholder,""));items.forEach((x,i)=>select.add(new Option(x.label,String(i))));select.disabled=!items.length}
async function init(){const reg=await fetch("./content/courses/index.json",{cache:"no-store"});if(!reg.ok)throw new Error("Course registry could not be loaded.");const data=await reg.json();packages=data.packages||[];fill($("course"),packages.map(p=>({label:p.title})),"Choose a course package")}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){document.body.innerHTML="<main style='font:16px system-ui;max-width:560px;margin:12vh auto;padding:24px'><h2>Admin sign-in required</h2><p>Please sign in with your Academy administrator account.</p><a href='./student-login.html'>Open sign-in</a></main>";return}
 try{const token=await user.getIdTokenResult(true);if(token.claims.admin!==true){document.body.innerHTML="<main style='font:16px system-ui;max-width:560px;margin:12vh auto;padding:24px'><h2>Access denied</h2><p>This account is not authorised as an Academy administrator.</p><a href='./student-dashboard.html'>Return to Student Desk</a></main>";return}allowed=true;await init()}catch(e){status("Studio could not start: "+e.message)}
});
$("course").addEventListener("change",async()=>{const p=packages[Number($("course").value)];courseData=null;fill($("chapter"),[],"Loading chapters…");fill($("lesson"),[],"Select a chapter first");$("loadLesson").disabled=true;if(!p)return;try{const r=await fetch("./content/courses/"+p.id+".json");if(!r.ok)throw new Error("Course package unavailable.");courseData=await r.json();fill($("chapter"),(courseData.chapters||[]).map(c=>({label:c.title})),"Choose a chapter");status("Course loaded: "+p.title)}catch(e){status(e.message)}});
$("chapter").addEventListener("change",()=>{const ch=courseData?.chapters?.[Number($("chapter").value)];fill($("lesson"),(ch?.lessons||[]).map(l=>({label:l.title})),"Choose a lesson");$("loadLesson").disabled=!ch?.lessons?.length});
function makeSceneList(markdown){const sections=[];let heading="Lesson introduction",lines=[],image="";for(const raw of markdown.split(/\r?\n/)){const line=raw.trim();if(!line||line==="---")continue;const im=line.match(/^!\[[^\]]*\]\(([^)]+)\)/);if(im){image=im[1];continue}const m=line.match(/^#{1,3}\s+(.+)$/);if(m){if(lines.length)sections.push({title:heading,body:lines.join(" "),image});heading=clean(m[1]);lines=[];image=""}else{const t=clean(line);if(t)lines.push(t)}}if(lines.length)sections.push({title:heading,body:lines.join(" "),image});const result=[];sections.forEach(s=>{const sentences=s.body.match(/[^.!?]+[.!?]?/g)||[s.body];let buf="";sentences.forEach(part=>{const t=part.trim();if(!t)return;if(buf&&buf.length+t.length>420){result.push({title:s.title,narration:buf.trim(),image:s.image});buf=""}buf+=(buf?" ":"")+t});if(buf)result.push({title:s.title,narration:buf.trim(),image:s.image})});return result}
$("loadLesson").addEventListener("click",()=>{if(!allowed)return;const chapter=courseData.chapters[Number($("chapter").value)],lesson=chapter.lessons[Number($("lesson").value)];window.currentLesson={course:courseData.title,chapter:chapter.title,lesson};$("videoTitle").value=lesson.title+" | "+courseData.title;$("editor").hidden=false;$("previewCard").hidden=true;scenes=[];$("sceneList").replaceChildren();$("scriptOutput").value="";status("Lesson ready. Generate the storyboard when ready.")});
function drawScene(){const s=scenes[sceneIndex];if(!s)return;$("slideKicker").textContent=(courseData?.title||"ZEEROZ ACADEMY").toUpperCase();$("slideTitle").textContent=s.title;const pts=s.narration.match(/.{1,115}(?:\s|$)/g)||[s.narration];$("slidePoints").replaceChildren(...pts.slice(0,4).map(t=>{const p=document.createElement("p");p.textContent="• "+t.trim();return p}));const visual=$("slideVisual");visual.replaceChildren();if(s.image&&s.image.startsWith("assets/images/biology/")&&!s.image.includes("..")){const img=document.createElement("img");img.src="./"+s.image;img.alt=s.title+" teaching diagram";img.loading="lazy";img.onerror=()=>{visual.textContent="Diagram unavailable for this lesson section."};visual.append(img)}else{const steps=s.narration.split(/[,;:]|\b(?:then|next|finally|and)\b/i).map(x=>x.trim()).filter(x=>x.length>3).slice(0,5);const flow=document.createElement("div");flow.className="diagram";steps.forEach((x,i)=>{const node=document.createElement("span");node.textContent=x.slice(0,42);if(i===sceneIndex%Math.max(steps.length,1))node.classList.add("active");flow.append(node)});visual.append(flow)}$("sceneNarration").value=s.narration;$("sceneCounter").textContent="Scene "+(sceneIndex+1)+" of "+scenes.length;$("prevScene").disabled=sceneIndex===0;$("nextScene").disabled=sceneIndex===scenes.length-1;$("progress").style.width=((sceneIndex+1)/scenes.length*100)+"%"}
function renderList(){const host=$("sceneList");host.replaceChildren();scenes.forEach((s,i)=>{const card=document.createElement("article");card.className="scene";const title=document.createElement("strong");title.textContent=(i+1)+". "+s.title;const p=document.createElement("p");p.textContent=s.narration;const edit=document.createElement("button");edit.className="secondary";edit.textContent="Preview this scene";edit.addEventListener("click",()=>{sceneIndex=i;drawScene()});card.append(title,p,edit);host.append(card)});$("speakAll").disabled=!scenes.length;$("previewCard").hidden=!scenes.length;$("scriptOutput").value=scenes.map((x,n)=>"SCENE "+(n+1)+": "+x.title+"\n"+x.narration).join("\n\n");sceneIndex=0;drawScene()}
function getSelectedLessonContent(){const lesson=window.currentLesson?.lesson;if(!lesson)return "";const lang=$("language").value||"en";if(lang!=="en"){const translated=lesson.explanations?.[lang];if(typeof translated==="string"&&translated.trim())return translated;status((lang==="ur"?"Urdu":"Sindhi")+" explanation is not available for this lesson; English content will be used.");}return lesson.content||""}
$("makeScenes").addEventListener("click",()=>{const lesson=window.currentLesson?.lesson;if(!lesson)return;const lang=$("language").value||"en";const source=getSelectedLessonContent();scenes=makeSceneList(source).map(s=>({...s,language:lang,visualType:/method|stage|process|cycle|step/i.test(s.title)?"process":"concept"}));if(!scenes.length){status("No lesson text was found.");return}renderList();status(scenes.length+" "+({en:"English",ur:"Urdu",sd:"Sindhi"}[lang]||"")+" storyboard scenes prepared from the selected lesson explanation. Review before using.")});
$("prevScene").addEventListener("click",()=>{sceneIndex=Math.max(0,sceneIndex-1);drawScene()});$("sceneNarration").addEventListener("input",()=>{if(!scenes[sceneIndex])return;scenes[sceneIndex].narration=$("sceneNarration").value;const cards=$("sceneList").querySelectorAll(".scene p");if(cards[sceneIndex])cards[sceneIndex].textContent=scenes[sceneIndex].narration;$("scriptOutput").value=scenes.map((x,n)=>"SCENE "+(n+1)+": "+x.title+"\n"+x.narration).join("\n\n")});$("nextScene").addEventListener("click",()=>{sceneIndex=Math.min(scenes.length-1,sceneIndex+1);drawScene()});
$("copyScript").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("scriptOutput").value);status("Narration script copied.")}catch(e){$("scriptOutput").select();status("Select the script and use Copy on your phone.")}});
$("downloadBoard").addEventListener("click",()=>{const payload={schemaVersion:1,project:"Zeeroz Academy Video Studio",createdAt:new Date().toISOString(),course:courseData?.title,chapter:window.currentLesson?.chapter,lesson:window.currentLesson?.lesson?.title,videoTitle:$("videoTitle").value,language:$("language").value,sourceLanguage:$("language").value,scenes};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="zeeroz-storyboard.json";a.click();URL.revokeObjectURL(url);status("Storyboard JSON downloaded to your phone.")});
async function playSceneSequence(token){if(token!==playbackToken||sceneIndex>=scenes.length)return;drawScene();const s=scenes[sceneIndex];const avatar=document.querySelector(".avatar");avatar.classList.add("speaking");const lang=({en:"en-US",ur:"ur-PK",sd:"sd-PK"})[$("language").value]||"en-US";await new Promise(resolve=>{const utterance=new SpeechSynthesisUtterance(s.title+". "+s.narration);utterance.lang=lang;utterance.rate=.9;const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith(lang.slice(0,2)));if(voice)utterance.voice=voice;utterance.onend=resolve;utterance.onerror=resolve;speechSynthesis.speak(utterance)});avatar.classList.remove("speaking");if(token!==playbackToken)return;if(sceneIndex<scenes.length-1){sceneIndex++;await playSceneSequence(token)}else{status("Lesson preview complete. All "+scenes.length+" scenes played.");$("progress").style.width="100%"}}
$("speakAll").addEventListener("click",()=>{if(!("speechSynthesis" in window)){status("Your browser does not support speech preview.");return}speechSynthesis.cancel();playbackToken++;sceneIndex=0;status("Playing the lesson scene by scene. Voice depends on your phone's installed voices.");playSceneSequence(playbackToken)});
$("stopVoice").addEventListener("click",()=>{playbackToken++;if("speechSynthesis" in window)speechSynthesis.cancel();document.querySelector(".avatar")?.classList.remove("speaking");status("Voice preview stopped.")});


// 720p browser-side WebM export. A supplied voice-over file is mixed into the final recording.
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=5){const words=String(text||"").split(/\s+/);let line="",lines=[];for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);lines.slice(0,maxLines).forEach((v,i)=>ctx.fillText(v,x,y+i*lineHeight))}
function loadSceneImage(path){return new Promise(resolve=>{if(!path||!path.startsWith("assets/images/biology/")||path.includes(".."))return resolve(null);const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src="./"+path})}
function drawExportFrame(ctx,s,index,total,img,seconds){ctx.fillStyle="#f4f7fc";ctx.fillRect(0,0,1280,720);ctx.fillStyle="#14264d";ctx.fillRect(0,0,310,720);
 // Warm, dimensional illustrated teacher: hair, face, ears, eyes, nose, mouth, shirt and blazer.
 ctx.save();ctx.translate(0,Math.sin(seconds*2)*2);
 // shoulders and jacket
 ctx.fillStyle="#263f70";ctx.beginPath();ctx.moveTo(35,620);ctx.quadraticCurveTo(48,440,155,430);ctx.quadraticCurveTo(265,440,278,620);ctx.closePath();ctx.fill();
 ctx.fillStyle="#f2f4f8";ctx.beginPath();ctx.moveTo(118,448);ctx.lineTo(155,505);ctx.lineTo(192,448);ctx.lineTo(179,620);ctx.lineTo(131,620);ctx.closePath();ctx.fill();
 ctx.fillStyle="#d7a17e";ctx.fillRect(133,390,44,65);
 // ears
 ctx.fillStyle="#c98d6b";ctx.beginPath();ctx.ellipse(67,280,16,27,0,0,Math.PI*2);ctx.ellipse(243,280,16,27,0,0,Math.PI*2);ctx.fill();
 // face
 const face=ctx.createRadialGradient(125,225,12,155,280,125);face.addColorStop(0,"#f4c9a7");face.addColorStop(1,"#c98d6b");ctx.fillStyle=face;ctx.beginPath();ctx.ellipse(155,275,91,116,0,0,Math.PI*2);ctx.fill();
 // hair silhouette and side locks
 ctx.fillStyle="#30272a";ctx.beginPath();ctx.moveTo(65,258);ctx.quadraticCurveTo(46,130,151,139);ctx.quadraticCurveTo(242,126,247,238);ctx.quadraticCurveTo(215,203,194,195);ctx.quadraticCurveTo(143,220,91,196);ctx.quadraticCurveTo(88,233,65,258);ctx.fill();
 // eyebrows and eyes
 ctx.strokeStyle="#49312d";ctx.lineWidth=7;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(103,253);ctx.quadraticCurveTo(122,242,137,252);ctx.moveTo(174,252);ctx.quadraticCurveTo(191,242,208,253);ctx.stroke();
 ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(121,270,15,10,0,0,Math.PI*2);ctx.ellipse(190,270,15,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#49352e";ctx.beginPath();ctx.arc(124,271,6,0,Math.PI*2);ctx.arc(187,271,6,0,Math.PI*2);ctx.fill();
 // nose and friendly animated smile
 ctx.strokeStyle="#b9785e";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(155,275);ctx.quadraticCurveTo(145,306,158,309);ctx.stroke();
 ctx.fillStyle="#874b4b";ctx.beginPath();ctx.ellipse(155,337,17,5+Math.abs(Math.sin(seconds*12))*6,0,0,Math.PI*2);ctx.fill();
 // subtle beard shadow
 ctx.strokeStyle="rgba(91,57,48,.25)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(155,310,65,.3,2.8);ctx.stroke();
 // lapels and tie
 ctx.fillStyle="#172b50";ctx.beginPath();ctx.moveTo(116,449);ctx.lineTo(145,485);ctx.lineTo(128,540);ctx.lineTo(93,466);ctx.fill();ctx.beginPath();ctx.moveTo(194,449);ctx.lineTo(165,485);ctx.lineTo(182,540);ctx.lineTo(217,466);ctx.fill();
 ctx.fillStyle="#d6b35b";ctx.beginPath();ctx.moveTo(155,485);ctx.lineTo(167,505);ctx.lineTo(155,574);ctx.lineTo(143,505);ctx.closePath();ctx.fill();ctx.restore();
 ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="bold 23px system-ui";ctx.fillText("ZEEROZ TEACHER",155,655);ctx.fillStyle="#f2ce60";ctx.font="bold 15px system-ui";ctx.fillText("YOUR FRIENDLY GUIDE",155,682);ctx.textAlign="left";
 ctx.fillStyle="#3157d5";ctx.font="bold 20px system-ui";ctx.fillText("ZEEROZ ACADEMY",365,82);ctx.fillStyle="#10234d";ctx.font="bold 42px system-ui";wrapCanvasText(ctx,s.title,365,150,850,52,2);ctx.fillStyle="#26334f";ctx.font="26px system-ui";wrapCanvasText(ctx,s.narration,365,260,830,38,6);
 if(img){const scale=Math.min(650/img.width,190/img.height);ctx.drawImage(img,365,490,img.width*scale,img.height*scale)}else{const labels=s.narration.split(/[,;:]|\\b(?:then|next|finally|and)\\b/i).map(x=>x.trim()).filter(x=>x.length>3).slice(0,5);let x=365,y=510;ctx.font="bold 19px system-ui";labels.forEach(v=>{const label=v.slice(0,34),w=Math.min(240,ctx.measureText(label).width+34);ctx.fillStyle="#e7efff";ctx.fillRect(x,y,w,48);ctx.fillStyle="#18366f";ctx.fillText(label,x+14,y+31);x+=w+12;if(x>1120){x=365;y+=62}})}
 ctx.fillStyle="#dce5f5";ctx.fillRect(365,650,830,7);ctx.fillStyle="#15966b";ctx.fillRect(365,650,830*(index+1)/total,7);ctx.fillStyle="#56627a";ctx.font="18px system-ui";ctx.fillText("Scene "+(index+1)+" / "+total,365,690)}

async function exportLessonVideo(){if(!scenes.length){status("Generate the storyboard before exporting.");return}if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){status("Video export is not supported by this browser. Please use the latest Chrome.");return}
const button=$("exportVideo");button.disabled=true;$("exportProgress").style.width="0%";const canvas=document.createElement("canvas");canvas.width=1280;canvas.height=720;const ctx=canvas.getContext("2d"),stream=canvas.captureStream(25);let audioContext=null,audioElement=null,audioUrl=null,recorder=null;
try{const file=$("voiceTrack").files?.[0];if(file){audioUrl=URL.createObjectURL(file);audioElement=new Audio(audioUrl);audioElement.preload="auto";await new Promise((resolve,reject)=>{audioElement.onloadedmetadata=resolve;audioElement.onerror=()=>reject(new Error("Voice-over audio could not be opened."))});audioContext=new(window.AudioContext||window.webkitAudioContext)();await audioContext.resume();const source=audioContext.createMediaElementSource(audioElement),dest=audioContext.createMediaStreamDestination();source.connect(dest);source.connect(audioContext.destination);dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t))}
const mime=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(x=>MediaRecorder.isTypeSupported(x));if(!mime)throw new Error("WebM recording is not supported by this browser.");recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000});const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};const done=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=()=>reject(new Error("Video recording failed."))});recorder.start(500);if(audioElement)await audioElement.play();
const totalWeight=scenes.reduce((n,s)=>n+Math.max(1,s.narration.length),0);let elapsed=0;for(let i=0;i<scenes.length;i++){const s=scenes[i],img=await loadSceneImage(s.image);const duration=audioElement?Math.max(1200,(audioElement.duration||60)*1000*Math.max(1,s.narration.length)/totalWeight):Math.max(5000,Math.min(18000,s.narration.split(/\s+/).length/2.5*1000));const start=performance.now();while(performance.now()-start<duration){drawExportFrame(ctx,s,i,scenes.length,img,(performance.now()-start)/1000);$("exportProgress").style.width=Math.min(100,(elapsed+performance.now()-start)/((audioElement?.duration||scenes.length*8)*1000)*100)+"%";await new Promise(r=>setTimeout(r,40))}elapsed+=duration}
if(audioElement){audioElement.pause();audioElement.currentTime=0}recorder.stop();await done;const blob=new Blob(chunks,{type:"video/webm"});if(!blob.size)throw new Error("The exported video was empty.");const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=(($("videoTitle").value||"zeeroz-lesson").replace(/[^a-z0-9-_]+/gi,"-").replace(/^-|-$/g,"")||"zeeroz-lesson")+".webm";a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status("Video exported ("+(blob.size/1048576).toFixed(1)+" MB). "+(file?"Uploaded narration included.":"This export has no voice-over; upload narration audio to include sound."));$("exportProgress").style.width="100%"
}catch(e){if(recorder&&recorder.state!=="inactive")recorder.stop();status("Export error: "+e.message)}finally{stream.getTracks().forEach(t=>t.stop());if(audioContext)await audioContext.close().catch(()=>{});if(audioUrl)URL.revokeObjectURL(audioUrl);button.disabled=false}}
$("exportVideo").addEventListener("click",exportLessonVideo);


/* Real 3D teacher integrated into the lesson studio. Reuses the narration file selected above. */
let studioAvatar=null,studioAudioUrl=null,studioAvatarReady=false;
const avatarStatus=m=>{const el=$("avatarStatus");if(el)el.textContent=m};
async function initStudioAvatar(){
 const play=$("play3DVoice"),style=$("studioAvatarStyle"),host=$("studioAvatar");
 if(!play||!host)return;
 try{
  const mod=await import("https://esm.sh/@interviewflowai/talking-avatar?bundle");
  const {AVATARS,TalkingAvatar}=mod;
  const create=async()=>{
   try{studioAvatar?.dispose()}catch(e){}
   studioAvatar=null;studioAvatarReady=false;play.disabled=true;
   avatarStatus("Loading selected 3D teacher…");
   studioAvatar=new TalkingAvatar({container:host,avatarUrl:style.value==="male"?AVATARS.male:undefined,onError:e=>avatarStatus("3D avatar error: "+(e?.message||e))});
   try{await studioAvatar.ready}catch(e){studioAvatarReady=false;avatarStatus("3D teacher failed to load: "+e.message);return}
   studioAvatarReady=true;
   const file=$("voiceTrack").files?.[0];
   play.disabled=!file;
   if($("export3DVideo"))$("export3DVideo").disabled=!file;
   avatarStatus(file?"3D teacher ready. Play the selected lesson narration.":"3D teacher ready. Upload narration audio above.");
  };
  style.addEventListener("change",create);create();
  $("voiceTrack").addEventListener("change",()=>{
   const file=$("voiceTrack").files?.[0];
   play.disabled=!studioAvatarReady||!file;
   if($("export3DVideo"))$("export3DVideo").disabled=!studioAvatarReady||!file;
   avatarStatus(file?"Narration selected: "+file.name+". Ready for 3D lip-sync.":"Upload a narration audio file.");
  });
  play.addEventListener("click",async()=>{
   const file=$("voiceTrack").files?.[0];if(!studioAvatar||!file)return;
   play.disabled=true;
   try{
    if(studioAudioUrl)URL.revokeObjectURL(studioAudioUrl);
    studioAudioUrl=URL.createObjectURL(file);
    avatarStatus("3D teacher is speaking. Lip-sync follows the uploaded narration.");
    await studioAvatar.speak(studioAudioUrl);
    avatarStatus("Narration finished.");
   }catch(e){avatarStatus("3D playback error: "+e.message)}
   finally{play.disabled=!$("voiceTrack").files?.[0]}
  });
 }catch(e){avatarStatus("Could not load the 3D avatar engine. Check internet and refresh. "+e.message)}
}
// Local Urdu neural TTS: uses the selected lesson storyboard directly.
// The browser Piper engine accepts explicit Hugging Face model/config URLs; no PATH_MAP registry.
let ttsAudioUrl=null,ttsBusy=false,ttsEngineCache={},ttsGeneration=0,ttsScriptsReady=null;
const ttsStatus=$("ttsStatus"),ttsButton=$("ttsGenerate"),ttsAudio=$("ttsAudio"),ttsDownload=$("ttsDownload");
function currentLessonNarration(){
 if(!scenes.length)return "";
 return scenes.map(s=>s.narration.trim()).filter(Boolean).join("\n\n");
}
function setGeneratedVoiceFile(blob){
 const file=new File([blob],"zeeroz-lesson-voice.wav",{type:"audio/wav"});
 const transfer=new DataTransfer();transfer.items.add(file);
 $("voiceTrack").files=transfer.files;
 $("voiceTrack").dispatchEvent(new Event("change",{bubbles:true}));
}
function loadClassicScript(src){
 return new Promise((resolve,reject)=>{
  const existing=[...document.scripts].find(x=>x.src===src);
  if(existing){if(existing.dataset.loaded==="yes")return resolve();existing.addEventListener("load",resolve,{once:true});existing.addEventListener("error",()=>reject(new Error("Required audio engine script failed: "+src)),{once:true});return}
  const script=document.createElement("script");script.src=src;script.async=false;
  script.onload=()=>{script.dataset.loaded="yes";resolve()};
  script.onerror=()=>reject(new Error("Required audio engine script could not load: "+src));
  document.head.append(script);
 });
}
async function ensureUrduPiper(){
 if(ttsScriptsReady)return ttsScriptsReady;
 ttsScriptsReady=(async()=>{
  ttsStatus.textContent="Browser ONNX runtime aur Urdu phonemizer load ho rahe hain…";
  await loadClassicScript("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/ort.wasm.min.js");
  await loadClassicScript("https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js");
  await loadClassicScript("./urdu-piper-browser.js?v=tts-stage-2");
  if(!window.ZeerozPiper)throw new Error("Urdu Piper browser engine did not initialize.");
  await window.ZeerozPiper.getPhonemizer();
  return window.ZeerozPiper;
 })().catch(e=>{ttsScriptsReady=null;throw e});
 return ttsScriptsReady;
}
function splitUrduNarration(text,maxChars=360){
 const sentences=String(text).split(/(?<=[۔.!؟?])\s+|\n+/).map(x=>x.trim()).filter(Boolean),chunks=[];
 let current="";
 for(const sentence of sentences){
  if(sentence.length>maxChars){
   if(current){chunks.push(current);current=""}
   let part="";
   for(const word of sentence.split(/\s+/)){
    if(part&&part.length+word.length+1>maxChars){chunks.push(part);part=""}
    part+=(part?" ":"")+word;
   }
   if(part)chunks.push(part);
  }else if(current&&current.length+sentence.length+1>maxChars){chunks.push(current);current=sentence}
  else current+=(current?" ":"")+sentence;
 }
 if(current)chunks.push(current);
 return chunks;
}
async function getUrduEngine(engine,voiceId){
 if(ttsEngineCache[voiceId])return ttsEngineCache[voiceId];
 const urls={
  "ur_PK-fasih-medium":{
   model:"https://huggingface.co/IhorShevchuk/piper-voice-ur-fasih/resolve/main/ur_PK-fasih-medium-model.onnx",
   config:"https://huggingface.co/IhorShevchuk/piper-voice-ur-fasih/resolve/main/ur_PK-fasih-medium-model.onnx.json"
  },
  "ur_PK-aegis_female-medium":{
   model:"https://huggingface.co/mahwizzzz/piper-voice-ur-aegis-female/resolve/main/ur_PK-aegis_female-medium.onnx",
   config:"https://huggingface.co/mahwizzzz/piper-voice-ur-aegis-female/resolve/main/ur_PK-aegis_female-medium.onnx.json"
  }
 };
 const selected=urls[voiceId];if(!selected)throw new Error("Unknown Urdu voice selected.");
 ttsStatus.textContent="Urdu voice model download ho raha hai (taqreeban 64 MB). Pehli dafa kuch waqt lag sakta hai…";
 const enginePromise=engine.createEngine(selected.model,selected.config,p=>{
  if(p?.stage==="opening")ttsStatus.textContent="Urdu model 100% download ho gaya. Ab phone voice engine open kar raha hai — 64 MB model ko load hone mein waqt lag sakta hai; is stage par screen rukti hui lag sakti hai. Browser band na karein.";
  else if(p?.stage==="ready")ttsStatus.textContent="Urdu voice engine ready. Ab narration generate ho rahi hai…";
  else if(p?.total)ttsStatus.textContent="Urdu model download: "+Math.round(p.loaded*100/p.total)+"%";
 });
 ttsEngineCache[voiceId]=enginePromise;
 try{return await enginePromise}catch(e){delete ttsEngineCache[voiceId];throw e}
}
async function generateUrduAudio(){
 if(ttsBusy)return;
 const text=currentLessonNarration();
 if(!text){ttsStatus.textContent="Pehle lesson select karke Generate storyboard press karein.";return}
 if($("language").value!=="ur"){ttsStatus.textContent="Abhi downloadable neural WAV sirf Urdu ke liye available hai. Sindhi storyboard supported hai, lekin local Sindhi voice abhi verified nahi.";return}
 ttsBusy=true;ttsButton.disabled=true;const token=++ttsGeneration;let ttsPhase="initializing browser audio engine";
 try{
  ttsPhase="loading Urdu phonemizer and ONNX runtime";
  const engine=await ensureUrduPiper();
  const voiceId=$("ttsVoice").value==="female"?"ur_PK-aegis_female-medium":"ur_PK-fasih-medium";
  ttsPhase="opening the downloaded Urdu voice model in phone memory";
  const model=await getUrduEngine(engine,voiceId);
  const parts=splitUrduNarration(text),pcmParts=[];
  for(let i=0;i<parts.length;i++){
   if(token!==ttsGeneration)throw new Error("Audio generation user ne stop kar di.");
   ttsStatus.textContent="Urdu narration generate ho rahi hai: "+(i+1)+"/"+parts.length+"…";
   ttsPhase="phonemizing and synthesizing Urdu audio chunk "+(i+1)+"/"+parts.length;
   pcmParts.push(await model.speak(parts[i]));
  }
  if(token!==ttsGeneration)return;
  const silence=new Float32Array(Math.round(model.sampleRate*.18));
  const total=pcmParts.reduce((n,p)=>n+p.length,0)+silence.length*Math.max(0,pcmParts.length-1);
  const pcm=new Float32Array(total);let offset=0;
  pcmParts.forEach((part,i)=>{pcm.set(part,offset);offset+=part.length;if(i<pcmParts.length-1){pcm.set(silence,offset);offset+=silence.length}});
  const wav=engine.toWav(pcm,model.sampleRate);
  if(!(wav instanceof Blob)||!wav.size)throw new Error("Urdu voice engine ne valid WAV file return nahi ki.");
  if(ttsAudioUrl)URL.revokeObjectURL(ttsAudioUrl);
  ttsAudioUrl=URL.createObjectURL(wav);ttsAudio.src=ttsAudioUrl;ttsAudio.style.display="block";
  ttsDownload.href=ttsAudioUrl;ttsDownload.hidden=false;setGeneratedVoiceFile(wav);
  ttsStatus.textContent="Urdu audio ready! WAV download, 3D teacher lip-sync aur video export ke liye attach ho gaya.";
  try{await ttsAudio.play()}catch(e){}
 }catch(e){
  const detail=typeof e==="number"?"WASM/ONNX error code "+e:(e?.message||String(e));
  console.error("[Zeeroz Urdu TTS]",{phase:ttsPhase,error:e,stack:e?.stack});
  if(token===ttsGeneration)ttsStatus.textContent="Audio failed during "+ttsPhase+": "+detail+". Agar ye dobara aaye to ye exact stage/error share karein.";
 }finally{if(token===ttsGeneration){ttsBusy=false;ttsButton.disabled=false}}
}
$("ttsGenerate")?.addEventListener("click",generateUrduAudio);
$("ttsStop")?.addEventListener("click",()=>{ttsGeneration++;ttsBusy=false;if(ttsButton)ttsButton.disabled=false;if(ttsAudio){ttsAudio.pause();ttsAudio.currentTime=0}ttsStatus.textContent="Audio generation/playback stopped.";});
initStudioAvatar();

/* Record the real 3D avatar canvas together with the lesson narration. */
async function exportReal3DTeacher(){
 const button=$("export3DVideo"),status3D=$("export3DStatus"),progress=$("export3DProgress");
 const file=$("voiceTrack").files?.[0];
 if(!studioAvatar||!studioAvatarReady){status3D.textContent="3D teacher is not ready yet.";return}
 if(!file){status3D.textContent="Upload the complete narration audio first.";return}
 const avatarCanvas=$("studioAvatar").querySelector("canvas");
 if(!avatarCanvas){status3D.textContent="3D render canvas was not found. Refresh and try again.";return}
 if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){status3D.textContent="This browser does not support video recording. Use the latest Chrome.";return}
 button.disabled=true;progress.style.width="0%";
 let audioContext=null,source=null,recorder=null,raf=0,recordStream=null;
 try{
  status3D.textContent="Preparing narration and 3D recording…";
  audioContext=new(window.AudioContext||window.webkitAudioContext)();
  await audioContext.resume();
  const bytes=await file.arrayBuffer();
  const audioBuffer=await audioContext.decodeAudioData(bytes.slice(0));
  const sourceStream=audioContext.createMediaStreamDestination();
  source=audioContext.createBufferSource();source.buffer=audioBuffer;source.connect(sourceStream);
  const out=document.createElement("canvas");out.width=1280;out.height=720;
  const ctx=out.getContext("2d");
  const videoStream=out.captureStream(25);recordStream=videoStream;
  sourceStream.stream.getAudioTracks().forEach(t=>videoStream.addTrack(t));
  const mime=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(x=>MediaRecorder.isTypeSupported(x));
  if(!mime)throw new Error("WebM recording format is unavailable in this browser.");
  const chunks=[];
  recorder=new MediaRecorder(videoStream,{mimeType:mime,videoBitsPerSecond:3500000,audioBitsPerSecond:128000});
  recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
  const finished=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=()=>reject(new Error("Recording failed."))});
  const title=$("videoTitle").value||window.currentLesson?.lesson?.title||"Zeeroz Academy Lesson";
  const sceneAt=(seconds)=>{
   let remaining=seconds,idx=0;
   for(let i=0;i<scenes.length;i++){const d=Math.max(1.5,audioBuffer.duration*Math.max(1,scenes[i].narration.length)/scenes.reduce((n,s)=>n+Math.max(1,s.narration.length),0));if(remaining<d){idx=i;break}remaining-=d;idx=i}
   return scenes[idx]||{title,narration:"Welcome to Zeeroz Academy"};
  };
  const draw=()=>{
   ctx.fillStyle="#101b3d";ctx.fillRect(0,0,1280,720);
   const glow=ctx.createRadialGradient(300,270,20,300,300,520);glow.addColorStop(0,"#344d88");glow.addColorStop(1,"#101b3d");ctx.fillStyle=glow;ctx.fillRect(0,0,610,720);
   ctx.save();ctx.beginPath();ctx.rect(25,25,560,670);ctx.clip();
   try{ctx.drawImage(avatarCanvas,30,35,550,640)}catch(e){}
   ctx.restore();
   ctx.fillStyle="#ffffff";ctx.font="bold 23px system-ui";ctx.fillText("ZEEROZ ACADEMY",650,78);
   ctx.fillStyle="#f2ce60";ctx.font="bold 16px system-ui";ctx.fillText("AI TEACHER · 3D LECTURE",650,112);
   const sc=sceneAt(audioContext.currentTime-startedAt);
   ctx.fillStyle="#ffffff";ctx.font="bold 38px system-ui";
   const wrap=(txt,x,y,max,lineH,maxLines)=>{const words=String(txt||"").split(/\\s+/);let line="",count=0;for(const w of words){const test=line?line+" "+w:w;if(ctx.measureText(test).width>max&&line){ctx.fillText(line,x,y+count*lineH);line=w;if(++count>=maxLines)return}else line=test}if(line&&count<maxLines)ctx.fillText(line,x,y+count*lineH)};
   wrap(sc.title,650,190,570,48,3);
   ctx.fillStyle="#dce6ff";ctx.font="24px system-ui";wrap(sc.narration,650,360,560,36,7);
   ctx.fillStyle="#d6e1f5";ctx.fillRect(650,650,560,7);ctx.fillStyle="#20b982";ctx.fillRect(650,650,560*Math.min(1,(audioContext.currentTime-startedAt)/audioBuffer.duration),7);
   ctx.fillStyle="#d6e1f5";ctx.font="16px system-ui";ctx.fillText("Scene "+(scenes.indexOf(sc)+1)+" / "+Math.max(1,scenes.length),650,685);
   progress.style.width=Math.min(100,(audioContext.currentTime-startedAt)/audioBuffer.duration*100)+"%";
   raf=requestAnimationFrame(draw);
  };
  recorder.start(500);
  status3D.textContent="Starting 3D teacher lip-sync and recording…";
  await studioAvatar.attachStream(sourceStream.stream);
  const startedAt=audioContext.currentTime;
  source.onended=()=>{if(recorder&&recorder.state!=="inactive")recorder.stop()};
  source.start();
  draw();
  await new Promise((resolve,reject)=>{source.addEventListener("ended",resolve,{once:true});setTimeout(()=>reject(new Error("Recording timed out before the narration finished.")),Math.max(30000,audioBuffer.duration*1000+15000))});
  if(recorder.state!=="inactive")recorder.stop();
  await finished;
  cancelAnimationFrame(raf);raf=0;
  const blob=new Blob(chunks,{type:mime});
  if(!blob.size)throw new Error("The recorded video is empty.");
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=(title.replace(/[^a-z0-9-_]+/gi,"-").replace(/^-|-$/g,"")||"zeeroz-3d-lesson")+"-3d.webm";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  progress.style.width="100%";
  status3D.textContent="Real 3D teacher video exported successfully ("+(blob.size/1048576).toFixed(1)+" MB).";
 }catch(e){
  status3D.textContent="3D export could not finish: "+e.message;
  if(recorder&&recorder.state!=="inactive")try{recorder.stop()}catch(_){}
 }finally{
  if(raf)cancelAnimationFrame(raf);
  try{source?.stop()}catch(e){}
  recordStream?.getTracks().forEach(t=>t.stop());
  if(audioContext)await audioContext.close().catch(()=>{});
  button.disabled=!studioAvatarReady||!$("voiceTrack").files?.[0];
 }
}

$("export3DVideo")?.addEventListener("click",exportReal3DTeacher);

// One-click lesson production: generate fresh Urdu narration from the current
// storyboard, attach it to the 3D teacher, then export one combined WebM.
async function generateCompleteLessonVideo(){
 const button=$("generateCompleteVideo");
 if(!scenes.length){status("Pehle lesson select karke storyboard generate karein.");return}
 if($("language").value!=="ur"){$("ttsStatus").textContent="Complete automatic voice+video export filhal Urdu narration ke saath available hai. Sindhi voice model abhi verified nahi.";return}
 if(!studioAvatarReady||!studioAvatar){avatarStatus("3D teacher abhi load ho raha hai. Ready hone ke baad dobara try karein.");return}
 button.disabled=true;
 try{
  $("ttsAudio")?.pause();
  await generateUrduAudio();
  const generated=$("voiceTrack").files?.[0];
  if(!generated)throw new Error("Urdu narration WAV tayyar nahi hui; status check karein.");
  $("ttsAudio")?.pause();
  await exportReal3DTeacher();
 }catch(e){status("Complete video could not be generated: "+(e?.message||String(e)))}
 finally{button.disabled=false}
}
$("generateCompleteVideo")?.addEventListener("click",generateCompleteLessonVideo);

$("voiceTrack")?.addEventListener("change",()=>{const b=$("export3DVideo");if(b)b.disabled=!studioAvatarReady||!$("voiceTrack").files?.[0]});
window.addEventListener("beforeunload",()=>{if(studioAudioUrl)URL.revokeObjectURL(studioAudioUrl);try{studioAvatar?.dispose()}catch(e){}});
