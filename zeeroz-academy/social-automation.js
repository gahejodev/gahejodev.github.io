import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id), db=()=>window.ZeerozFirebase.db;
let admin=false;
const names={youtube:"YouTube",facebook:"Facebook",instagram:"Instagram",tiktok:"TikTok"};
function say(s){$("status").textContent=s}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function when(v){if(!v)return "Not scheduled";const d=v.toDate?v.toDate():new Date(v);return Number.isNaN(d.getTime())?"Time not set":d.toLocaleString()}
const SOCIAL_VIDEO_DB="zeeroz-social-media";
let localVideoObjectUrls=[];
function openSocialVideoDb(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in window)){reject(new Error("This browser does not support local video storage."));return}
  const request=indexedDB.open(SOCIAL_VIDEO_DB,1);
  request.onupgradeneeded=()=>{const database=request.result;if(!database.objectStoreNames.contains("videos"))database.createObjectStore("videos",{keyPath:"key"})};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error("Could not open local video storage."));
 });
}
async function storeSocialVideo(key,blob,fileName){
 const database=await openSocialVideoDb();
 return new Promise((resolve,reject)=>{
  const tx=database.transaction("videos","readwrite");
  tx.objectStore("videos").put({key,blob,fileName,mimeType:blob.type||"video/webm",sizeBytes:blob.size,createdAt:Date.now()});
  tx.oncomplete=()=>{database.close();resolve()};
  tx.onerror=()=>{const error=tx.error||new Error("Could not save the video locally.");database.close();reject(error)};
  tx.onabort=()=>{const error=tx.error||new Error("Local video save was cancelled.");database.close();reject(error)};
 });
}
async function getStoredSocialVideo(key){
 const database=await openSocialVideoDb();
 return new Promise((resolve,reject)=>{
  const tx=database.transaction("videos","readonly"),request=tx.objectStore("videos").get(key);
  request.onsuccess=()=>{const value=request.result;database.close();resolve(value||null)};
  request.onerror=()=>{const error=request.error;database.close();reject(error)};
 });
}
async function removeStoredSocialVideo(key){
 const database=await openSocialVideoDb();
 return new Promise((resolve,reject)=>{
  const tx=database.transaction("videos","readwrite");
  tx.objectStore("videos").delete(key);
  tx.oncomplete=()=>{database.close();resolve()};
  tx.onerror=()=>{const error=tx.error;database.close();reject(error)};
 });
}
function clearLocalVideoUrls(){localVideoObjectUrls.forEach(url=>URL.revokeObjectURL(url));localVideoObjectUrls=[]}
function getCaptions(description){
 const val=id=>$(id)?.value.trim()||"";
 return {youtube:val("captionYoutube")||description,facebook:val("captionFacebook")||description,instagram:val("captionInstagram")||description,tiktok:val("captionTiktok")||description};
}
function platformStatusText(value){
 const labels={not_started:"Not started",awaiting_platform_setup:"Awaiting platform connection",ready:"Ready to publish",uploading:"Uploading",published:"Published",failed:"Failed",scheduled:"Scheduled"};
 return labels[value]||value||"Not started";
}
function storageWorkerUrl(){return (localStorage.getItem("zeerozSocialStorageWorkerUrl")||"").trim().replace(/\/$/,"")}
async function uploadLocalVideo(postId,post,card){
 const button=card.querySelector('[data-action="upload"]');
 const note=document.createElement("p");note.className="hint";card.append(note);
 const worker=storageWorkerUrl();
 if(!worker)throw new Error("Pehle Secure video storage connection mein Worker URL save karein.");
 if(!/^https:\/\//i.test(worker))throw new Error("Storage Worker URL must use HTTPS.");
 if(!post.localVideoKey)throw new Error("Is post ke saath local video file nahi mili.");
 const local=await getStoredSocialVideo(post.localVideoKey);
 if(!local?.blob)throw new Error("Local video file missing. Same phone/browser use karein.");
 const user=window.ZeerozFirebase.auth.currentUser;
 if(!user)throw new Error("Administrator sign-in required.");
 const mimeType=local.mimeType||local.blob.type||"video/webm";
 const sizeBytes=local.sizeBytes||local.blob.size;
 button.disabled=true;note.textContent="Secure upload link ban raha hai…";
 try{
  const token=await user.getIdToken();
  const create=await fetch(worker+"/create-upload",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({fileName:local.fileName||post.localVideoName||"lesson-video.webm",mimeType,sizeBytes})});
  const ticket=await create.json().catch(()=>({}));
  if(!create.ok)throw new Error(ticket.error||"Could not create secure upload.");
  note.textContent="Video Cloudflare R2 par upload ho rahi hai…";
  const put=await fetch(ticket.putUrl,{method:"PUT",headers:{"Content-Type":mimeType},body:local.blob});
  if(!put.ok)throw new Error("Cloud storage upload failed (HTTP "+put.status+"). Check R2 bucket CORS and Worker setup.");
  note.textContent="Upload verify ho raha hai…";
  const confirm=await fetch(worker+"/confirm-upload",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({key:ticket.key,sizeBytes})});
  const result=await confirm.json().catch(()=>({}));
  if(!confirm.ok)throw new Error(result.error||"Cloud upload verification failed.");
  const platformResults={...(post.platformResults||{})};
  (post.platforms||[]).forEach(x=>{platformResults[x]=platformResults[x]||{status:"awaiting_platform_setup",message:"Video stored in cloud; official platform connection is still required."}});
  await updateDoc(doc(db(),"socialPosts",postId),{
   videoUrl:result.mediaUrl,videoStorage:"cloudflare_r2",remoteMediaKey:result.key,
   sizeBytes:result.sizeBytes,platformResults,cloudUploadedAt:serverTimestamp(),updatedAt:serverTimestamp()
  });
  say("Video securely uploaded to cloud storage. Platform publishing is still awaiting official account connections.");
  await load();
 }catch(error){button.disabled=false;note.textContent="Upload failed: "+error.message;throw error}
}



async function load(){
 clearLocalVideoUrls();
 const snap=await getDocs(query(collection(db(),"socialPosts"),orderBy("createdAt","desc")));
 const host=$("posts");host.replaceChildren();
 if(!snap.size){host.textContent="No social posts yet. Create your first draft above.";return}
 for(const d of snap.docs){
  const p=d.data(),card=document.createElement("article");card.className="post";
  const platforms=(p.platforms||[]).map(x=>'<span class="tag">'+esc(names[x]||x)+'</span>').join("");
  const results=p.platformResults||{},captions=p.platformCaptions||{};
  const statusRows=(p.platforms||[]).map(x=>{
   const item=results[x]||{};
   return '<li><strong>'+esc(names[x]||x)+':</strong> '+esc(platformStatusText(item.status))+(item.message?' — '+esc(item.message):'')+(item.postUrl?' · <a href="'+esc(item.postUrl)+'" target="_blank" rel="noopener">View post</a>':'')+'</li>';
  }).join("");
  const captionEditor=(p.platforms||[]).map(x=>'<label>'+esc(names[x]||x)+' caption</label><textarea data-caption="'+esc(x)+'" maxlength="'+(x==="youtube"||x==="facebook"?5000:2200)+'">'+esc(captions[x]||p.description||"")+'</textarea>').join("");
  let videoLine='<p class="hint">Video: not attached</p>';
  if(p.videoUrl&&/^https:\/\//i.test(p.videoUrl))videoLine='<p class="hint">Video URL: <a href="'+esc(p.videoUrl)+'" target="_blank" rel="noopener">Open video</a></p>';
  else if(p.localVideoKey)videoLine='<p class="hint">Video: local file attached ('+esc(p.localVideoName||"video")+')</p>';
  card.innerHTML='<strong>'+esc(p.title)+'</strong><p class="hint">'+esc(p.description||"")+'</p>'+platforms+
   '<p class="hint">Mode: '+esc(p.publishMode||"approval")+' · Overall: <strong>'+esc(p.status||"draft")+'</strong> · Schedule: '+esc(when(p.scheduleAt))+'</p>'+
   '<details><summary style="cursor:pointer;font-weight:700">Platform-by-platform status</summary><ul>'+statusRows+'</ul></details>'+
   '<details style="margin-top:8px"><summary style="cursor:pointer;font-weight:700">Edit platform captions</summary>'+captionEditor+'<button class="btn secondary" data-action="captions">Save captions</button></details>'+
   videoLine+'<div>'+(p.localVideoKey&&!p.videoUrl?'<button class="btn" data-action="upload">Upload video to cloud</button>':'')+'<button class="btn secondary" data-action="approve">Approve / queue</button><button class="btn secondary" data-action="draft">Return to draft</button><button class="btn danger" data-action="delete">Delete</button></div>';
  if(p.localVideoKey){
   try{
    const local=await getStoredSocialVideo(p.localVideoKey);
    if(local?.blob){
     const url=URL.createObjectURL(local.blob);localVideoObjectUrls.push(url);
     const video=document.createElement("video");video.controls=true;video.playsInline=true;video.preload="metadata";video.src=url;
     video.style.cssText="display:block;width:100%;max-height:360px;margin-top:12px;border-radius:10px;background:#101b3d";
     const download=document.createElement("a");download.href=url;download.download=local.fileName||p.localVideoName||"zeeroz-video.webm";download.textContent="Download attached video";download.style.cssText="display:inline-block;margin-top:8px;color:#3157d5;font-weight:700";
     card.append(video,download);
    }else{const missing=document.createElement("p");missing.className="hint";missing.textContent="Video file is not present in this browser. Open this queue on the same device/browser where the Studio created it, and do not clear site data.";card.append(missing)}
   }catch(e){const missing=document.createElement("p");missing.className="hint";missing.textContent="Local video could not be opened: "+e.message;card.append(missing)}
  }
  card.querySelector('[data-action="upload"]')?.addEventListener("click",async()=>{try{await uploadLocalVideo(d.id,p,card)}catch(e){say("Cloud upload failed: "+e.message)}});
  card.querySelector('[data-action="captions"]').addEventListener("click",()=>{
   const updated={};card.querySelectorAll("[data-caption]").forEach(el=>updated[el.dataset.caption]=el.value.trim());
   change(d.id,{platformCaptions:updated});
  });
  card.querySelector('[data-action="approve"]').addEventListener("click",()=>{
   const platformResults={...(p.platformResults||{})};
   (p.platforms||[]).forEach(x=>{platformResults[x]={status:"awaiting_platform_setup",message:"Official platform connection and secure uploader are not configured yet."}});
   change(d.id,{status:"approved_pending_platform_setup",approvedAt:serverTimestamp(),platformResults});
  });
  card.querySelector('[data-action="draft"]').addEventListener("click",()=>change(d.id,{status:"draft",approvedAt:null}));
  card.querySelector('[data-action="delete"]').addEventListener("click",async()=>{
   if(!confirm("Delete this content record?"))return;
   try{if(p.localVideoKey)await removeStoredSocialVideo(p.localVideoKey);await deleteDoc(doc(db(),"socialPosts",d.id));say("Draft and local attachment deleted.");await load()}
   catch(e){say("Delete failed: "+e.message)}
  });
  host.append(card);
 }
}
async function change(id,data){try{await updateDoc(doc(db(),"socialPosts",id),{...data,updatedAt:serverTimestamp()});say("Content record updated.");await load()}catch(e){say("Update failed: "+e.message)}}

const workerInput=$("storageWorkerUrl");
if(workerInput)workerInput.value=storageWorkerUrl();
$("saveStorageWorkerUrl")?.addEventListener("click",async()=>{
 const value=$("storageWorkerUrl").value.trim().replace(/\/$/,"");
 if(!/^https:\/\//i.test(value)){ $("storageWorkerStatus").textContent="Please enter a valid HTTPS Worker URL.";return}
 $("storageWorkerStatus").textContent="Testing Worker connection…";
 try{
  const response=await fetch(value+"/health"),data=await response.json();
  if(!response.ok||!data.ok||!data.configured)throw new Error(data.error||"Worker is reachable but R2 bucket/secrets are not fully configured yet.");
  localStorage.setItem("zeerozSocialStorageWorkerUrl",value);
  $("storageWorkerStatus").textContent="Connected: "+(data.service||"Social Storage API")+".";
  say("Secure storage Worker connection saved.");
 }catch(e){$("storageWorkerStatus").textContent="Connection failed: "+e.message}
});
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 try{const token=await user.getIdTokenResult(true);if(token.claims.admin!==true){document.body.innerHTML="<main style='padding:30px;font:16px system-ui'><h2>Administrator access required</h2><a href='./student-login.html'>Sign in</a></main>";return}admin=true;await load()}catch(e){say("Could not load queue: "+e.message)}
});
$("postForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!admin)return;
 let localVideoKey="";
 try{
  const videoUrl=$("videoUrl").value.trim(),websiteUrl=$("websiteUrl").value.trim(),file=$("videoFile")?.files?.[0]||null;
  if(!videoUrl&&!file)throw new Error("Add an HTTPS video URL or select a video file.");
  if(videoUrl&&!/^https:\/\//i.test(videoUrl))throw new Error("Video URL must be HTTPS.");
  if(videoUrl&&file)throw new Error("Choose either a video URL or a local video file, not both.");
  if(websiteUrl&&!/^https:\/\//i.test(websiteUrl))throw new Error("Website URL must be HTTPS.");
  const platforms=[...document.querySelectorAll('input[name="platform"]:checked')].map(x=>x.value);
  if(!platforms.length)throw new Error("Select at least one platform.");
  const raw=$("scheduleAt").value;
  const scheduleAt=raw?new Date(raw):null;if(scheduleAt&&Number.isNaN(scheduleAt.getTime()))throw new Error("Choose a valid publishing time.");
  let localVideoName="",mimeType="",sizeBytes=0;
  if(file){
   localVideoKey="queue-"+crypto.randomUUID();localVideoName=file.name;mimeType=file.type||"video/*";sizeBytes=file.size;
   await storeSocialVideo(localVideoKey,file,localVideoName);
  }
  const ref=await addDoc(collection(db(),"socialPosts"),{
   title:$("title").value.trim(),videoUrl,localVideoKey:localVideoKey||null,localVideoName:localVideoName||null,
   videoStorage:file?"indexeddb":(videoUrl?"remote_url":"none"),mimeType:mimeType||null,sizeBytes:sizeBytes||null,
   websiteUrl,description:$("description").value.trim(),platformCaptions:getCaptions($("description").value.trim()),language:$("language").value,platforms,publishMode:$("publishMode").value,
   scheduleAt,status:"draft",platformResults:{},createdAt:serverTimestamp(),updatedAt:serverTimestamp(),
   createdBy:window.ZeerozFirebase.auth.currentUser.uid
  });
  e.target.reset();document.querySelectorAll('input[name="platform"]').forEach(x=>x.checked=true);
  say("Draft saved successfully (record "+ref.id+").");await load();
 }catch(err){
  if(localVideoKey){try{await removeStoredSocialVideo(localVideoKey)}catch(_){}}
  say(err.message)
 }
});
