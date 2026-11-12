import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const $=id=>document.getElementById(id);
onAuthStateChanged(window.ZeerozFirebase.auth,async user=>{
 if(!user){location.href="./student-login.html";return}
 const id=new URLSearchParams(location.search).get("id");
 if(!id){$("courseTitle").textContent="Course not found";$("courseDescription").textContent="No course was selected. Return to the Student Dashboard."; $("courseStatus").textContent="Please open a course from your dashboard.";return}
 try{
  const snap=await getDoc(doc(window.ZeerozFirebase.db,"courses",id));
  if(!snap.exists()||snap.data().published!==true){$("courseTitle").textContent="Course not available";$("courseDescription").textContent="This course may have been unpublished or removed."; $("courseStatus").textContent="Please return to the Student Dashboard.";return}
  const data=snap.data();
  $("courseTitle").textContent=data.title||"Untitled course";
  $("courseDescription").textContent=data.description||"No course description has been added yet.";
  $("courseStatus").textContent="This course is published and available. Chapters and lessons will appear here when the Academy administrator adds them.";
 }catch(error){
  console.error(error);$("courseTitle").textContent="Unable to load course";
  $("courseDescription").textContent="Please check your internet connection and try again.";
  $("courseStatus").textContent="Course details could not be retrieved.";
 }
});