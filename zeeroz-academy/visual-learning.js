const SVG_NS="http://www.w3.org/2000/svg";
const copy={
 en:{title:"Try the projectile model",intro:"Adjust launch speed and angle. The path and calculated values update together.",speed:"Launch speed",angle:"Launch angle",flight:"Flight time",height:"Maximum height",range:"Horizontal range",reset:"Reset model",assumptions:"Model assumptions: launch and landing are at the same height, air resistance is ignored, and gravitational acceleration is constant at 9.81 m/s².",launch:"Launch",land:"Land",heightAxis:"Height",rangeAxis:"Range",description:"Ideal projectile trajectory."},
 ur:{title:"پروجیکٹائل ماڈل آزمائیں",intro:"رفتار اور زاویہ تبدیل کریں؛ راستہ اور حساب شدہ نتائج ساتھ ساتھ بدلیں گے۔",speed:"ابتدائی رفتار",angle:"زاویۂ پرواز",flight:"کل وقت",height:"زیادہ سے زیادہ بلندی",range:"افقی فاصلہ",reset:"ماڈل ری سیٹ کریں",assumptions:"ماڈل کے مفروضے: لانچ اور لینڈنگ کی بلندی یکساں ہے، ہوا کی مزاحمت نظر انداز ہے اور g = 9.81 m/s² مستقل ہے۔",launch:"آغاز",land:"اختتام",heightAxis:"بلندی",rangeAxis:"افقی فاصلہ",description:"مثالی پروجیکٹائل کا راستہ۔"},
 sd:{title:"پروجیکٽائل ماڊل آزمائيو",intro:"رفتار ۽ زاويه بدلايو؛ رستو ۽ حساب ٿيل نتيجا گڏ تبديل ٿيندا۔",speed:"شروعاتي رفتار",angle:"پرواز جو زاويه",flight:"ڪل وقت",height:"وڌ ۾ وڌ اوچائي",range:"افقي فاصلو",reset:"ماڊل ٻيهر سيٽ ڪريو",assumptions:"ماڊل جا مفروضا: شروع ۽ لهڻ جي اوچائي ساڳي آهي، هوا جي مزاحمت نظرانداز آهي ۽ g = 9.81 m/s² مستقل آهي۔",launch:"شروعات",land:"لهڻ",heightAxis:"اوچائي",rangeAxis:"افقي فاصلو",description:"مثالي پروجيڪٽائل جو رستو۔"}
};
function makeNode(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function makeSvg(tag,attrs={}){const el=document.createElementNS(SVG_NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));return el;}
export function mountProjectileModel(container,{language="en"}={}){
 if(!container||container.querySelector('[data-visualization="projectile"]'))return null;
 const t=copy[language]||copy.en;
 const panel=makeNode("section","lesson-visualization projectile-visualization");
 panel.dataset.visualization="projectile";panel.setAttribute("role","region");
 const heading=makeNode("h4","projectile-heading",t.title);heading.id="projectileLessonHeading";
 panel.setAttribute("aria-labelledby",heading.id);
 panel.append(heading,makeNode("p","projectile-intro",t.intro));
 const plot=makeSvg("svg",{viewBox:"0 0 360 205",class:"projectile-plot",role:"img","aria-labelledby":"projectileLessonSvgTitle projectileLessonSvgDesc"});
 const title=makeSvg("title",{id:"projectileLessonSvgTitle"});title.textContent=t.title;
 const desc=makeSvg("desc",{id:"projectileLessonSvgDesc"});desc.textContent=t.description;
 plot.append(title,desc,makeSvg("path",{d:"M30 12V176H342",fill:"none",stroke:"#8292ad","stroke-width":"1.5"}));
 plot.append(makeSvg("path",{d:"M30 45H342M30 88H342M30 132H342",fill:"none",stroke:"#dce5f3","stroke-width":"1","stroke-dasharray":"3 5"}));
 const path=makeSvg("path",{d:"M30 176 Q180 10 330 176",fill:"none",stroke:"#0757e8","stroke-width":"3.5","stroke-linecap":"round"});
 const apex=makeSvg("circle",{cx:180,cy:65,r:5,fill:"#e6a700",stroke:"#fff","stroke-width":"2"});
 const axisLabel=(x,y,value,anchor)=>{const e=makeSvg("text",{x,y,fill:"#526078","font-size":"10","text-anchor":anchor||"start"});e.textContent=value;return e;};
 plot.append(path,apex,makeSvg("circle",{cx:30,cy:176,r:5,fill:"#0c806e"}),makeSvg("circle",{cx:330,cy:176,r:5,fill:"#0c806e"}),axisLabel(34,192,t.launch),axisLabel(304,192,t.land),axisLabel(35,22,t.heightAxis),axisLabel(342,190,t.rangeAxis,"end"));
 panel.append(plot);
 const controls=makeNode("div","projectile-controls");
 const makeControl=(key,min,max,value,step,unit)=>{
  const wrap=makeNode("div","projectile-control"),id="projectileLesson"+key;
  const lab=makeNode("label","",t[key.toLowerCase()]);lab.htmlFor=id;
  const output=makeNode("output","",value+unit);output.htmlFor=id;lab.append(output);
  const input=makeNode("input","");input.id=id;input.type="range";input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(value);
  wrap.append(lab,input);controls.append(wrap);return {input,output};
 };
 const speed=makeControl("Speed",5,40,20,1," m/s"),angle=makeControl("Angle",15,75,45,1,"°");
 panel.append(controls);
 const readouts=makeNode("div","projectile-readouts");readouts.setAttribute("aria-live","polite");readouts.setAttribute("aria-atomic","true");
 const flight=makeNode("article","projectile-readout"),height=makeNode("article","projectile-readout"),range=makeNode("article","projectile-readout");
 flight.append(makeNode("small","",t.flight),makeNode("strong","","2.88 s"));
 height.append(makeNode("small","",t.height),makeNode("strong","","10.19 m"));
 range.append(makeNode("small","",t.range),makeNode("strong","","40.77 m"));
 readouts.append(flight,height,range);panel.append(readouts);
 panel.append(makeNode("p","projectile-formula","T = 2u sin θ / g   ·   H = u² sin² θ / (2g)   ·   R = u² sin 2θ / g"));
 panel.append(makeNode("p","projectile-assumptions",t.assumptions));
 const actions=makeNode("div","projectile-actions"),reset=makeNode("button","light",t.reset);reset.type="button";actions.append(reset);panel.append(actions);
 const update=()=>{
  const u=Number(speed.input.value),degrees=Number(angle.input.value),theta=degrees*Math.PI/180,g=9.81;
  const time=2*u*Math.sin(theta)/g,maxHeight=u*u*Math.sin(theta)*Math.sin(theta)/(2*g),horizontalRange=u*u*Math.sin(2*theta)/g;
  let d="";
  for(let i=0;i<=48;i++){const q=i/48,ti=time*q,xm=u*Math.cos(theta)*ti,ym=u*Math.sin(theta)*ti-.5*g*ti*ti,x=30+(xm/170)*300,y=176-(ym/80)*148;d+=(i?" L":"M")+x.toFixed(2)+" "+y.toFixed(2);}
  path.setAttribute("d",d);apex.setAttribute("cx",String(30+(horizontalRange/2/170)*300));apex.setAttribute("cy",String(176-(maxHeight/80)*148));
  speed.output.textContent=u+" m/s";angle.output.textContent=degrees+"°";
  flight.querySelector("strong").textContent=time.toFixed(2)+" s";height.querySelector("strong").textContent=maxHeight.toFixed(2)+" m";range.querySelector("strong").textContent=horizontalRange.toFixed(2)+" m";
  desc.textContent=t.description+" "+u+" m/s, "+degrees+" degrees. "+time.toFixed(2)+" s flight, "+maxHeight.toFixed(2)+" m maximum height, "+horizontalRange.toFixed(2)+" m range.";
 };
 speed.input.addEventListener("input",update);angle.input.addEventListener("input",update);
 reset.addEventListener("click",()=>{speed.input.value="20";angle.input.value="45";update();});
 update();container.append(panel);return panel;
}
