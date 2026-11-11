import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
let mode = "login";
const form = $("authForm"), message = $("message"), submit = $("submitBtn");
function show(text, error=false){message.textContent=text;message.className="message"+(error?" error":"");message.style.display="block"}
function setMode(next){
  mode=next; $("loginTab").classList.toggle("active",mode==="login");$("registerTab").classList.toggle("active",mode==="register");
  $("nameWrap").hidden=mode!=="register";$("fullName").required=mode==="register";
  $("formTitle").textContent=mode==="login"?"Welcome back":"Create your student account";
  $("formSub").textContent=mode==="login"?"Sign in to continue learning.":"Join Zeeroz Academy and start your learning journey.";
  submit.textContent=mode==="login"?"Sign in securely":"Create student account";$("password").autocomplete=mode==="login"?"current-password":"new-password";message.style.display="none";
}
$("loginTab").addEventListener("click",()=>setMode("login"));$("registerTab").addEventListener("click",()=>setMode("register"));
function friendly(error){
 const code=error?.code||"";
 if(code.includes("email-already-in-use"))return "This email already has an account. Please sign in.";
 if(code.includes("invalid-credential")||code.includes("wrong-password")||code.includes("user-not-found"))return "Email or password is incorrect.";
 if(code.includes("weak-password"))return "Please choose a stronger password (at least 8 characters).";
 if(code.includes("network-request-failed"))return "Network problem. Check your internet and try again.";
 if(code.includes("operation-not-allowed"))return "Email/Password sign-in is not enabled yet in Firebase Console.";
 return error?.message||"Something went wrong. Please try again.";
}
form.addEventListener("submit",async(e)=>{
 e.preventDefault();submit.disabled=true;message.style.display="none";
 try{
  const fb=window.ZeerozFirebase;if(!fb)throw new Error("Firebase is still loading. Please try again.");
  const email=$("email").value.trim().toLowerCase(),password=$("password").value;
  if(mode==="register"){
   const name=$("fullName").value.trim();if(!name)throw new Error("Please enter your full name.");
   const cred=await createUserWithEmailAndPassword(fb.auth,email,password);
   await updateProfile(cred.user,{displayName:name});
   await setDoc(doc(fb.db,"profiles",cred.user.uid),{uid:cred.user.uid,email:cred.user.email,displayName:name,role:"student",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
   await sendEmailVerification(cred.user);
   await fb.auth.signOut();setMode("login");show("Account created. A verification email has been sent. Verify your email before signing in.");
  }else{
   const cred=await signInWithEmailAndPassword(fb.auth,email,password);
   if(!cred.user.emailVerified){await sendEmailVerification(cred.user);await fb.auth.signOut();throw new Error("Please verify your email first. A fresh verification email has been sent.");}
   const snap=await getDoc(doc(fb.db,"profiles",cred.user.uid));
   if(!snap.exists()){
    await setDoc(doc(fb.db,"profiles",cred.user.uid),{uid:cred.user.uid,email:cred.user.email||email,displayName:cred.user.displayName||"",role:"student",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
   }
   const token=await cred.user.getIdTokenResult(true);
   location.href=token.claims.admin===true?"./admin.html":"./student-dashboard.html";
  }
 }catch(error){show(friendly(error),true)}finally{submit.disabled=false}
});
