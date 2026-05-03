import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
  canvas { display: block; width: 100%; height: 100%; touch-action: none; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// RN → WebView bridge (both android/ios)
function onRNMessage(e) {
  try {
    const data = JSON.parse(e.data);
    if (data.type === 'ripple') addRipple(data.x * canvas.width, data.y * canvas.height);
  } catch(_) {}
}
window.addEventListener('message', onRNMessage);
document.addEventListener('message', onRNMessage);

// ── Triangle ──────────────────────────────────────────────────
class Triangle {
  constructor(x, y, size, glowing) {
    this.x = x; this.y = y; this.size = size; this.glowing = glowing;
    this.alpha = Math.random() * 0.5 + (glowing ? 0.55 : 0.06);
    this.pulseSpeed = Math.random() * 0.018 + 0.004;
    this.pulseOffset = Math.random() * Math.PI * 2;
    this.drift = { x: (Math.random()-0.5)*0.25, y: (Math.random()-0.5)*0.25 };
    this.hue = glowing ? (Math.random() > 0.5 ? 285 : 315) : 260;
    this.rotSpeed = (Math.random()-0.5)*0.004;
    this.rot = Math.random() * Math.PI;
  }
  draw(t) {
    const W = canvas.width, H = canvas.height;
    const pulse = Math.sin(t * this.pulseSpeed + this.pulseOffset);
    const a = this.alpha + pulse * (this.glowing ? 0.28 : 0.03);
    const s = this.size + pulse * (this.glowing ? 7 : 2);
    this.rot += this.rotSpeed;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    const h = s * Math.sqrt(3) / 2;
    ctx.beginPath();
    ctx.moveTo(0, -s*0.667); ctx.lineTo(s*0.5, h*0.333); ctx.lineTo(-s*0.5, h*0.333);
    ctx.closePath();
    if (this.glowing) {
      ctx.shadowColor = 'hsl('+this.hue+',100%,65%)';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = 'hsla('+this.hue+',100%,82%,'+Math.min(a,1)+')';
      ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0,-s*0.3); ctx.lineTo(s*0.25,h*0.14); ctx.lineTo(-s*0.25,h*0.14);
      ctx.closePath();
      ctx.strokeStyle = 'hsla('+this.hue+',100%,92%,'+Math.min(a*0.45,1)+')';
      ctx.lineWidth = 0.8; ctx.stroke();
    } else {
      ctx.strokeStyle = 'hsla('+this.hue+',55%,72%,'+Math.min(a,1)+')';
      ctx.lineWidth = 0.7; ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.restore();
    this.x += this.drift.x; this.y += this.drift.y;
    if (this.x < -60) this.x = W+60; if (this.x > W+60) this.x = -60;
    if (this.y < -60) this.y = H+60; if (this.y > H+60) this.y = -60;
  }
}

// ── Particle ──────────────────────────────────────────────────
class Particle {
  constructor() { this.reset(true); }
  reset(rand) {
    this.x = Math.random() * canvas.width;
    this.y = rand ? Math.random() * canvas.height : canvas.height + 4;
    this.r = Math.random() * 1.4 + 0.3;
    this.vx = (Math.random()-0.5)*0.35; this.vy = -Math.random()*0.55-0.1;
    this.alpha = Math.random()*0.55+0.1;
    this.hue = Math.random() > 0.5 ? 280 : 315;
    this.life = 1; this.decay = Math.random()*0.003+0.001;
  }
  draw() {
    this.x += this.vx; this.y += this.vy; this.life -= this.decay;
    if (this.life <= 0) this.reset(false);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.fillStyle = 'hsla('+this.hue+',100%,76%,'+(this.alpha*this.life)+')';
    ctx.fill();
  }
}

// ── Grid ──────────────────────────────────────────────────────
function drawGrid(t) {
  const W = canvas.width, H = canvas.height;
  const speed = (t * 0.00025) % 1;
  const vp = { x: W/2, y: H*0.70 };
  for (let r = 0; r <= 12; r++) {
    const prog = ((r/12)+speed)%1;
    const y = vp.y-(vp.y-H*0.32)*(1-prog);
    const xL = vp.x-W*0.88*(1-prog*0.84), xR = vp.x+W*0.88*(1-prog*0.84);
    ctx.strokeStyle='rgba(160,30,220,'+(0.04+prog*0.18)+')';
    ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(xL,y); ctx.lineTo(xR,y); ctx.stroke();
  }
  for (let c = 0; c <= 10; c++) {
    ctx.strokeStyle='rgba(160,30,220,0.09)'; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo((c/10)*W,H*0.32); ctx.lineTo(vp.x,vp.y); ctx.stroke();
  }
}

// ── Ripple ────────────────────────────────────────────────────
let ripples = [];
function addRipple(x, y) {
  ripples.push({ x, y, r:0, alpha:0.85, hue: Math.random()>0.5?280:315 });
  // burst triangles near touch
  for (let i = 0; i < 3; i++) {
    const tr = new Triangle(
      x+(Math.random()-0.5)*70, y+(Math.random()-0.5)*70,
      Math.random()*18+10, true
    );
    tr.alpha = 0.95;
    tr.drift = { x:(Math.random()-0.5)*1.8, y:(Math.random()-0.5)*1.8 };
    triangles.push(tr);
    setTimeout(() => { const idx=triangles.indexOf(tr); if(idx!==-1) triangles.splice(idx,1); }, 1600);
  }
}

// ── Init ──────────────────────────────────────────────────────
const triangles = [];
function initTriangles() {
  triangles.length = 0;
  const W=canvas.width, H=canvas.height;
  for (let i=0;i<24;i++) {
    const g=i<10;
    triangles.push(new Triangle(Math.random()*W,Math.random()*H,g?(Math.random()*28+16):(Math.random()*13+5),g));
  }
}
initTriangles();
window.addEventListener('resize', initTriangles);
const particles = Array.from({length:55}, ()=>new Particle());

let t = 0;
function render() {
  const W=canvas.width, H=canvas.height;
  t++;
  ctx.clearRect(0,0,W,H);
  const grad=ctx.createRadialGradient(W/2,H*0.52,0,W/2,H*0.52,H*0.68);
  grad.addColorStop(0,'rgba(70,0,130,0.16)'); grad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
  drawGrid(t);
  particles.forEach(p=>p.draw());
  triangles.forEach(tr=>tr.draw(t));
  ripples=ripples.filter(rp=>rp.alpha>0.01);
  ripples.forEach(rp=>{
    rp.r+=3.5; rp.alpha*=0.92;
    ctx.beginPath(); ctx.arc(rp.x,rp.y,rp.r,0,Math.PI*2);
    ctx.strokeStyle='hsla('+rp.hue+',100%,75%,'+rp.alpha+')';
    ctx.lineWidth=1.5;
    ctx.shadowColor='hsl('+rp.hue+',100%,65%)'; ctx.shadowBlur=10;
    ctx.stroke(); ctx.shadowBlur=0;
  });
  if (t%4===0) { const sl=(t*1.2)%H; ctx.fillStyle='rgba(200,80,255,0.018)'; ctx.fillRect(0,sl,W,2); }
  requestAnimationFrame(render);
}
render();
</script>
</body>
</html>
`;

export interface NeonBackgroundRef {
  sendRipple: (nx: number, ny: number) => void;
}

const NeonBackground = forwardRef<NeonBackgroundRef>((_, ref) => {
  const webviewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    sendRipple: (nx: number, ny: number) => {
      const msg = JSON.stringify({ type: "ripple", x: nx, y: ny });
      webviewRef.current?.postMessage(msg);
    },
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <WebView
        ref={webviewRef}
        source={{ html: HTML }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        androidLayerType="hardware"
        originWhitelist={["*"]}
        backgroundColor="transparent"
        javaScriptEnabled={true}
      />
    </View>
  );
});

export default NeonBackground;

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: "transparent" },
});