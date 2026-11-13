
// ZEEROZ AI STUDIO · procedural 3D teaching scene engine.
// Three.js is used locally in the browser; no video-generation API is called.
export async function createLesson3D(container){
 const THREE=await import("https://esm.sh/three@0.170.0");
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:"low-power"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 renderer.setSize(container.clientWidth||640,container.clientHeight||360);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setClearColor(0x101b3d,0);
 container.replaceChildren(renderer.domElement);
 renderer.domElement.style.cssText="width:100%;height:100%;display:block;touch-action:none";
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(38,(container.clientWidth||640)/(container.clientHeight||360),.1,100);
 camera.position.set(0,0,8);
 scene.add(new THREE.HemisphereLight(0xd7eaff,0x14203d,2.1));
 const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(4,6,7);scene.add(key);
 const rim=new THREE.PointLight(0x55aaff,20,20);rim.position.set(-4,1,3);scene.add(rim);
 const root=new THREE.Group(),particles=new THREE.Group();scene.add(root,particles);
 const mat=(c,r=.4,m=.05,t=false,o=1)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,transparent:t,opacity:o});
 const sphere=(p,r,m,pos=[0,0,0],scale=[1,1,1])=>{const x=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),m);x.position.set(...pos);x.scale.set(...scale);p.add(x);return x};
 const rod=(p,a,b,r,m)=>{const v1=new THREE.Vector3(...a),v2=new THREE.Vector3(...b),d=new THREE.Vector3().subVectors(v2,v1);const x=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),12),m);x.position.copy(v1).add(v2).multiplyScalar(.5);x.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());p.add(x);return x};
 const ring=(p,r,t,m,pos=[0,0,0])=>{const x=new THREE.Mesh(new THREE.TorusGeometry(r,t,10,56),m);x.position.set(...pos);p.add(x);return x};
 const tube=(p,points,r,m)=>{const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));const x=new THREE.Mesh(new THREE.TubeGeometry(curve,80,r,8,false),m);p.add(x);return x};
 function cell(){const g=new THREE.Group();sphere(g,2.25,mat(0x54b9d0,.25,.1,true,.2),[0,0,0],[1.15,.88,.72]);const membrane=ring(g,2.05,.07,mat(0x72e6f2,.22,.2));membrane.scale.set(1.15,.88,.72);sphere(g,.83,mat(0x8567d9,.25),[-.3,.1,.1],[1.05,1,.9]);sphere(g,.29,mat(0xd6bdff),[-.18,.18,.86]);for(let i=0;i<5;i++){const a=i*1.25;const m=sphere(g,.28,mat(0xe98a65),[Math.cos(a)*1.45,Math.sin(a)*.82,Math.sin(a*2)*.3],[1.6,.65,.7]);ring(g,.23,.035,mat(0xffc18a),m.position.toArray())}const golgi=new THREE.Group();golgi.position.set(1.05,.2,.35);g.add(golgi);for(let i=0;i<5;i++){const x=ring(golgi,.42+i*.06,.05,mat(0xf4c66d));x.rotation.x=1.1;x.position.y=(i-2)*.14}for(let i=0;i<18;i++)sphere(g,.045,mat(0x8ce1b7),[(Math.random()-.5)*3.5,(Math.random()-.5)*2.1,(Math.random()-.5)*1.4]);return g}
 function chloroplast(){const g=new THREE.Group();sphere(g,1.5,mat(0x2d9d70,.3,.06),[0,0,0],[1.35,.78,.55]);const outer=ring(g,1.42,.055,mat(0x9aefb7));outer.scale.set(1.35,.78,.55);for(let x=-.85;x<=.85;x+=.42){const stack=new THREE.Group();stack.position.set(x,0,.18);g.add(stack);for(let k=0;k<5;k++){const d=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.08,20),mat(k%2?0x4bd18d:0xb1ee78));d.rotation.x=Math.PI/2;d.position.y=(k-2)*.14;stack.add(d)}}return g}
 function mitochondrion(){const g=new THREE.Group();sphere(g,1.5,mat(0xe27a54,.3),[0,0,0],[1.45,.72,.58]);ring(g,1.15,.1,mat(0xffc18d),[0,0,.1]).scale.set(1.3,.6,.65);for(let i=0;i<7;i++){const f=ring(g,.35,.055,mat(0xffd4a3),[-.8+i*.26,Math.sin(i)*.2,.28]);f.rotation.y=.8}return g}
 function dna(){const g=new THREE.Group();const a=[],b=[];for(let i=0;i<70;i++){const t=i/69*Math.PI*8,y=(i/69-.5)*3.6;a.push([Math.cos(t)*.62,y,Math.sin(t)*.62]);b.push([-Math.cos(t)*.62,y,-Math.sin(t)*.62]);if(i%5===0)rod(g,a[i],b[i],.025,mat(0xe5edf7))}tube(g,a,.055,mat(0x51c9f1));tube(g,b,.055,mat(0xf0a56b));return g}
 function atom(){const g=new THREE.Group();for(let i=0;i<11;i++)sphere(g,.17,mat(i%2?0xe87968:0x72bde8),[(Math.random()-.5)*.62,(Math.random()-.5)*.62,(Math.random()-.5)*.62]);const electrons=[];for(let i=0;i<3;i++){const r=1.35+i*.48,orb=ring(g,r,.018,mat(0x84cfff,.25,.3));orb.rotation.set(i*.8,i*1.05,i*.45);const e=sphere(g,.105,mat(0xffd66e,.2,.2));electrons.push({e,r,angle:i*1.8,tilt:orb.rotation.clone()})}g.userData.electrons=electrons;return g}
 function molecule(){const g=new THREE.Group();sphere(g,.58,mat(0xef594f),[0,0,0]);sphere(g,.32,mat(0xe8edf6),[-.85,.45,0]);sphere(g,.32,mat(0xe8edf6),[.85,.45,0]);rod(g,[0,0,0],[-.72,.38,0],.09,mat(0xb9c8d9));rod(g,[0,0,0],[.72,.38,0],.09,mat(0xb9c8d9));return g}
 function wave(){const g=new THREE.Group();const axis=rod(g,[-2.8,0,0],[2.8,0,0],.018,mat(0x9fb5d6));const pts=[];for(let i=0;i<100;i++){const x=-2.7+i*5.4/99;pts.push([x,Math.sin(i/99*Math.PI*6)*.72,0])}const waveGeometry=new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p)));g.add(new THREE.Line(waveGeometry,new THREE.LineBasicMaterial({color:0x55d5f4})));g.userData.waveGeometry=waveGeometry;for(let x=-2.4;x<=2.4;x+=.8)sphere(g,.07,mat(0xffd36b),[x,0,0]);return g}
 function force(){const g=new THREE.Group();const ball=sphere(g,.36,mat(0x57b8ef,.2,.2),[-1.5,0,0]);ball.userData.movingBall=true;rod(g,[-1.5,.55,0],[1.5,.55,0],.045,mat(0xffd36b));const head=new THREE.Mesh(new THREE.ConeGeometry(.16,.38,18),mat(0xffd36b));head.position.set(1.5,.55,0);head.rotation.z=-Math.PI/2;g.add(head);rod(g,[-1.5,-.55,0],[.8,-.55,0],.035,mat(0x62d6a4));const vhead=new THREE.Mesh(new THREE.ConeGeometry(.13,.32,18),mat(0x62d6a4));vhead.position.set(.8,-.55,0);vhead.rotation.z=-Math.PI/2;g.add(vhead);g.userData.forceBall=ball;return g}
 function concept(){const g=new THREE.Group();sphere(g,.55,mat(0x5c8ee8,.25,.2));const colors=[0x58d5d0,0xf0b65c,0x9a82e8,0xe77c7c];for(let i=0;i<4;i++){const a=i*Math.PI/2,r=1.75,pos=[Math.cos(a)*r,Math.sin(a)*r,0];rod(g,[0,0,0],pos,.035,mat(0xa8c8ed));sphere(g,.27,mat(colors[i],.25,.15),pos);ring(g,.39,.025,mat(colors[i]),pos)}ring(g,2.35,.025,mat(0x527dbb));return g}
 function circuit(){const g=new THREE.Group();const board=new THREE.Mesh(new THREE.BoxGeometry(4.7,.16,2.5),mat(0x176b55,.55));board.position.z=-.25;g.add(board);const points=[[-1.8,.2,.1],[1.8,.2,.1],[1.8,.2,1.4],[-1.8,.2,1.4],[-1.8,.2,.1]];tube(g,points,.045,mat(0xd6b65e,.3,.6));const battery=new THREE.Mesh(new THREE.BoxGeometry(.45,.55,.4),mat(0x528bd6));battery.position.set(-1.7,.5,.1);g.add(battery);const resistor=new THREE.Mesh(new THREE.BoxGeometry(.8,.22,.25),mat(0xd88d50));resistor.position.set(0,.38,.1);g.add(resistor);const bulb=sphere(g,.22,mat(0xffe27a,.15,.1,true,.85),[1.7,.52,.1]);g.userData.bulb=bulb;return g}
 function geometry(){const g=new THREE.Group();const cube=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.8,1.8),mat(0x4c9be8,.28,.15,.12,.72));g.add(cube);const edges=new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry),new THREE.LineBasicMaterial({color:0xbfe6ff}));g.add(edges);const ball=sphere(g,.5,mat(0xffbd6b),[1.35,1.15,.15]);ball.userData.orbit=true;return g}
 const builders={cell,chloroplast,mitochondrion,dna,atom,molecule,wave,circuit,geometry,force,concept};
 const typeFor=s=>{const t=(String(s?.title||"")+" "+String(s?.narration||"")).toLowerCase();if(/photosynth|chloroplast|thylakoid|calvin|leaf|ضیائی|ڪلوروپلاسٽ/.test(t))return"chloroplast";if(/mitochond|respirat|atp|cellular energy|تنفس|مائٽوڪانڊريا/.test(t))return"mitochondrion";if(/dna|replicat|gene|chromosome|ڈی این اے|ڊي اين اي/.test(t))return"dna";if(/atom|electron|proton|neutron|atomic|ایٹم|ايٽم/.test(t))return"atom";if(/molecule|h2o|water molecule|co2|chemical bond|مالیکیول|ماليڪيول/.test(t))return"molecule";if(/circuit|current|voltage|resistor|electricity|electric current|سرکٹ|برقی رو/.test(t))return"circuit";if(/force|motion|velocity|acceleration|newton|قوت|حرکت/.test(t))return"force";if(/wave|frequency|wavelength|sound|vibration|موج|آواز/.test(t))return"wave";if(/geometry|triangle|circle|cube|sphere|area|volume|زاویہ|مثلث|دائرو/.test(t))return"geometry";if(/cell|biology|cytoplasm|nucleus|membrane|خلیہ|خلیات|سيل|خليو/.test(t))return"cell";return"concept"};
 let active="cell",model=builders.cell(),frame=0,raf=0,disposed=false,drag=false,lastX=0,lastY=0,rotX=0,rotY=0,zoom=1,sceneProgress=0;
 root.add(model);
 const orbiters=[];for(let i=0;i<22;i++){const p=sphere(particles,.028,mat(i%2?0x77dfff:0xffd36f));orbiters.push({mesh:p,phase:i/22*Math.PI*2,r:2.5+(i%4)*.22})}
 const down=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId)},move=e=>{if(drag){rotY+=(e.clientX-lastX)*.008;rotX+=(e.clientY-lastY)*.008;lastX=e.clientX;lastY=e.clientY}},up=()=>drag=false;
 renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointermove",move);renderer.domElement.addEventListener("pointerup",up);renderer.domElement.addEventListener("pointercancel",up);
 renderer.domElement.addEventListener("wheel",e=>{zoom=Math.max(.72,Math.min(1.45,zoom+e.deltaY*.001));e.preventDefault()},{passive:false});
 const resize=()=>{const w=container.clientWidth||640,h=container.clientHeight||360;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};
 const observer=new ResizeObserver(resize);observer.observe(container);
 const disposeTree=o=>{o.traverse(x=>{x.geometry?.dispose?.();if(Array.isArray(x.material))x.material.forEach(m=>m.dispose?.());else x.material?.dispose?.()})};
 const animate=()=>{if(disposed)return;raf=requestAnimationFrame(animate);frame+=.012;
  model.rotation.y=rotY+frame*.17;model.rotation.x=rotX+Math.sin(frame*.5)*.05;
  model.scale.setScalar(zoom*(1+Math.sin(frame*1.5)*.012));
  model.traverse(o=>{if(o.userData.electrons)o.userData.electrons.forEach((q,i)=>{const a=frame*(1.1+i*.25)+q.angle;q.e.position.set(Math.cos(a)*q.r,Math.sin(a)*q.r*.55,Math.sin(a)*q.r*.45)});if(o.userData.waveGeometry){const attr=o.userData.waveGeometry.attributes.position;for(let i=0;i<attr.count;i++){const x=-2.7+i*5.4/(attr.count-1);attr.setY(i,Math.sin(i/(attr.count-1)*Math.PI*6-frame*2.2)*.72)}attr.needsUpdate=true;o.userData.waveGeometry.computeBoundingSphere()}if(o.userData.bulb){o.userData.bulb.material.emissive?.setHex(Math.sin(frame*3)>-.2?0x665000:0x221900)}if(o.userData.forceBall)o.userData.forceBall.position.x=-1.5+((Math.sin(frame*1.3)+1)*1.45)});
  orbiters.forEach(p=>{const a=p.phase+frame*.6;p.mesh.position.set(Math.cos(a)*p.r,Math.sin(a*1.4)*1.25,Math.sin(a)*p.r*.42)});
  const targetX=Math.sin(frame*.23+sceneProgress*2)*.32,targetY=Math.cos(frame*.19+sceneProgress*2)*.18;
  camera.position.x+=(targetX-camera.position.x)*.018;camera.position.y+=(targetY-camera.position.y)*.018;
  camera.position.z+=(Math.max(4.8,7.2/zoom)-camera.position.z)*.025;camera.lookAt(0,0,0);
  renderer.render(scene,camera);
 };animate();
 return {
  setScene(s={}){const next=typeFor(s);if(next!==active){disposeTree(model);root.clear();active=next;model=builders[next]();root.add(model);rotX=rotY=sceneProgress=0;zoom=1}return active},
  setProgress(p){sceneProgress=Math.max(0,Math.min(1,Number(p)||0));rotY=sceneProgress*Math.PI*.7;zoom=1+.12*Math.sin(sceneProgress*Math.PI)},
  reset(){rotX=rotY=sceneProgress=0;zoom=1},
  getCanvas(){return renderer.domElement},
  dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();renderer.dispose();disposeTree(root);disposeTree(particles);container.replaceChildren()}
 };
}
