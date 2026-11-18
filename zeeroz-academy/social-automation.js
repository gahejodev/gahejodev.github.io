import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id), db=()=>window.ZeerozFirebase.db;
let admin=false;
const names={youtube:"YouTube",facebook:"Facebook",instagram:"Instagram",tiktok:"TikTok"};
function say(s){$("status").textContent=s}
async function apiHeaders(){const user=window.ZeerozFirebase.auth.currentUser;if(!user)throw new Error("Please sign in as administrator.");return {Authorization:"Bearer "+await user.getIdToken(),Accept:"application/json","Content-Type":"application/json"}}
async function checkPublishingBackend(){
 const health=$("backendHealth"),details=$("backendDetails");if(!health||!details)return;health.textContent="Checking secure publishing backend…";
 try{
  const response=await fetch(SOCIAL_PUBLISHER_URL+"/health",{headers:{Accept:"application/json"}});if(!response.ok)throw new Error("Backend returned HTTP "+response.status);
  const data=await response.json();if(!data.ok)throw new Error("Backend health check did not pass.");
  const headers=await apiHeaders(),authResponse=await fetch(SOCIAL_PUBLISHER_URL+"/api/admin/config-check",{method:"POST",headers,body:"{}"}),authData=await authResponse.json();
  if(!authResponse.ok||!authData.ok)throw new Error(authData.error||"Admin verification failed.");
  const sr=await fetch(SOCIAL_PUBLISHER_URL+"/api/youtube/status",{headers}),sd=await sr.json();
  health.textContent="Connected: free Cloudflare Worker is responding; administrator verification passed.";
  details.textContent="Video storage: disabled. KV: "+(authData.kvBound?"ready":"not available")+". YouTube: "+(sd.connected?"connected":"not connected")+". OAuth credentials: "+(authData.youtubeOAuthSecretsConfigured?"configured":"waiting for Google OAuth setup")+". Facebook Page Reels direct upload is enabled after Page authorization; TikTok publishing is pending; Instagram requires a public video URL.";
 }catch(e){health.textContent="Backend check failed: "+e.message;details.textContent="Check Worker deployment, internet access and Firebase administrator sign-in."}
}
async function connectYoutube(){
 try{say("Starting secure YouTube connection…");const headers=await apiHeaders(),r=await fetch(SOCIAL_PUBLISHER_URL+"/api/youtube/connect",{method:"POST",headers,body:"{}"}),d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||"Could not start YouTube authorization.");location.href=d.authorizationUrl;}catch(e){say("YouTube connection failed: "+e.message)}
}

async function connectSocialProvider(provider){
 const button=$("connect"+provider[0].toUpperCase()+provider.slice(1));
 const visible=$("facebookConnectStatus");
 try{
  if(button){button.disabled=true;button.textContent="Connecting…"}
  if(visible&&provider==="facebook")visible.textContent="Starting secure Facebook connection…";
  say("Starting secure "+names[provider]+" authorization…");
  const headers=await apiHeaders();
  const r=await fetch(SOCIAL_PUBLISHER_URL+"/api/"+provider+"/connect",{method:"POST",headers,body:"{}"});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok)throw new Error(d.error||"Could not start "+names[provider]+" authorization (HTTP "+r.status+").");
  if(!d.authorizationUrl)throw new Error("Worker did not return an authorization link.");
  if(visible&&provider==="facebook")visible.textContent="Opening Facebook login…";
  location.assign(d.authorizationUrl);
 }catch(e){
  const message=names[provider]+" connection failed: "+e.message;
  say(message);
  if(visible&&provider==="facebook")visible.textContent=message;
  if(button){button.disabled=false;button.textContent=provider==="facebook"?"Connect Facebook Page":"Connect TikTok"}
 }
}
async function refreshProviderStatuses(){
 try{const headers=await apiHeaders(),r=await fetch(SOCIAL_PUBLISHER_URL+"/api/admin/status",{headers}),d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||"Could not read provider status.");const labels={connected:"Connected",not_connected:"Not connected",manual_only:"Manual only"};for(const p of ["facebook","tiktok"]){const el=$("status"+p[0].toUpperCase()+p.slice(1));if(el)el.textContent=labels[d.providers?.[p]]||d.providers?.[p]||"Unknown"}const diag=d.facebookDiagnostic;if(diag?.status==="error"){const detail=$("backendDetails");if(detail)detail.textContent+=" Facebook diagnostic: "+(diag.stage||"callback")+" — "+(diag.error||"Unknown error");} }catch(e){for(const p of ["facebook","tiktok"]){const el=$("status"+p[0].toUpperCase()+p.slice(1));if(el)el.textContent="Status unavailable"}}
}

function inferVideoMimeType(fileName,reportedType){
 const ext=String(fileName||"").split(".").pop().toLowerCase();
 const detected=String(reportedType||"").split(";")[0].trim().toLowerCase();
 const byExtension={mp4:"video/mp4",m4v:"video/mp4",mov:"video/quicktime",qt:"video/quicktime",webm:"video/webm","3gp":"video/3gpp","3gpp":"video/3gpp",avi:"video/x-msvideo",mkv:"video/x-matroska",mpeg:"video/mpeg",mpg:"video/mpeg",flv:"video/x-flv",wmv:"video/x-ms-wmv"};
 if(/^video\/[a-z0-9.+-]+$/.test(detected))return detected;
 if(detected==="application/octet-stream")return byExtension[ext]||detected;
 if(byExtension[ext])return byExtension[ext];
 throw new Error("Unsupported video format. Detected MIME type: "+(detected||"unknown")+". Please attach a standard video file such as MP4, MOV or WebM.");
}
async function uploadYoutube(postId,post,button){
 button.disabled=true;button.textContent="Preparing YouTube upload…";
 try{
  if(post.status!=="approved_pending_platform_setup"&&post.status!=="approved")throw new Error("Approve this post before uploading.");
  if(!post.localVideoKey)throw new Error("Attach the video in this browser first.");
  const local=await getStoredSocialVideo(post.localVideoKey);if(!local?.blob)throw new Error("Local video file is missing. Reattach it from this device.");
  const mimeType=inferVideoMimeType(local.fileName||post.localVideoName,local.blob.type);const headers=await apiHeaders(),init=await fetch(SOCIAL_PUBLISHER_URL+"/api/youtube/upload/init",{method:"POST",headers,body:JSON.stringify({title:post.title,description:post.platformCaptions?.youtube||post.description||"",mimeType,sizeBytes:local.blob.size,privacyStatus:$("youtubePrivacy")?.value||"private"})});
  const data=await init.json();if(!init.ok||!data.ok)throw new Error(data.error||"YouTube upload could not be initialized.");
  button.textContent="Uploading video directly to YouTube…";
  await updateDoc(doc(db(),"socialPosts",postId),{platformResults:{...(post.platformResults||{}),youtube:{status:"uploading",message:"Video is being transferred directly from this browser to YouTube."}},updatedAt:serverTimestamp()});
  const sent=await fetch(data.uploadUrl,{method:"PUT",headers:{"Content-Type":mimeType},body:local.blob});
  if(!sent.ok)throw new Error("YouTube rejected video upload (HTTP "+sent.status+").");
  const result=await sent.json();if(!result.id)throw new Error("YouTube upload returned no video ID.");
  const videoUrl="https://www.youtube.com/watch?v="+encodeURIComponent(result.id);
  await updateDoc(doc(db(),"socialPosts",postId),{status:"published",platformResults:{...(post.platformResults||{}),youtube:{status:"published",postUrl:videoUrl,platformVideoId:result.id,message:"YouTube confirmed the upload."}},updatedAt:serverTimestamp()});
  say("YouTube upload confirmed: "+videoUrl);await load();
 }catch(e){try{await updateDoc(doc(db(),"socialPosts",postId),{platformResults:{...(post.platformResults||{}),youtube:{status:"failed",message:e.message}},updatedAt:serverTimestamp()})}catch(_){}say("YouTube upload failed: "+e.message);button.disabled=false;button.textContent="Retry YouTube upload";}
}



async function checkFacebookStatus(postId,post,button){
 if(button){button.disabled=true;button.textContent="Checking Facebook…"}
 try{
  const videoId=post.platformResults?.facebook?.platformVideoId;if(!videoId)throw new Error("No Facebook video ID is saved for this post.");
  const headers=await apiHeaders(),r=await fetch(SOCIAL_PUBLISHER_URL+"/api/facebook/reels/status",{method:"POST",headers,body:JSON.stringify({videoId})}),d=await r.json();
  if(!r.ok||!d.ok)throw new Error(d.error||"Could not check Facebook status.");
  const published=d.videoStatus==="published"||d.publishingPhase==="complete";
  const postUrl="https://www.facebook.com/reel/"+encodeURIComponent(videoId);
  const result={status:published?"published":"processing",platformVideoId:videoId,postUrl:published?postUrl:null,message:published?"Facebook confirms this Reel is published.":"Facebook accepted the Reel and is still processing/publishing it. Check again shortly.",videoStatus:d.videoStatus,publishingPhase:d.publishingPhase};
  await updateDoc(doc(db(),"socialPosts",postId),{platformResults:{...(post.platformResults||{}),facebook:result},updatedAt:serverTimestamp()});
  say(result.message);await load();
 }catch(e){say("Facebook status check failed: "+e.message);if(button){button.disabled=false;button.textContent="Check Facebook publishing status"}}
}
async function uploadFacebook(postId,post,button){
 button.disabled=true;button.textContent="Preparing Facebook Reel…";
 try{
  if(post.status!=="approved_pending_platform_setup"&&post.status!=="approved")throw new Error("Approve this post before uploading.");
  if(!post.localVideoKey)throw new Error("Attach the video in this browser first. Facebook direct upload does not need cloud storage.");
  const local=await getStoredSocialVideo(post.localVideoKey);if(!local?.blob)throw new Error("Local video file is missing. Reattach it from this device.");
  if(local.blob.size>1024*1024*1024)throw new Error("Facebook Reel file exceeds 1 GB.");
  const headers=await apiHeaders(),init=await fetch(SOCIAL_PUBLISHER_URL+"/api/facebook/reels/start",{method:"POST",headers,body:JSON.stringify({title:post.title,sizeBytes:local.blob.size})});
  const data=await init.json();if(!init.ok||!data.ok)throw new Error(data.error||"Facebook upload could not be initialized.");
  button.textContent="Uploading directly to Facebook…";
  await updateDoc(doc(db(),"socialPosts",postId),{platformResults:{...(post.platformResults||{}),facebook:{status:"uploading",message:"Video is transferring directly from this browser to Facebook. No cloud video storage is used."}},updatedAt:serverTimestamp()});
  const sent=await fetch(data.uploadUrl,{method:"POST",headers:{"Authorization":data.uploadAuthorization,"Content-Type":"application/octet-stream","offset":"0","file_size":String(local.blob.size)},body:local.blob});
  const uploaded=await sent.json().catch(()=>({}));
  if(!sent.ok||uploaded.success!==true)throw new Error(uploaded.error?.message||uploaded.error||"Facebook did not confirm the video transfer (HTTP "+sent.status+").");
  button.textContent="Publishing Facebook Reel…";
  const finish=await fetch(SOCIAL_PUBLISHER_URL+"/api/facebook/reels/finish",{method:"POST",headers,body:JSON.stringify({videoId:data.videoId,title:post.title,description:post.platformCaptions?.facebook||post.description||""})});
  const result=await finish.json();if(!finish.ok||!result.ok||result.success!==true)throw new Error(result.error||"Facebook did not accept the Reel for publishing.");
  const saved={...(post.platformResults||{}),facebook:{status:"processing",platformVideoId:data.videoId,message:"Facebook accepted the Reel. It is processing; use Check Facebook publishing status before treating it as published."}};
  await updateDoc(doc(db(),"socialPosts",postId),{platformResults:saved,updatedAt:serverTimestamp()});
  say("Facebook accepted the Reel; it may take a little time to finish processing.");await checkFacebookStatus(postId,{...post,platformResults:saved});
 }catch(e){
  try{await updateDoc(doc(db(),"socialPosts",postId),{platformResults:{...(post.platformResults||{}),facebook:{status:"failed",message:e.message}},updatedAt:serverTimestamp()})}catch(_){}
  say("Facebook upload failed: "+e.message);button.disabled=false;button.textContent="Retry Facebook Reel upload";
 }
}

function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function when(v){if(!v)return "Not scheduled";const d=v.toDate?v.toDate():new Date(v);return Number.isNaN(d.getTime())?"Time not set":d.toLocaleString()}
const SOCIAL_VIDEO_DB="zeeroz-social-media";
const SOCIAL_PUBLISHER_URL="https://zeeroz-social-publisher.gahejoqasimk.workers.dev";
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
 const labels={not_started:"Not started",awaiting_platform_setup:"Awaiting platform connection",ready:"Ready to publish",uploading:"Uploading",processing:"Processing on Facebook",published:"Published",failed:"Failed",scheduled:"Scheduled"};
 return labels[value]||value||"Not started";
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
   videoLine+'<div><button class="btn secondary" data-action="approve">Approve / queue</button><button class="btn secondary" data-action="draft">Return to draft</button><button class="btn danger" data-action="delete">Delete</button></div>';
  if(p.localVideoKey){
   try{
    const local=await getStoredSocialVideo(p.localVideoKey);
    if(local?.blob){
     const url=URL.createObjectURL(local.blob);localVideoObjectUrls.push(url);
     const video=document.createElement("video");video.controls=true;video.playsInline=true;video.preload="metadata";video.src=url;
     video.style.cssText="display:block;width:100%;max-height:360px;margin-top:12px;border-radius:10px;background:#101b3d";
     const download=document.createElement("a");download.href=url;download.download=local.fileName||p.localVideoName||"zeeroz-video.webm";download.textContent="Download attached video";download.style.cssText="display:inline-block;margin-top:8px;color:#3157d5;font-weight:700";
     card.append(video,download);
    }else{const missing=document.createElement("p");missing.className="hint";missing.textContent="Temporary video file is no longer available in this browser. Recreate or attach it again.";card.append(missing)}
   }catch(e){const missing=document.createElement("p");missing.className="hint";missing.textContent="Local video could not be opened: "+e.message;card.append(missing)}
  }


  if(p.platformResults?.facebook?.status==="processing"&&p.platformResults?.facebook?.platformVideoId){
   const fbStatus=document.createElement("button");fbStatus.className="btn secondary";fbStatus.type="button";fbStatus.textContent="Check Facebook publishing status";
   fbStatus.addEventListener("click",()=>checkFacebookStatus(d.id,p,fbStatus));card.append(fbStatus);
  }
  if((p.platforms||[]).includes("facebook")&&p.localVideoKey){
   const fb=document.createElement("button");fb.className="btn";fb.type="button";fb.textContent="Upload Facebook Reel";
   fb.disabled=!(p.status==="approved_pending_platform_setup"||p.status==="approved");
   fb.title=fb.disabled?"Approve this post first":"Upload this local video directly to your Facebook Page";
   fb.addEventListener("click",()=>uploadFacebook(d.id,p,fb));card.append(fb);
  }
  if((p.platforms||[]).includes("youtube")&&p.localVideoKey){
   const yt=document.createElement("button");yt.className="btn";yt.type="button";yt.textContent="Upload to YouTube";
   yt.disabled=!(p.status==="approved_pending_platform_setup"||p.status==="approved");
   yt.title=yt.disabled?"Approve this post first":"Upload this local video directly to YouTube";
   yt.addEventListener("click",()=>uploadYoutube(d.id,p,yt));card.append(yt);
  }
  card.querySelector('[data-action="captions"]').addEventListener("click",()=>{
   const updated={};card.querySelectorAll("[data-caption]").forEach(el=>updated[el.dataset.caption]=el.value.trim());
   change(d.id,{platformCaptions:updated});
  });
  card.querySelector('[data-action="approve"]').addEventListener("click",()=>{
   const platformResults={...(p.platformResults||{})};
   (p.platforms||[]).forEach(x=>{platformResults[x]={status:"awaiting_platform_setup",message:"Official platform account authorization and direct-upload integration are not configured yet."}});
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

// Ensure Firebase has initialized before binding auth and UI handlers.
if(!window.ZeerozFirebase){
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error("Firebase initialization timed out. Please reload the page.")),15000);
  window.addEventListener("zeeroz-firebase-ready",()=>{clearTimeout(timeout);resolve()}, {once:true});
 });
}

onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 try{const token=await user.getIdTokenResult(true);if(token.claims.admin!==true){document.body.innerHTML="<main style='padding:30px;font:16px system-ui'><h2>Administrator access required</h2><a href='./student-login.html'>Sign in</a></main>";return}admin=true;await load();await checkPublishingBackend();await refreshProviderStatuses();const qp=new URLSearchParams(location.search),fbResult=qp.get("facebook");if(fbResult==="error")say("Facebook connection failed: "+(qp.get("reason")||"Unknown error"));else if(fbResult==="connected")say("Facebook connected successfully.")}catch(e){say("Could not load queue: "+e.message)}
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

$("checkBackend")?.addEventListener("click",checkPublishingBackend);
$("connectYoutube")?.addEventListener("click",connectYoutube);

$("connectFacebook")?.addEventListener("click",()=>connectSocialProvider("facebook"));
$("connectTiktok")?.addEventListener("click",()=>connectSocialProvider("tiktok"));
