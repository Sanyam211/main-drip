/* DRIP — 3D chrome can scene (home page). Requires three.js r128 and #scene canvas. */
(function(){
  'use strict';
  const canvas = document.getElementById('scene');
  if(!canvas || typeof THREE === 'undefined') return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth/window.innerHeight, .1, 100);
  camera.position.set(0, 0, 8);

  /* ---- procedural studio environment for chrome reflections ---- */
  function makeEnvTexture(){
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0,0,0,512);
    grad.addColorStop(0,'#101820');
    grad.addColorStop(.45,'#04070a');
    grad.addColorStop(1,'#020405');
    g.fillStyle = grad; g.fillRect(0,0,1024,512);
    // bright vertical light bars -> crisp chrome streaks
    const bars = [
      {x:90,w:60,c:'rgba(234,244,247,.95)'},
      {x:300,w:24,c:'rgba(125,243,255,.85)'},
      {x:470,w:90,c:'rgba(234,244,247,.7)'},
      {x:700,w:30,c:'rgba(125,243,255,.7)'},
      {x:870,w:70,c:'rgba(234,244,247,.85)'}
    ];
    bars.forEach(b=>{
      const bg = g.createLinearGradient(b.x,0,b.x+b.w,0);
      bg.addColorStop(0,'transparent'); bg.addColorStop(.5,b.c); bg.addColorStop(1,'transparent');
      g.fillStyle = bg; g.fillRect(b.x,40,b.w,360);
    });
    // soft floor glow
    const fg = g.createLinearGradient(0,420,0,512);
    fg.addColorStop(0,'rgba(125,243,255,.25)'); fg.addColorStop(1,'transparent');
    g.fillStyle = fg; g.fillRect(0,420,1024,92);
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }
  const env = makeEnvTexture();

  /* ---- can label texture ---- */
  function makeLabelTexture(){
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 1024;
    const g = c.getContext('2d');
    g.fillStyle = '#0a1014'; g.fillRect(0,0,1024,1024);
    // top + bottom accent bands
    g.fillStyle = '#7df3ff';
    g.fillRect(0,40,1024,8); g.fillRect(0,976,1024,8);
    // giant wordmark
    g.fillStyle = '#eaf4f7';
    g.font = '900 320px Unbounded, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('DRIP', 512, 430);
    // ticker
    g.fillStyle = '#7df3ff';
    g.font = '700 56px "Space Mono", monospace';
    g.fillText('$DRIP · LIQUID ASSET', 512, 640);
    // spec line
    g.fillStyle = '#54656d';
    g.font = '400 34px "Space Mono", monospace';
    g.fillText('355 ML · 0G SUGAR · 480MG ELECTROLYTES', 512, 720);
    // barcode
    let x = 312;
    g.fillStyle = '#eaf4f7';
    while(x < 712){
      const w = 3 + Math.random()*9;
      if(Math.random() > .42) g.fillRect(x, 800, w, 90);
      x += w + 4;
    }
    g.fillStyle = '#54656d';
    g.font = '400 26px "Space Mono", monospace';
    g.fillText('SERIAL #0001 — GENESIS', 512, 940);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    return tex;
  }

  /* ---- build the can ---- */
  const can = new THREE.Group();
  const chrome = new THREE.MeshStandardMaterial({
    metalness:1, roughness:.12, envMap:env, envMapIntensity:1.6, color:0xdfe9ee
  });
  const labelMat = new THREE.MeshStandardMaterial({
    metalness:.85, roughness:.28, envMap:env, envMapIntensity:1.1, map:null
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(1,1,2.6,72,1,true), labelMat);
  can.add(body);

  const topTaper = new THREE.Mesh(new THREE.CylinderGeometry(.82,1,.3,72), chrome);
  topTaper.position.y = 1.45; can.add(topTaper);

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.05,72), chrome);
  lid.position.y = 1.62; can.add(lid);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(.8,.045,16,72), chrome);
  rim.rotation.x = Math.PI/2; rim.position.y = 1.62; can.add(rim);

  const tab = new THREE.Mesh(new THREE.TorusGeometry(.16,.035,12,40), chrome);
  tab.rotation.x = Math.PI/2; tab.position.set(0,1.655,.25); can.add(tab);

  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(1,.84,.26,72), chrome);
  bottom.position.y = -1.43; can.add(bottom);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.84,.84,.04,72), chrome);
  base.position.y = -1.57; can.add(base);

  can.rotation.z = .06;
  scene.add(can);

  /* lights */
  scene.add(new THREE.AmbientLight(0x223038, 1.4));
  const key = new THREE.DirectionalLight(0xeaf4f7, 1.1); key.position.set(4,5,6); scene.add(key);
  const fill = new THREE.DirectionalLight(0x7df3ff, .8); fill.position.set(-5,-2,3); scene.add(fill);

  /* label after font loads so the wordmark uses Unbounded */
  function applyLabel(){
    labelMat.map = makeLabelTexture();
    labelMat.needsUpdate = true;
  }
  applyLabel(); // immediate fallback, replaced once fonts land
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(()=> setTimeout(applyLabel, 60));
  }

  /* ---- scroll choreography: waypoints over page progress ---- */
  const way = [
    {p:0.00, x:0.0,  y:-.1, s:1.05, rz:.06},
    {p:0.22, x:2.1,  y:0,   s:.85,  rz:-.18},
    {p:0.46, x:-2.1, y:0,   s:.85,  rz:.18},
    {p:0.72, x:0.0,  y:.9,  s:.6,   rz:0},
    {p:1.00, x:0.0,  y:-.05,s:1.15, rz:-.06}
  ];
  function lerp(a,b,t){return a+(b-a)*t}
  function sampleWay(p){
    for(let i=0;i<way.length-1;i++){
      const a=way[i], b=way[i+1];
      if(p>=a.p && p<=b.p){
        const t=(p-a.p)/(b.p-a.p);
        const e = t*t*(3-2*t); // smoothstep
        return {x:lerp(a.x,b.x,e), y:lerp(a.y,b.y,e), s:lerp(a.s,b.s,e), rz:lerp(a.rz,b.rz,e)};
      }
    }
    return way[way.length-1];
  }

  let scrollP = 0, mouseX = 0, mouseY = 0;
  let spinBoost = 0;
  // exposed so forms elsewhere on the page can kick the can
  window.dripSpin = v => { spinBoost = v; };

  function onScroll(){
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollP = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  window.addEventListener('pointermove', e=>{
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, {passive:true});

  // click anywhere (not on interactive elements) -> spin impulse
  window.addEventListener('click', e=>{
    if(e.target.closest('a,button,input,select,label,.card,details')) return;
    spinBoost = .25;
  });

  const isNarrow = ()=> window.innerWidth < 860;

  window.addEventListener('resize', ()=>{
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
  });

  const clock = new THREE.Clock();
  let curX=0, curY=0, curS=1, curRZ=0, curTiltX=0, curTiltZ=0;

  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const w = sampleWay(scrollP);
    const narrow = isNarrow();
    const tx = narrow ? 0 : w.x;
    const ts = narrow ? w.s * .72 : w.s;

    // smooth follow
    curX += (tx - curX) * .06;
    curY += (w.y - curY) * .06;
    curS += (ts - curS) * .06;
    curRZ += (w.rz - curRZ) * .06;

    can.position.x = curX;
    can.position.y = curY + (reduced ? 0 : Math.sin(t*1.2)*.09);
    can.scale.setScalar(curS);

    // base spin + scroll-linked rotation + click impulse
    spinBoost *= .96;
    const baseSpin = reduced ? 0 : .0035;
    can.rotation.y += baseSpin + spinBoost;
    const scrollRot = scrollP * Math.PI * 3;
    can.rotation.y += (scrollRot - (can.userData.lastScrollRot||0));
    can.userData.lastScrollRot = scrollRot;

    // pointer tilt
    const tiltTargetX = reduced ? 0 : mouseY * .28;
    const tiltTargetZ = curRZ + (reduced ? 0 : mouseX * .12);
    curTiltX += (tiltTargetX - curTiltX) * .05;
    curTiltZ += (tiltTargetZ - curTiltZ) * .05;
    can.rotation.x = curTiltX;
    can.rotation.z = curTiltZ;

    renderer.render(scene, camera);
  }
  animate();
})();
