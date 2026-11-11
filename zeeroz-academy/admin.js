import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id);let allowed=false;
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 const token=await user.getIdTokenResult(true);
 if(token.claims.admin!==true){document.body.innerHTML="<main style='font:16px system-ui;max-width:600px;margin:12vh auto;padding:24px'><h1>Access denied</h1><p>This account is not authorised as an Academy administrator.</p><a href='./student-dashboard.html'>Return to Student Desk</a></main>";return}
 allowed=true;
});
$("logout").addEventListener("click",async()=>{await signOut(window.ZeerozFirebase.auth);location.href="./student-login.html"});
async function publish(collectionName,data){if(!allowed)throw new Error("Administrator permission is required.");await addDoc(collection(window.ZeerozFirebase.db,collectionName),{...data,published:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),createdBy:window.ZeerozFirebase.auth.currentUser.uid});$("status").textContent="Published successfully."}
$("courseForm").addEventListener("submit",async e=>{e.preventDefault();try{await publish("courses",{title:$("courseTitle").value.trim(),description:$("courseDescription").value.trim()});e.target.reset()}catch(err){$("status").textContent=err.message}});
$("announcementForm").addEventListener("submit",async e=>{e.preventDefault();try{await publish("announcements",{title:$("announcementTitle").value.trim(),message:$("announcementMessage").value.trim()});e.target.reset()}catch(err){$("status").textContent=err.message}});
