import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id), db=()=>window.ZeerozFirebase.db;
let admin=false;
const names={youtube:"YouTube",facebook:"Facebook",instagram:"Instagram",tiktok:"TikTok"};
function say(s){$("status").textContent=s}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function when(v){if(!v)return "Not scheduled";const d=v.toDate?v.toDate():new Date(v);return Number.isNaN(d.getTime())?"Time not set":d.toLocaleString()}
async function load(){
 const snap=await getDocs(query(collection(db(),"socialPosts"),orderBy("createdAt","desc")));
 const host=$("posts");host.replaceChildren();
 if(!snap.size){host.textContent="No social posts yet. Create your first draft above.";return}
 snap.docs.forEach(d=>{
  const p=d.data(),card=document.createElement("article");card.className="post";
  const platforms=(p.platforms||[]).map(x=>'<span class="tag">'+esc(names[x]||x)+'</span>').join("");
  card.innerHTML='<strong>'+esc(p.title)+'</strong><p class="hint">'+esc(p.description||"")+'</p>'+platforms+
   '<p class="hint">Mode: '+esc(p.publishMode||"approval")+' · Status: <strong>'+esc(p.status||"draft")+'</strong> · Schedule: '+esc(when(p.scheduleAt))+'</p>'+
   '<p class="hint">Video: <a href="'+esc(p.videoUrl)+'" target="_blank" rel="noopener">Open video</a></p>'+
   '<div><button class="btn secondary" data-action="approve">Approve / queue</button><button class="btn secondary" data-action="draft">Return to draft</button><button class="btn danger" data-action="delete">Delete</button></div>';
  card.querySelector('[data-action="approve"]').addEventListener("click",()=>change(d.id,{status:"approved_pending_platform_setup",approvedAt:serverTimestamp()}));
  card.querySelector('[data-action="draft"]').addEventListener("click",()=>change(d.id,{status:"draft",approvedAt:null}));
  card.querySelector('[data-action="delete"]').addEventListener("click",async()=>{if(!confirm("Delete this content record?"))return;await deleteDoc(doc(db(),"socialPosts",d.id));say("Draft deleted.");await load()});
  host.append(card);
 });
}
async function change(id,data){try{await updateDoc(doc(db(),"socialPosts",id),{...data,updatedAt:serverTimestamp()});say("Content record updated.");await load()}catch(e){say("Update failed: "+e.message)}}
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 try{const token=await user.getIdTokenResult(true);if(token.claims.admin!==true){document.body.innerHTML="<main style='padding:30px;font:16px system-ui'><h2>Administrator access required</h2><a href='./student-login.html'>Sign in</a></main>";return}admin=true;await load()}catch(e){say("Could not load queue: "+e.message)}
});
$("postForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!admin)return;
 try{
  const videoUrl=$("videoUrl").value.trim(),websiteUrl=$("websiteUrl").value.trim();
  if(!/^https:\/\//i.test(videoUrl))throw new Error("Video URL must be HTTPS.");
  if(websiteUrl&&!/^https:\/\//i.test(websiteUrl))throw new Error("Website URL must be HTTPS.");
  const platforms=[...document.querySelectorAll('input[name="platform"]:checked')].map(x=>x.value);
  if(!platforms.length)throw new Error("Select at least one platform.");
  const raw=$("scheduleAt").value;
  const scheduleAt=raw?new Date(raw):null;if(scheduleAt&&Number.isNaN(scheduleAt.getTime()))throw new Error("Choose a valid publishing time.");
  const ref=await addDoc(collection(db(),"socialPosts"),{
   title:$("title").value.trim(),videoUrl,websiteUrl,description:$("description").value.trim(),
   language:$("language").value,platforms,publishMode:$("publishMode").value,
   scheduleAt,status:"draft",platformResults:{},createdAt:serverTimestamp(),updatedAt:serverTimestamp(),
   createdBy:window.ZeerozFirebase.auth.currentUser.uid
  });
  e.target.reset();document.querySelectorAll('input[name="platform"]').forEach(x=>x.checked=true);
  say("Draft saved successfully (record "+ref.id+").");await load();
 }catch(err){say(err.message)}
});