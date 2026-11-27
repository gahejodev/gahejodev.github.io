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


const vseprCopy={en:{title:"Explore molecular geometry",intro:"Choose a molecule to compare electron domains, lone pairs, shape, bond angle and hybridization.",molecule:"Choose a molecule",shape:"Molecular shape",angle:"Approximate bond angle",hybrid:"Hybridization model",domains:"Electron domains",bonding:"Bonding pairs",lone:"Lone pairs",polarity:"Polarity",reset:"Reset selection",assumptions:"Teaching model: labelled 2D projection of a 3D arrangement, not to scale; it does not measure the displayed angle. Values are approximate. Hybridization is a bonding model.",desc:"Schematic geometry for "},ur:{title:"سالماتی جیومیٹری دریافت کریں",intro:"سالمہ منتخب کر کے ڈومین، تنہا جوڑے، شکل، زاویہ اور ہائبرڈائزیشن کا موازنہ کریں۔",molecule:"سالمہ منتخب کریں",shape:"سالماتی شکل",angle:"اندازاً زاویہ",hybrid:"ہائبرڈائزیشن",domains:"الیکٹران ڈومین",bonding:"بند جوڑے",lone:"تنہا جوڑے",polarity:"قطبیت",reset:"انتخاب ری سیٹ کریں",assumptions:"تدریسی ماڈل: خاکہ سہ جہتی ترتیب کا 2D منظر ہے، پیمانے کے مطابق نہیں اور زاویہ اسکرین سے نہیں ناپا جاتا۔ اقدار اندازاً ہیں۔",desc:"سالماتی جیومیٹری: "},sd:{title:"سالماتي جاميٽري ڏسو",intro:"ماليڪيول چونڊيو ۽ ڊومين، اڪيلا جوڙا، شڪل، زاويه ۽ هائبرڊائيزيشن ڀيٽيو.",molecule:"ماليڪيول چونڊيو",shape:"سالماتي شڪل",angle:"لڳ ڀڳ زاويه",hybrid:"هائبرڊائيزيشن",domains:"اليڪٽران ڊومين",bonding:"بند جوڙا",lone:"اڪيلائي وارا جوڙا",polarity:"قطبيت",reset:"چونڊ ري سيٽ ڪريو",assumptions:"تدريسي ماڊل: خاڪو ٽي-dimensional ترتيب جو 2D ڏيک آهي، ماپ مطابق ناهي ۽ زاويه اسڪرين تان نٿو ماپجي. قدر لڳ ڀڳ آهن.",desc:"سالماتي جاميٽري: "}};
const vsepr={CO2:{f:"CO₂",c:"C",t:"O",b:2,l:0,s:{en:"Linear",ur:"خطی",sd:"سڌي ليڪ"},a:"180°",h:"sp",p:{en:"Non-polar; dipoles cancel",ur:"غیر قطبی؛ ڈائی پول ختم",sd:"غير قطبي؛ ڊائپول ختم"},pts:[[58,116],[302,116]],lp:[],n:{en:"Two domains point in opposite directions.",ur:"دو ڈومین مخالف سمتوں میں ہیں۔",sd:"ٻه ڊومين ابتڙ رخن ۾ آهن۔"}},BF3:{f:"BF₃",c:"B",t:"F",b:3,l:0,s:{en:"Trigonal planar",ur:"مثلثی مستوی",sd:"ٽڪنڊي هموار"},a:"120°",h:"sp²",p:{en:"Non-polar; dipoles cancel",ur:"غیر قطبی؛ ڈائی پول ختم",sd:"غير قطبي؛ ڊائپول ختم"},pts:[[180,34],[74,196],[286,196]],lp:[],n:{en:"Three bonding domains lie in one plane.",ur:"تین بند ڈومین ایک مستوی میں ہیں۔",sd:"ٽي بند ڊومين هڪ هموار ۾ آهن۔"}},CH4:{f:"CH₄",c:"C",t:"H",b:4,l:0,s:{en:"Tetrahedral",ur:"چہارسطحی",sd:"ٽيٽراهڊرل"},a:"109.5°",h:"sp³",p:{en:"Non-polar; symmetry cancels dipoles",ur:"غیر قطبی؛ توازن ڈائی پول ختم کرتا ہے",sd:"غير قطبي؛ همواري ڊائپول ختم ڪري ٿي"},pts:[[180,30],[78,165],[282,165],[180,218]],lp:[],n:{en:"Four domains point towards a tetrahedron; this is a 2D projection.",ur:"چار ڈومین چہارسطح کے کونوں کی طرف ہیں؛ یہ 2D منظر ہے۔",sd:"چار ڊومين ٽيٽراهڊرن جي ڪنڊن ڏانهن آهن؛ هي 2D ڏيک آهي۔"}},NH3:{f:"NH₃",c:"N",t:"H",b:3,l:1,s:{en:"Trigonal pyramidal",ur:"مثلثی اہرامی",sd:"ٽڪنڊي هرمي"},a:"≈107°",h:"sp³",p:{en:"Polar",ur:"قطبی",sd:"قطبي"},pts:[[180,43],[84,184],[276,184]],lp:[[180,193]],n:{en:"Three bonds and one lone pair occupy four tetrahedral domains.",ur:"تین بند اور ایک تنہا جوڑا چار ڈومین بناتے ہیں۔",sd:"ٽي بند ۽ هڪ اڪيلو جوڙو چار ڊومين ٺاهين ٿا۔"}},H2O:{f:"H₂O",c:"O",t:"H",b:2,l:2,s:{en:"Bent (V-shaped)",ur:"خمیدہ",sd:"موڙيل"},a:"≈104.5°",h:"sp³",p:{en:"Polar",ur:"قطبی",sd:"قطبي"},pts:[[92,54],[268,54]],lp:[[135,183],[225,183]],n:{en:"Two O–H bonds and two lone pairs give a bent shape.",ur:"دو O–H بند اور دو تنہا جوڑے خمیدہ شکل بناتے ہیں۔",sd:"ٻه O–H بند ۽ ٻه اڪيلا جوڙا موڙيل شڪل ٺاهين ٿا۔"}}};
export function mountVseprModel(container,{language="en"}={}){if(!container||container.querySelector('[data-visualization="vsepr"]'))return null;const lang=["en","ur","sd"].includes(language)?language:"en",t=vseprCopy[lang],panel=makeNode("section","lesson-visualization vsepr-visualization");panel.dataset.visualization="vsepr";panel.setAttribute("role","region");const h=makeNode("h4","vsepr-heading",t.title);h.id="vseprLessonHeading";panel.setAttribute("aria-labelledby",h.id);panel.append(h,makeNode("p","vsepr-intro",t.intro));const wrap=makeNode("div","vsepr-controls"),lab=makeNode("label","",t.molecule);lab.htmlFor="vseprMoleculeSelect";const select=makeNode("select","vsepr-select");select.id="vseprMoleculeSelect";Object.entries(vsepr).forEach(([k,m])=>{const o=makeNode("option","",m.f);o.value=k;select.append(o)});lab.append(select);wrap.append(lab);panel.append(wrap);const svg=makeSvg("svg",{viewBox:"0 0 360 245",class:"vsepr-plot",role:"img","aria-labelledby":"vseprSvgTitle vseprSvgDesc"}),title=makeSvg("title",{id:"vseprSvgTitle"}),desc=makeSvg("desc",{id:"vseprSvgDesc"}),bonds=makeSvg("g"),lone=makeSvg("g"),atoms=makeSvg("g"),labels=makeSvg("g");svg.append(title,desc,bonds,lone,atoms,labels);panel.append(svg);const stats=makeNode("div","vsepr-stats");stats.setAttribute("aria-live","polite");stats.setAttribute("aria-atomic","true");const fields={};for(const k of ["shape","angle","hybrid","domains","bonding","lone","polarity"]){const card=makeNode("article","vsepr-stat");card.append(makeNode("small","",t[k]));fields[k]=makeNode("strong","","");card.append(fields[k]);stats.append(card)}panel.append(stats);const note=makeNode("p","vsepr-note","");panel.append(note,makeNode("p","vsepr-assumptions",t.assumptions));const render=()=>{const m=vsepr[select.value];bonds.replaceChildren();lone.replaceChildren();atoms.replaceChildren();labels.replaceChildren();title.textContent=t.title+" · "+m.f;desc.textContent=t.desc+m.f+". "+m.s[lang]+". "+m.a+". "+m.n[lang];m.pts.forEach(p=>{bonds.append(makeSvg("line",{x1:180,y1:118,x2:p[0],y2:p[1],stroke:"#3157d5","stroke-width":"5","stroke-linecap":"round"}));atoms.append(makeSvg("circle",{cx:p[0],cy:p[1],r:19,fill:"#e8f1ff",stroke:"#3157d5","stroke-width":"2"}));const a=makeSvg("text",{x:p[0],y:p[1]+5,"text-anchor":"middle",fill:"#17336d","font-size":"15","font-weight":"800"});a.textContent=m.t;labels.append(a)});m.lp.forEach(p=>[[-5,-4],[5,4]].forEach(d=>lone.append(makeSvg("circle",{cx:p[0]+d[0],cy:p[1]+d[1],r:4,fill:"#d08a00"}))));atoms.append(makeSvg("circle",{cx:180,cy:118,r:24,fill:"#fff0cf",stroke:"#c88712","stroke-width":"2.5"}));const c=makeSvg("text",{x:180,y:124,"text-anchor":"middle",fill:"#68440a","font-size":"18","font-weight":"900"});c.textContent=m.c;labels.append(c);fields.shape.textContent=m.s[lang];fields.angle.textContent=m.a;fields.hybrid.textContent=m.h;fields.domains.textContent=String(m.b+m.l);fields.bonding.textContent=String(m.b);fields.lone.textContent=String(m.l);fields.polarity.textContent=m.p[lang];note.textContent=m.n[lang]};select.addEventListener("change",render);const reset=makeNode("button","vsepr-reset",t.reset);reset.type="button";reset.addEventListener("click",()=>{select.value="CO2";render();select.focus()});panel.append(reset);render();container.append(panel);return panel}


const gasCopy={
 en:{title:"Explore gas particles and pressure",intro:"Change particle count or temperature and watch random wall collisions.",count:"Particles",temperature:"Temperature",pressure:"Relative pressure index",speed:"Relative particle speed",play:"Play motion",pause:"Pause motion",step:"Step once",reset:"Reset model",assumptions:"Simplified 2D model: fixed volume and one gas species; wall collisions are elastic; particle-particle collisions and attractions are omitted. At fixed volume the pressure index is proportional to particle count × absolute temperature. It is not a measured pressure in pascals.",description:"Gas particles move randomly in a fixed container and reflect from its walls.",status:"Motion is paused."},
 ur:{title:"گیس کے ذرات اور دباؤ دریافت کریں",intro:"ذرات کی تعداد یا درجہ حرارت بدلیں اور دیواروں سے بے ترتیب ٹکراؤ دیکھیں۔",count:"ذرات",temperature:"درجہ حرارت",pressure:"نسبتی دباؤ اشاریہ",speed:"ذرات کی نسبتی رفتار",play:"حرکت چلائیں",pause:"حرکت روکیں",step:"ایک قدم بڑھائیں",reset:"ماڈل ری سیٹ کریں",assumptions:"سادہ 2D ماڈل: حجم اور گیس کی قسم مقرر؛ دیوار سے ٹکراؤ لچکدار؛ ذرات کے باہمی ٹکراؤ اور کشش شامل نہیں۔ مقرر حجم پر دباؤ اشاریہ ذرات کی تعداد × مطلق درجہ حرارت کے متناسب ہے؛ یہ پاسکل میں ناپا ہوا دباؤ نہیں۔",description:"گیس کے ذرات مقرر برتن میں بے ترتیب حرکت کرتے اور دیواروں سے پلٹتے ہیں۔",status:"حرکت رکی ہوئی ہے۔"},
 sd:{title:"گئس جا ذرڙا ۽ دٻاءُ ڏسو",intro:"ذرڙن جو تعداد يا گرمي پد بدلايو ۽ ڀتين سان بي ترتيب ٽڪر ڏسو.",count:"ذرڙا",temperature:"گرمي پد",pressure:"نسبتي دٻاءُ اشارو",speed:"ذرڙن جي نسبتي رفتار",play:"حرڪت هلايو",pause:"حرڪت روڪيو",step:"هڪ قدم وڌايو",reset:"ماڊل ٻيهر سيٽ ڪريو",assumptions:"سادو 2D ماڊل: حجم ۽ گئس جو قسم مقرر؛ ڀت سان ٽڪر لچڪدار؛ پاڻ ۾ ٽڪر ۽ ڇڪ شامل ناهن. مقرر حجم تي دٻاءَ جو اشارو ذرڙن جي تعداد × مطلق گرمي پد جي متناسب آهي؛ هي پاسڪل ۾ ماپيل دٻاءُ ناهي.",description:"گئس جا ذرڙا مقرر ٿانوَ اندر بي ترتيب هلن ٿا ۽ ڀتين تان موٽن ٿا.",status:"حرڪت رڪيل آهي."}
};
let gasModelSequence=0;
export function calculateRelativeGasPressure(particleCount,temperatureK){
 const n=Number(particleCount),t=Number(temperatureK);
 if(!Number.isFinite(n)||!Number.isFinite(t)||n<=0||t<=0)return 0;
 return (n/12)*(t/300);
}
export function mountGasParticleModel(container,{language="en"}={}){
 if(!container||container.querySelector('[data-visualization="gas-particles"]'))return null;
 const t=gasCopy[language]||gasCopy.en,uid=++gasModelSequence;
 const panel=makeNode("section","lesson-visualization gas-visualization");
 panel.dataset.visualization="gas-particles";panel.setAttribute("role","region");
 const heading=makeNode("h4","gas-heading",t.title);heading.id="gasLessonHeading"+uid;panel.setAttribute("aria-labelledby",heading.id);
 panel.append(heading,makeNode("p","gas-intro",t.intro));
 const plot=makeSvg("svg",{viewBox:"0 0 360 215",class:"gas-plot",role:"img","aria-labelledby":"gasSvgTitle"+uid+" gasSvgDesc"+uid});
 const svgTitle=makeSvg("title",{id:"gasSvgTitle"+uid});svgTitle.textContent=t.title;
 const svgDesc=makeSvg("desc",{id:"gasSvgDesc"+uid});svgDesc.textContent=t.description;
 plot.append(svgTitle,svgDesc,makeSvg("rect",{x:22,y:18,width:316,height:174,rx:10,fill:"#f7faff",stroke:"#8292ad","stroke-width":"2"}));
 const layer=makeSvg("g",{"aria-hidden":"true"});plot.append(layer);panel.append(plot);
 const controls=makeNode("div","gas-controls");
 const makeControl=(name,min,max,value,step,unit)=>{
  const wrap=makeNode("div","gas-control"),id="gasLesson"+uid+name,label=makeNode("label","",t[name.toLowerCase()]);
  label.htmlFor=id;const output=makeNode("output","",String(value)+unit);output.htmlFor=id;label.append(output);
  const input=makeNode("input","");input.id=id;input.type="range";input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(value);
  wrap.append(label,input);controls.append(wrap);return {input,output};
 };
 const count=makeControl("Count",6,24,12,2,""),temp=makeControl("Temperature",200,600,300,10," K");panel.append(controls);
 const readouts=makeNode("div","gas-readouts");readouts.setAttribute("aria-live","polite");readouts.setAttribute("aria-atomic","true");
 const stat=(label,value)=>{const card=makeNode("article","gas-stat");card.append(makeNode("small","",label));const strong=makeNode("strong","",value);card.append(strong);readouts.append(card);return strong};
 const pressure=stat(t.pressure,"1.00×"),speed=stat(t.speed,"1.00×"),total=stat(t.count,"12");panel.append(readouts);
 const actions=makeNode("div","gas-actions"),play=makeNode("button","gas-play",t.play),reset=makeNode("button","gas-reset",t.reset);
 play.type="button";reset.type="button";actions.append(play,reset);panel.append(actions);
 const status=makeNode("p","gas-status",t.status);status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 panel.append(status,makeNode("p","gas-assumptions",t.assumptions));
 let particles=[],raf=0,last=0,playing=false;
 const reduced=!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
 function build(){
  layer.replaceChildren();particles=[];
  for(let i=0;i<Number(count.input.value);i++){
   const col=i%6,row=Math.floor(i/6),angle=(i+1)*2.399963229728653,x=48+col*51+(row%2)*4,y=43+row*37;
   const circle=makeSvg("circle",{cx:x,cy:y,r:5,fill:"#3157d5",stroke:"#fff","stroke-width":"1.4"});layer.append(circle);
   const v=1.05+(i%4)*.16;particles.push({x,y,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v,circle});
  }
 }
 function draw(){
  const n=Number(count.input.value),k=Number(temp.input.value);
  count.output.textContent=String(n);temp.output.textContent=k+" K";total.textContent=String(n);
  pressure.textContent=calculateRelativeGasPressure(n,k).toFixed(2)+"×";speed.textContent=Math.sqrt(k/300).toFixed(2)+"×";
  svgDesc.textContent=t.description+" "+n+" particles at "+k+" kelvin.";
  for(const p of particles){p.circle.setAttribute("cx",p.x.toFixed(1));p.circle.setAttribute("cy",p.y.toFixed(1));}
 }
 function advance(dt=1){
  const scale=Math.sqrt(Number(temp.input.value)/300);
  for(const p of particles){
   p.x+=p.vx*scale*dt;p.y+=p.vy*scale*dt;
   if(p.x<32){p.x=32;p.vx=Math.abs(p.vx)}if(p.x>328){p.x=328;p.vx=-Math.abs(p.vx)}
   if(p.y<28){p.y=28;p.vy=Math.abs(p.vy)}if(p.y>182){p.y=182;p.vy=-Math.abs(p.vy)}
  }
  draw();
 }
 function stop(){playing=false;if(raf)cancelAnimationFrame(raf);raf=0;last=0;play.textContent=reduced?t.step:t.play;status.textContent=t.status;}
 function frame(now){if(!playing)return;if(!last)last=now;const dt=Math.min(2,(now-last)/16.67);last=now;advance(dt);raf=requestAnimationFrame(frame);}
 function toggle(){if(reduced){advance(1);status.textContent=t.step;return}if(playing){stop();return}playing=true;play.textContent=t.pause;status.textContent=t.pause;raf=requestAnimationFrame(frame);}
 count.input.addEventListener("input",()=>{stop();build();draw()});temp.input.addEventListener("input",draw);
 play.addEventListener("click",toggle);reset.addEventListener("click",()=>{stop();count.input.value="12";temp.input.value="300";build();draw();reset.focus()});
 if(reduced)play.textContent=t.step;build();draw();container.append(panel);return panel;
}


const liquidCopy={
 en:{title:"Explore liquid particles",intro:"Adjust temperature and intermolecular attraction to compare thermal motion, escape tendency and surface cohesion.",temperature:"Temperature",attraction:"Intermolecular attraction",motion:"Relative thermal motion",escape:"Relative escape tendency",surface:"Surface-tension trend",reset:"Reset model",low:"Lower",moderate:"Moderate",high:"Higher",weak:"Weaker",medium:"Medium",strong:"Stronger",assumptions:"Qualitative model for a generic liquid. Arrows show relative motion and cohesion only; no numerical vapour pressure, viscosity or measured force is predicted. Real values depend on the substance and conditions.",description:"Closely spaced liquid particles, a surface layer and vapour above the liquid."},
 ur:{title:"مائع کے ذرات دریافت کریں",intro:"درجۂ حرارت اور بین السالماتی کشش بدل کر حرکی حرکت، نکلنے کے رجحان اور سطحی کشش کا موازنہ کریں۔",temperature:"درجۂ حرارت",attraction:"بین السالماتی کشش",motion:"نسبتی حرکی حرکت",escape:"نکلنے کا نسبتی رجحان",surface:"سطحی تناؤ کا رجحان",reset:"ماڈل ری سیٹ کریں",low:"کم",moderate:"درمیانہ",high:"زیادہ",weak:"کمزور",medium:"درمیانی",strong:"مضبوط",assumptions:"عام مائع کا تصوری تدریسی ماڈل۔ تیر صرف نسبتی حرکت اور باہمی کشش دکھاتے ہیں؛ یہ بخاراتی دباؤ، چپچپاہٹ یا ناپی گئی قوت کی عددی پیش گوئی نہیں کرتا۔ حقیقی اقدار مادے اور حالات پر منحصر ہیں۔",description:"مائع کے قریب ذرات، سطحی تہہ اور اس کے اوپر بخارات۔"},
 sd:{title:"مائع جا ذرڙا ڳوليو",intro:"گرمي پد ۽ بين الماليڪيولي ڪشش بدلايو ۽ حرڪي حرڪت، نڪرڻ جي لاڙي ۽ سطحي ڪشش جو ڀيٽ ڪريو.",temperature:"گرمي پد",attraction:"بين الماليڪيولي ڪشش",motion:"نسبتي حرڪي حرڪت",escape:"نڪرڻ جو نسبتي لاڙو",surface:"سطحي ڇڪ جو لاڙو",reset:"ماڊل ري سيٽ ڪريو",low:"گهٽ",moderate:"وچولو",high:"وڌيڪ",weak:"ڪمزور",medium:"وچولي",strong:"مضبوط",assumptions:"عام مائع جو تصوري تدريسي ماڊل. تير رڳو نسبتي حرڪت ۽ پاڻ ۾ ڪشش ڏيکارين ٿا؛ هي ٻاڦ جي دٻاءَ، چپچپاهٽ يا ماپيل قوت جي عددي اڳڪٿي نٿو ڪري. حقيقي قدر مادي ۽ حالتن تي دارومدار رکن ٿا.",description:"مائع جا ويجها ذرڙا، سطح واري پرت ۽ مٿان ٻاڦ."}
};
export function mountLiquidModel(container,{language="en"}={}){
 if(!container||container.querySelector('[data-visualization="liquid-particles"]'))return null;
 const t=liquidCopy[language]||liquidCopy.en;
 const panel=makeNode("section","lesson-visualization liquid-visualization");
 panel.dataset.visualization="liquid-particles";
 panel.setAttribute("role","region");
 const heading=makeNode("h4","liquid-heading",t.title);
 heading.id="liquidModelHeading";
 panel.setAttribute("aria-labelledby",heading.id);
 panel.append(heading,makeNode("p","liquid-intro",t.intro));
 const plot=makeSvg("svg",{viewBox:"0 0 360 220",class:"liquid-plot",role:"img","aria-labelledby":"liquidSvgTitle liquidSvgDesc"});
 const svgTitle=makeSvg("title",{id:"liquidSvgTitle"});svgTitle.textContent=t.title;
 const desc=makeSvg("desc",{id:"liquidSvgDesc"});desc.textContent=t.description;
 plot.append(svgTitle,desc);
 plot.append(makeSvg("rect",{x:20,y:70,width:320,height:130,rx:15,fill:"#dcefff",stroke:"#6d93bd","stroke-width":2}));
 plot.append(makeSvg("path",{d:"M22 105 Q55 99 88 105 T154 105 T220 105 T286 105 T338 105",fill:"none",stroke:"#2c8ec9","stroke-width":3}));
 const coords=[[48,132],[91,128],[136,145],[183,130],[226,151],[276,128],[316,154],[67,177],[119,178],[169,174],[219,184],[270,178],[307,183],[99,151],[251,143]];
 coords.forEach(([x,y],i)=>plot.append(makeSvg("circle",{cx:x,cy:y,r:i%4===0?7:6,fill:i%3===0?"#0b77b8":"#2d9bc9",stroke:"#fff","stroke-width":1.5})));
 const vapour=[[80,48],[145,31],[226,52],[293,35],[185,59]].map(([x,y])=>{const c=makeSvg("circle",{cx:x,cy:y,r:5,fill:"#8bb8e6",stroke:"#fff","stroke-width":1.5});plot.append(c);return c;});
 const vectors=coords.slice(0,8).map(([x,y],i)=>{const line=makeSvg("path",{d:"M"+x+" "+y+" l4 -3",fill:"none",stroke:"#125b8c","stroke-width":2,"stroke-linecap":"round"});plot.append(line);return {line,x,y,dx:[1,-1,0,1,-1,0,1,-1][i],dy:[-1,0,1,0,-1,1,1,-1][i]};});
 const cohesion=makeSvg("g",{stroke:"#d18a19","stroke-width":2,"stroke-linecap":"round",fill:"none"});plot.append(cohesion);
 const liquidLabel=makeSvg("text",{x:28,y:91,fill:"#24557b","font-size":10,"font-weight":700});liquidLabel.textContent=language==="ur"?"مائع":language==="sd"?"مائع":"Liquid";plot.append(liquidLabel);
 const vapourLabel=makeSvg("text",{x:28,y:23,fill:"#56718d","font-size":10,"font-weight":700});vapourLabel.textContent=language==="ur"?"بخارات":language==="sd"?"ٻاڦ":"Vapour";plot.append(vapourLabel);
 panel.append(plot);
 const controls=makeNode("div","liquid-controls");
 const makeControl=(id,label,min,max,value,step,unit)=>{
  const wrap=makeNode("div","liquid-control"),lab=makeNode("label","",label),out=makeNode("output","",value+unit),input=makeNode("input","");
  input.id=id;input.type="range";input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(value);
  lab.htmlFor=id;out.htmlFor=id;lab.append(out);wrap.append(lab,input);controls.append(wrap);return {input,out};
 };
 const temp=makeControl("liquidTemperature",t.temperature,10,90,25,5," °C");
 const attraction=makeControl("liquidAttraction",t.attraction,1,3,2,1,"");
 panel.append(controls);
 const readouts=makeNode("div","liquid-readouts");readouts.setAttribute("aria-live","polite");readouts.setAttribute("aria-atomic","true");
 const motion=makeNode("article","liquid-stat"),escape=makeNode("article","liquid-stat"),surface=makeNode("article","liquid-stat");
 motion.append(makeNode("small","",t.motion),makeNode("strong","","—"));
 escape.append(makeNode("small","",t.escape),makeNode("strong","","—"));
 surface.append(makeNode("small","",t.surface),makeNode("strong","","—"));
 readouts.append(motion,escape,surface);panel.append(readouts,makeNode("p","liquid-assumptions",t.assumptions));
 const actions=makeNode("div","liquid-actions"),reset=makeNode("button","",t.reset);reset.type="button";actions.append(reset);panel.append(actions);
 const update=()=>{
  const celsius=Number(temp.input.value),strength=Number(attraction.input.value),thermal=(celsius-10)/80;
  const motionWord=celsius<30?t.low:celsius<60?t.moderate:t.high;
  const tendency=thermal*0.68+(3-strength)*0.16;
  const escapeWord=tendency<0.34?t.low:tendency<0.68?t.moderate:t.high;
  const surfaceScore=(1-thermal)*0.55+((strength-1)/2)*0.45;
  const surfaceWord=surfaceScore>=0.65?t.high:surfaceScore>=0.35?t.moderate:t.low;
  const strengthWord=strength===1?t.weak:strength===2?t.medium:t.strong;
  temp.out.textContent=celsius+" °C";attraction.out.textContent=strengthWord;
  motion.querySelector("strong").textContent=motionWord;
  escape.querySelector("strong").textContent=escapeWord;
  surface.querySelector("strong").textContent=surfaceWord;
  vectors.forEach(v=>{const len=4+thermal*11;v.line.setAttribute("d","M"+v.x+" "+v.y+" l"+(v.dx*len).toFixed(1)+" "+(v.dy*len).toFixed(1));});
  const visible=Math.max(1,Math.min(vapour.length,1+Math.round(tendency*4)));
  vapour.forEach((v,i)=>v.setAttribute("opacity",i<visible?"1":"0.18"));
  cohesion.replaceChildren();
  const inward=strength===1?5:strength===2?10:16;
  [[91,105],[183,105],[276,105]].forEach(([x,y])=>cohesion.append(makeSvg("path",{d:"M"+x+" "+(y+1)+" l0 "+inward+" m-3 -3 l3 3 3 -3"})));
  desc.textContent=t.description+" Temperature "+celsius+" degrees Celsius; attraction "+strengthWord+". Relative thermal motion "+motionWord+"; escape tendency "+escapeWord+". Qualitative only.";
 };
 temp.input.addEventListener("input",update);attraction.input.addEventListener("input",update);
 reset.addEventListener("click",()=>{temp.input.value="25";attraction.input.value="2";update();});
 update();container.append(panel);return panel;
}

let solidModelSequence=0;
const solidCopy={
 en:{title:"Explore crystalline and amorphous solids",intro:"Switch the model to compare long-range order with a disordered solid structure.",crystal:"Crystalline",amorphous:"Amorphous",order:"Particle arrangement",melting:"Melting behaviour",cleavage:"Fracture pattern",crystalOrder:"Repeating long-range lattice",amorphousOrder:"No long-range periodic order",crystalMelting:"Relatively sharp melting point",amorphousMelting:"Softens over a temperature range",crystalCleavage:"May split along preferred planes",amorphousCleavage:"No regular lattice cleavage planes",crystalNote:"The repeating lattice creates characteristic planes and symmetry.",amorphousNote:"Local order may exist, but there is no repeating pattern over long distances.",assumptions:"Teaching diagram only, not to scale. Real samples can contain defects, several crystal grains or mixed crystalline and amorphous regions.",description:"A schematic particle arrangement for a crystalline solid."},
 ur:{title:"قلمی اور بے قلمی ٹھوس دیکھیں",intro:"طویل فاصلے کی ترتیب اور بے ترتیب ٹھوس ساخت کا موازنہ کریں۔",crystal:"قلمی",amorphous:"بے قلمی",order:"ذرات کی ترتیب",melting:"پگھلنے کا رویہ",cleavage:"ٹوٹنے کا انداز",crystalOrder:"طویل فاصلے تک دہرایا جانے والا جال",amorphousOrder:"طویل فاصلے کی باقاعدہ ترتیب نہیں",crystalMelting:"نسبتاً واضح نقطۂ پگھلاؤ",amorphousMelting:"درجۂ حرارت کی حد میں نرم ہوتا ہے",crystalCleavage:"ترجیحی سطحوں کے ساتھ ٹوٹ سکتا ہے",amorphousCleavage:"جالی کی باقاعدہ شکست کی سطحیں نہیں",crystalNote:"دہرایا جانے والا جال مخصوص سطحیں اور توازن بناتا ہے۔",amorphousNote:"مقامی ترتیب ہو سکتی ہے، مگر طویل فاصلے تک دہرایا جانے والا نمونہ نہیں۔",assumptions:"صرف تدریسی خاکہ، پیمانے کے مطابق نہیں۔ حقیقی نمونوں میں نقائص، کئی قلمی دانے یا ملی جلی قلمی اور بے قلمی ساخت ہو سکتی ہے۔",description:"قلمی ٹھوس میں ذرات کی خاکہ نما ترتیب۔"},
 sd:{title:"قلمی ۽ بي قلمی ٺوس ڏسو",intro:"ڊگهي فاصلي واري ترتيب ۽ بي ترتيب ٺوس بناوت جو ڀيٽ ڪريو.",crystal:"قلمی",amorphous:"بي قلمی",order:"ذرڙن جي ترتيب",melting:"پگھلڻ جو رويو",cleavage:"ٽٽڻ جو نمونو",crystalOrder:"ڊگهي فاصلي تائين ورجائجندڙ جال",amorphousOrder:"ڊگهي فاصلي واري باقاعده ترتيب ناهي",crystalMelting:"نسبتاً واضح پگھلڻ وارو نقطو",amorphousMelting:"گرمي پد جي حد ۾ نرم ٿئي ٿو",crystalCleavage:"ترجيحي سطحن سان ٽٽي سگهي ٿو",amorphousCleavage:"جال جون باقاعده ٽٽڻ واريون سطحون ناهن",crystalNote:"ورجائجندڙ جال خاص سطحون ۽ همواري پيدا ڪري ٿو.",amorphousNote:"مقامي ترتيب ٿي سگهي ٿي، پر ڊگهي فاصلي تائين ورجائجندڙ نمونو ناهي.",assumptions:"رڳو تدريسي خاڪو، ماپ مطابق ناهي. حقيقي نمونن ۾ نقص، ڪيترائي قلمی داڻا يا گڏيل قلمی ۽ بي قلمی حصا ٿي سگهن ٿا.",description:"قلمی ٺوس ۾ ذرڙن جي خاڪي ترتيب."}
};
const amorphousPoints=[[45,47],[93,38],[143,56],[195,39],[250,51],[310,40],[61,92],[116,105],[164,88],[219,111],[275,91],[326,111],[36,153],[88,143],[138,166],[188,145],[241,158],[297,148],[68,188],[121,190],[177,185],[230,190],[284,181],[329,185]];
export function mountSolidStructureModel(container,{language="en"}={}){
 if(!container||container.querySelector('[data-visualization="solid-structure"]'))return null;
 const lang=["en","ur","sd"].includes(language)?language:"en",t=solidCopy[lang],uid=++solidModelSequence;
 const panel=makeNode("section","lesson-visualization solid-structure-visualization");
 panel.dataset.visualization="solid-structure";panel.setAttribute("role","region");
 const heading=makeNode("h4","solid-structure-heading",t.title);heading.id="solidStructureHeading"+uid;panel.setAttribute("aria-labelledby",heading.id);
 panel.append(heading,makeNode("p","solid-structure-intro",t.intro));
 const controls=makeNode("div","solid-structure-controls");controls.setAttribute("role","group");controls.setAttribute("aria-label",t.title);
 const crystalButton=makeNode("button","solid-structure-mode",t.crystal),amorphousButton=makeNode("button","solid-structure-mode",t.amorphous);
 crystalButton.type="button";amorphousButton.type="button";controls.append(crystalButton,amorphousButton);panel.append(controls);
 const svg=makeSvg("svg",{viewBox:"0 0 360 220",class:"solid-structure-plot",role:"img","aria-labelledby":"solidStructureSvgTitle"+uid+" solidStructureSvgDesc"+uid});
 const svgTitle=makeSvg("title",{id:"solidStructureSvgTitle"+uid}),svgDesc=makeSvg("desc",{id:"solidStructureSvgDesc"+uid});
 const background=makeSvg("rect",{x:8,y:8,width:344,height:204,rx:14,fill:"#f7faff",stroke:"#d8e3f2","stroke-width":"1.5"});
 const structure=makeSvg("g");svg.append(svgTitle,svgDesc,background,structure);panel.append(svg);
 const stats=makeNode("div","solid-structure-readouts");stats.setAttribute("aria-live","polite");stats.setAttribute("aria-atomic","true");
 const fields={};
 for(const key of ["order","melting","cleavage"]){const card=makeNode("article","solid-structure-stat");card.append(makeNode("small","",t[key]));fields[key]=makeNode("strong","","");card.append(fields[key]);stats.append(card)}
 panel.append(stats);
 const note=makeNode("p","solid-structure-note","");panel.append(note,makeNode("p","solid-structure-assumptions",t.assumptions));
 const render=(mode)=>{
  const crystalline=mode==="crystalline";structure.replaceChildren();
  crystalButton.setAttribute("aria-pressed",String(crystalline));amorphousButton.setAttribute("aria-pressed",String(!crystalline));
  if(crystalline){
   for(let r=0;r<4;r++)for(let c=0;c<6;c++){const x=48+c*53,y=43+r*44;if(c<5)structure.append(makeSvg("line",{x1:x,y1:y,x2:x+53,y2:y,stroke:"#b4c5df","stroke-width":"1.5"}));if(r<3)structure.append(makeSvg("line",{x1:x,y1:y,x2:x,y2:y+44,stroke:"#b4c5df","stroke-width":"1.5"}))}
   for(let r=0;r<4;r++)for(let c=0;c<6;c++){const x=48+c*53,y=43+r*44;structure.append(makeSvg("circle",{cx:x,cy:y,r:10,fill:(r+c)%2?"#78a9ee":"#3157d5",stroke:"#173d8b","stroke-width":"1.5"}))}
   const label=makeSvg("text",{x:180,y:204,"text-anchor":"middle",fill:"#31507b","font-size":"10","font-weight":"700"});label.textContent="Repeating lattice";structure.append(label);
   fields.order.textContent=t.crystalOrder;fields.melting.textContent=t.crystalMelting;fields.cleavage.textContent=t.crystalCleavage;
   note.textContent=t.crystalNote;svgTitle.textContent=t.crystal;svgDesc.textContent=t.description;
  }else{
   const links=[[0,7],[2,9],[4,10],[6,13],[8,15],[11,17],[12,18],[14,20],[16,22]];
   for(const [a,b] of links){const p=amorphousPoints[a],q=amorphousPoints[b];structure.append(makeSvg("line",{x1:p[0],y1:p[1],x2:q[0],y2:q[1],stroke:"#c3cfdf","stroke-width":"1.2","stroke-dasharray":"3 4"}))}
   amorphousPoints.forEach((p,i)=>structure.append(makeSvg("circle",{cx:p[0],cy:p[1],r:10,fill:i%2?"#8dbfa8":"#2e9873",stroke:"#176a52","stroke-width":"1.5"})));
   const label=makeSvg("text",{x:180,y:204,"text-anchor":"middle",fill:"#31507b","font-size":"10","font-weight":"700"});label.textContent="No repeating long-range pattern";structure.append(label);
   fields.order.textContent=t.amorphousOrder;fields.melting.textContent=t.amorphousMelting;fields.cleavage.textContent=t.amorphousCleavage;
   note.textContent=t.amorphousNote;svgTitle.textContent=t.amorphous;svgDesc.textContent=t.description+" "+t.amorphousOrder;
  }
 };
 crystalButton.addEventListener("click",()=>render("crystalline"));
 amorphousButton.addEventListener("click",()=>render("amorphous"));
 render("crystalline");container.append(panel);return panel;
}


const equilibriumCopy={"en":{"title":"Explore equilibrium shifts","intro":"Choose a disturbance to the Haber equilibrium and see the predicted response.","choose":"Choose a change","none":"At equilibrium (no disturbance)","addN2":"Add nitrogen","removeNH3":"Remove ammonia","compress":"Increase pressure by compression","heat":"Increase temperature","cool":"Decrease temperature","catalyst":"Add a catalyst","reactants":"Reactants","products":"Products","forward":"Forward reaction","reverse":"Reverse reaction","shift":"Predicted shift","right":"Toward ammonia (right)","left":"Toward nitrogen and hydrogen (left)","noneShift":"No equilibrium-position shift","response":"System response","balanced":"Forward and reverse rates are equal at equilibrium","forwardFavoured":"Forward reaction is favoured","reverseFavoured":"Reverse, endothermic direction is favoured","rebalances":"Both rates adjust; the side with fewer gas moles is favoured","bothUp":"Both rates increase; the catalyst does not change the final equilibrium","k":"Equilibrium constant K","same":"Unchanged at the same temperature","down":"Decreases on heating an exothermic forward reaction","up":"Increases on cooling an exothermic forward reaction","reset":"Reset model","assumptions":"Qualitative model for N₂ + 3H₂ ⇌ 2NH₃ + heat. The forward reaction is exothermic and has fewer gas moles on the product side. Pressure response assumes compression at constant temperature. Arrows show a predicted direction, not measured rates or concentrations. A catalyst changes rates, not K or the final equilibrium composition."},"ur":{"title":"توازن کی تبدیلی دریافت کریں","intro":"ہیبر توازن میں تبدیلی منتخب کریں اور متوقع ردِعمل دیکھیں۔","choose":"تبدیلی منتخب کریں","none":"توازن قائم ہے (کوئی تبدیلی نہیں)","addN2":"نائٹروجن بڑھائیں","removeNH3":"امونیا ہٹائیں","compress":"دباؤ بڑھائیں (حجم کم کریں)","heat":"درجۂ حرارت بڑھائیں","cool":"درجۂ حرارت کم کریں","catalyst":"عامل شامل کریں","reactants":"عامل مادے","products":"مصنوعات","forward":"آگے کا عمل","reverse":"الٹا عمل","shift":"متوقع تبدیلی","right":"امونیا کی طرف (دائیں)","left":"نائٹروجن اور ہائیڈروجن کی طرف (بائیں)","noneShift":"توازن کی جگہ میں تبدیلی نہیں","response":"نظام کا ردِعمل","balanced":"توازن پر آگے اور الٹے عمل کی رفتار برابر ہوتی ہے","forwardFavoured":"آگے کے عمل کو ترجیح ملتی ہے","reverseFavoured":"الٹی، حرارت جذب کرنے والی سمت کو ترجیح ملتی ہے","rebalances":"دونوں رفتاریں بدلتی ہیں؛ کم گیسی مول والی طرف ترجیح ملتی ہے","bothUp":"دونوں رفتاریں بڑھتی ہیں؛ عامل آخری توازن نہیں بدلتا","k":"توازن مستقل K","same":"اسی درجۂ حرارت پر تبدیل نہیں ہوتا","down":"حرارت خارج کرنے والے آگے کے عمل میں گرم کرنے سے کم ہوتا ہے","up":"حرارت خارج کرنے والے آگے کے عمل میں ٹھنڈا کرنے سے بڑھتا ہے","reset":"ماڈل ری سیٹ کریں","assumptions":"N₂ + 3H₂ ⇌ 2NH₃ + حرارت کا تصوری ماڈل۔ آگے کا عمل حرارت خارج کرتا ہے اور مصنوعات کی طرف گیسی مول کم ہیں۔ دباؤ کا ردِعمل مستقل درجۂ حرارت پر حجم کم کرنے کے لیے ہے۔ تیر متوقع سمت دکھاتے ہیں، ناپی گئی رفتار یا ارتکاز نہیں۔ عامل رفتار بدلتا ہے، K یا آخری توازنی ترکیب نہیں۔"},"sd":{"title":"توازن جون تبديليون ڏسو","intro":"هيبر توازن ۾ تبديلي چونڊيو ۽ متوقع جواب ڏسو.","choose":"تبديلي چونڊيو","none":"توازن قائم آهي (ڪا تبديلي ناهي)","addN2":"نائٽروجن وڌايو","removeNH3":"امونيا ڪڍو","compress":"دٻاءُ وڌايو (حجم گهٽايو)","heat":"گرمي پد وڌايو","cool":"گرمي پد گهٽايو","catalyst":"ڪيٽالسٽ شامل ڪريو","reactants":"عامل مادا","products":"پيداوارون","forward":"اڳتي وارو عمل","reverse":"پوئتي وارو عمل","shift":"متوقع تبديلي","right":"امونيا ڏانهن (ساڄي)","left":"نائٽروجن ۽ هائيڊروجن ڏانهن (کاٻي)","noneShift":"توازن جي جاءِ ۾ تبديلي ناهي","response":"نظام جو جواب","balanced":"توازن تي اڳتي ۽ پوئتي عمل جون رفتارون برابر آهن","forwardFavoured":"اڳتي واري عمل کي ترجيح ملي ٿي","reverseFavoured":"پوئتي، گرمي جذب ڪندڙ رخ کي ترجيح ملي ٿي","rebalances":"ٻئي رفتارون بدلجن ٿيون؛ گهٽ گئسي مول واري پاسي کي ترجيح ملي ٿي","bothUp":"ٻئي رفتارون وڌن ٿيون؛ ڪيٽالسٽ آخري توازن نٿو بدلائي","k":"توازن جو مستقل K","same":"ساڳئي گرمي پد تي تبديل نٿو ٿئي","down":"گرمي خارج ڪندڙ اڳتي واري عمل ۾ گرم ڪرڻ سان گهٽجي ٿو","up":"گرمي خارج ڪندڙ اڳتي واري عمل ۾ ٿڌو ڪرڻ سان وڌي ٿو","reset":"ماڊل ٻيهر سيٽ ڪريو","assumptions":"N₂ + 3H₂ ⇌ 2NH₃ + گرمي جو تصوري ماڊل. اڳتي وارو عمل گرمي خارج ڪري ٿو ۽ پيداوار واري پاسي گئسي مول گهٽ آهن. دٻاءَ جو جواب مستقل گرمي پد تي حجم گهٽائڻ لاءِ آهي. تير متوقع رخ ڏيکارين ٿا، ماپيل رفتار يا ارتڪاز نه. ڪيٽالسٽ رفتار بدلائي ٿو، K يا آخري توازن واري ملاوٽ نه."}};
const equilibriumScenarios={"addN2":{"direction":"right","rate":"forwardFavoured","k":"same","why":{"en":"Adding a reactant makes the system consume some of it by forming more ammonia.","ur":"عامل مادہ بڑھانے سے نظام اس کا کچھ حصہ استعمال کر کے زیادہ امونیا بناتا ہے۔","sd":"عامل مادو وڌائڻ سان نظام ان جو ڪجهه حصو استعمال ڪري وڌيڪ امونيا ٺاهي ٿو."}},"removeNH3":{"direction":"right","rate":"forwardFavoured","k":"same","why":{"en":"Removing product encourages the forward reaction to replace some of the ammonia.","ur":"مصنوع ہٹانے سے آگے کا عمل کچھ امونیا دوبارہ بنانے کی سمت جاتا ہے۔","sd":"پيداوار ڪڍڻ سان اڳتي وارو عمل ڪجهه امونيا ٻيهر ٺاهڻ ڏانهن وڃي ٿو."}},"compress":{"direction":"right","rate":"rebalances","k":"same","why":{"en":"Compression favours the side with fewer gas moles: two NH₃ versus four reactant gas moles.","ur":"حجم کم کرنے سے کم گیسی مول والی طرف ترجیح ملتی ہے: دو NH₃ بمقابلہ چار عامل گیسی مول۔","sd":"حجم گهٽائڻ سان گهٽ گئسي مول واري پاسي کي ترجيح ملي ٿي: ٻه NH₃، عامل پاسي چار گئسي مول."}},"heat":{"direction":"left","rate":"reverseFavoured","k":"down","why":{"en":"Heat is a product of the exothermic forward reaction. Adding heat favours the endothermic reverse direction.","ur":"حرارت خارج کرنے والے آگے کے عمل میں حرارت مصنوع ہے۔ حرارت بڑھانے سے حرارت جذب کرنے والی الٹی سمت پسندیدہ ہوتی ہے۔","sd":"گرمي خارج ڪندڙ اڳتي واري عمل ۾ گرمي پيداوار آهي. گرمي وڌائڻ سان گرمي جذب ڪندڙ پوئتي رخ پسند ٿيندو."}},"cool":{"direction":"right","rate":"forwardFavoured","k":"up","why":{"en":"Removing heat favours the exothermic forward direction.","ur":"حرارت کم کرنے سے حرارت خارج کرنے والی آگے کی سمت پسندیدہ ہوتی ہے۔","sd":"گرمي گهٽائڻ سان گرمي خارج ڪندڙ اڳتي وارو رخ پسند ٿيندو."}},"catalyst":{"direction":"none","rate":"bothUp","k":"same","why":{"en":"A catalyst speeds both forward and reverse reactions. It helps equilibrium establish sooner but does not change its position.","ur":"عامل آگے اور الٹے دونوں عمل تیز کرتا ہے۔ توازن جلد قائم ہوتا ہے مگر اس کی جگہ نہیں بدلتی۔","sd":"ڪيٽالسٽ اڳتي ۽ پوئتي ٻئي عمل تيز ڪري ٿو. توازن جلد قائم ٿئي ٿو پر ان جي جاءِ نٿي بدلجي."}}};
export function mountChemicalEquilibriumModel(container,{language="en"}={}){
 if(!container||container.querySelector('[data-visualization="chemical-equilibrium"]'))return null;
 const lang=["en","ur","sd"].includes(language)?language:"en",t=equilibriumCopy[lang];
 const panel=makeNode("section","equilibrium-visualization");
 panel.dataset.visualization="chemical-equilibrium";panel.setAttribute("role","region");panel.dir=lang==="en"?"ltr":"rtl";
 const heading=makeNode("h4","equilibrium-heading",t.title);heading.id="equilibriumHeading";
 panel.setAttribute("aria-labelledby",heading.id);
 panel.append(heading,makeNode("p","equilibrium-intro",t.intro));
 const controls=makeNode("div","equilibrium-controls"),label=makeNode("label","",t.choose),select=makeNode("select","equilibrium-select");
 select.id="equilibriumChange";
 const choices=[["none",t.none],["addN2",t.addN2],["removeNH3",t.removeNH3],["compress",t.compress],["heat",t.heat],["cool",t.cool],["catalyst",t.catalyst]];
 choices.forEach(([value,text])=>{const option=makeNode("option","",text);option.value=value;select.append(option)});
 label.htmlFor=select.id;label.append(select);controls.append(label);panel.append(controls);
 const svg=makeSvg("svg",{viewBox:"0 0 360 178",class:"equilibrium-plot",role:"img","aria-labelledby":"equilibriumSvgTitle equilibriumSvgDesc"});
 const svgTitle=makeSvg("title",{id:"equilibriumSvgTitle"});svgTitle.textContent=t.title;
 const svgDesc=makeSvg("desc",{id:"equilibriumSvgDesc"});
 const leftBox=makeSvg("rect",{x:12,y:38,width:116,height:70,rx:12,fill:"#e8f1ff",stroke:"#3157d5","stroke-width":2});
 const rightBox=makeSvg("rect",{x:232,y:38,width:116,height:70,rx:12,fill:"#e8f7ef",stroke:"#15966b","stroke-width":2});
 const leftText=makeSvg("text",{x:70,y:68,"text-anchor":"middle",fill:"#17336d","font-size":13,"font-weight":800});
 const leftSub=makeSvg("text",{x:70,y:88,"text-anchor":"middle",fill:"#526078","font-size":10});
 const rightText=makeSvg("text",{x:290,y:68,"text-anchor":"middle",fill:"#126443","font-size":14,"font-weight":800});
 const rightSub=makeSvg("text",{x:290,y:88,"text-anchor":"middle",fill:"#526078","font-size":10});
 leftText.textContent="N₂ + 3H₂";leftSub.textContent=t.reactants;rightText.textContent="2NH₃";rightSub.textContent=t.products;
 const forward=makeSvg("line",{x1:137,y1:64,x2:220,y2:64,stroke:"#0757e8","stroke-width":5,"stroke-linecap":"round"});
 const forwardHead=makeSvg("path",{d:"M211 56 L224 64 L211 72 Z",fill:"#0757e8"});
 const reverse=makeSvg("line",{x1:220,y1:91,x2:137,y2:91,stroke:"#15966b","stroke-width":5,"stroke-linecap":"round"});
 const reverseHead=makeSvg("path",{d:"M146 83 L133 91 L146 99 Z",fill:"#15966b"});
 const fLabel=makeSvg("text",{x:178,y:48,"text-anchor":"middle",fill:"#0757e8","font-size":9,"font-weight":800});
 const rLabel=makeSvg("text",{x:178,y:116,"text-anchor":"middle",fill:"#15966b","font-size":9,"font-weight":800});
 fLabel.textContent=t.forward;rLabel.textContent=t.reverse;
 const equation=makeSvg("text",{x:180,y:151,"text-anchor":"middle",fill:"#253a65","font-size":12,"font-weight":800});
 equation.textContent="N₂ + 3H₂ ⇌ 2NH₃ + heat";
 svg.append(svgTitle,svgDesc,leftBox,rightBox,leftText,leftSub,rightText,rightSub,forward,forwardHead,reverse,reverseHead,fLabel,rLabel,equation);
 panel.append(svg);
 const stats=makeNode("div","equilibrium-readouts");stats.setAttribute("aria-live","polite");stats.setAttribute("aria-atomic","true");
 const makeStat=key=>{const card=makeNode("article","equilibrium-stat");card.append(makeNode("small","",t[key]));const value=makeNode("strong","","");card.append(value);stats.append(card);return value};
 const shift=makeStat("shift"),rate=makeStat("response"),k=makeStat("k");
 panel.append(stats);
 const why=makeNode("p","equilibrium-why","");why.setAttribute("role","status");why.setAttribute("aria-live","polite");
 const assumptions=makeNode("p","equilibrium-assumptions",t.assumptions);
 const reset=makeNode("button","equilibrium-reset",t.reset);reset.type="button";
 panel.append(why,assumptions,reset);
 const render=()=>{
  const selected=select.value,scenario=equilibriumScenarios[selected];
  shift.textContent=selected==="none"?t.noneShift:scenario.direction==="right"?t.right:scenario.direction==="left"?t.left:t.noneShift;
  rate.textContent=selected==="none"?t.balanced:t[scenario.rate];
  k.textContent=selected==="none"||scenario.k==="same"?t.same:t[scenario.k];
  why.textContent=selected==="none"?t.none:scenario.why[lang];
  const right=selected!=="none"&&scenario.direction==="right",left=selected!=="none"&&scenario.direction==="left";
  forward.setAttribute("stroke-width",right?"7":"5");reverse.setAttribute("stroke-width",left?"7":"5");
  forward.setAttribute("opacity",left?".48":"1");reverse.setAttribute("opacity",right?".48":"1");
  svgDesc.textContent=shift.textContent+". "+rate.textContent+". "+k.textContent+". "+why.textContent;
 };
 select.addEventListener("change",render);
 reset.addEventListener("click",()=>{select.value="none";render();select.focus()});
 render();container.append(panel);return panel;
}
