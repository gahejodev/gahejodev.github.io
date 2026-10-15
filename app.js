"use strict";
document.getElementById("year").textContent=new Date().getFullYear();
const toggle=document.querySelector(".menu-toggle");
const nav=document.getElementById("nav-links");
toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));toggle.textContent=open?"✕":"☰"});
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");toggle.textContent="☰"}));
