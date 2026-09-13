import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const CODE_LINES = [
  'def authenticate(token: str) -> bool:',
  'const hash = crypto.createHash("sha256");',
  'if (session.user.role !== "admin") return;',
  '0xDEADBEEF → 0xCAFEBABE',
  'SELECT * FROM passwords WHERE id = $1;',
  'openssl rand -hex 32',
  'async function secureKey(seed: Uint8Array) {',
  'JWT.verify(token, publicKey, { algorithms: ["RS256"] });',
  'chmod 600 ~/.ssh/id_rsa',
  'gpg --symmetric --cipher-algo AES256',
  'const entropy = crypto.randomBytes(32);',
  'return await bcrypt.hash(password, 14);',
  'ssh -i ~/.ssh/id_ed25519 user@host',
  'INSERT INTO vault (key, value) VALUES ($1, $2);',
  'const salt = await crypto.randomBytes(16);',
  'if (len(key) < 256 / 8) raise ValueError("weak key");',
  'hmac.new(secret, msg, digestmod="sha512").hexdigest()',
  'export default function Generator({ length }) {',
  'const token = jwt.sign({ sub: user.id }, priv, {',
  'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096',
  'for i in range(10): key = secrets.choice(charset)',
  'const iv = crypto.randomFillSync(new Uint8Array(12));',
  'passwordStrength: z.string().refine(s => s.length >= 16)',
  'kubectl create secret generic pg-pass --from-literal=password=$PASS',
  'curl -X POST https://api.vault.internal/v1/secrets',
  'const derived = HKDF.extract(HashAlg.SHA256, ikm, salt);',
  'const nonce = new Uint8Array(await crypto.getRandomValues(new Uint8Array(16)));',
  'return decrypt(cipher, AES_GCM, key, nonce, aad);',
  'await DHPair.generateC({ curve: Ed25519, entropy: rng });',
  'scrypt.hash(password, { N: 2**20, r: 8, p: 1, dkLen: 32 })',
];

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Black hole fragment shader — positioned on the LEFT side of the screen
const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = rot * p * 2.0; a *= 0.5; }
    return v;
  }

  void main() {
    // Shift UV so black hole is on the left
    vec2 uv = vUv - vec2(0.28, 0.5);
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);

    float horizon = 0.09;
    if (dist < horizon) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    float lens = 1.0 / (max(dist * 5.5, 0.05));
    float warpedAngle = angle + lens * 0.7 + uTime * 0.12;

    float diskNoise = fbm(vec2(warpedAngle * 3.0 - uTime * 0.15, (1.0 / dist) * 1.5));
    float diskGlow = exp(-abs(dist - 0.17) * 10.0) * (0.4 + diskNoise * 0.6);
    float ringGlow = exp(-abs(dist - horizon) * 42.0) * 1.5;

    vec3 orange = vec3(0.95, 0.35, 0.03);
    vec3 amber = vec3(1.0, 0.65, 0.08);
    vec3 gold = vec3(1.0, 0.88, 0.35);

    vec3 color = mix(orange, amber, diskNoise) * diskGlow;
    color += gold * ringGlow;

    float nebula = fbm(uv * 1.8 + uTime * 0.04);
    color += vec3(0.02, 0.05, 0.12) * nebula * 0.6;

    color *= smoothstep(0.58, 0.12, dist);

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface CodeLine {
  text: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  color: string;
  size: number;
  glow: number;
}

function createLine(): CodeLine {
  const colors = ['#ff8c42', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#8338ec', '#ff006e', '#3a86ff'];
  const sizes = [10, 11, 12, 13, 14, 15];
  return {
    text: CODE_LINES[Math.floor(Math.random() * CODE_LINES.length)],
    x: 0.6 + Math.random() * 0.4,     // starts on the right
    y: Math.random(),                   // random vertical position
    speed: 0.0004 + Math.random() * 0.0006,
    opacity: 0.2 + Math.random() * 0.7,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: sizes[Math.floor(Math.random() * sizes.length)],
    glow: 0.3 + Math.random() * 0.7,
  };
}

export default function SingularityBackground() {
  const bhCanvasRef = useRef<HTMLCanvasElement>(null);
  const codeCanvasRef = useRef<HTMLCanvasElement>(null);
  const linesRef = useRef<CodeLine[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const bhCanvas = bhCanvasRef.current;
    const codeCanvas = codeCanvasRef.current;
    if (!bhCanvas || !codeCanvas) return;

    // --- Black Hole Three.js Scene ---
    const scene = new THREE.Scene();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas: bhCanvas, antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020204);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.8, 0.6, 0.1);
    composer.addPass(bloomPass);

    const group = new THREE.Group();
    // Position: left side of screen, zoomed out (scale 3.0)
    group.position.set(-1.4, 0, 0);
    group.scale.set(3.0, 3.0, 3.0);
    scene.add(group);

    const bhGeo = new THREE.PlaneGeometry(12, 12);
    const bhMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: false,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(bhGeo, bhMat));

    // --- Code Lines Canvas ---
    const ctx = codeCanvas.getContext('2d');
    // CSS-pixel dimensions — the drawing code positions things in CSS pixels
    // while the canvas backing store is sized in physical pixels (dpr-scaled)
    // to avoid bilinear upscaling on high-DPI displays.
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    if (ctx) {
      codeCanvas.width = Math.floor(cssW * dpr);
      codeCanvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    linesRef.current = Array.from({ length: 35 }, createLine);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      const w = cssW;
      const h = cssH;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
      if (ctx) {
        codeCanvas.width = Math.floor(w * dpr);
        codeCanvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    window.addEventListener('resize', onResize);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      bhMat.uniforms.uTime.value = elapsed;
      bloomPass.strength = 1.6 + Math.sin(elapsed * 0.7) * 0.3;

      // Mouse parallax
      const mx = mouseRef.current.x * 0.12;
      const my = mouseRef.current.y * 0.08;
      group.position.x = -1.4 + mx;
      group.position.y = my;

      // --- Draw code lines on overlay canvas ---
      if (ctx) {
        ctx.clearRect(0, 0, cssW, cssH);

        const bhScreenX = cssW * 0.28;
        const bhScreenY = cssH * 0.5;

        linesRef.current.forEach((line) => {
          // Move from right toward the black hole on the left
          line.x -= line.speed;

          if (line.x < 0.22) {
            Object.assign(line, createLine());
            line.x = 0.6 + Math.random() * 0.4;
          }

          const sx = line.x * cssW;
          const sy = line.y * cssH;

          const distToBH = Math.hypot(sx - bhScreenX, sy - bhScreenY);
          const bhRadiusPx = cssH * 0.27;

          // Fade in from right, fade out near the black hole
          const entryFade = Math.min((line.x - 0.4) / 0.2, 1.0);
          const pullFade = Math.max(0, 1 - (distToBH - bhRadiusPx * 0.4) / (bhRadiusPx * 1.5));
          const alpha = line.opacity * entryFade * Math.min(pullFade, 1);

          if (alpha <= 0) return;

          ctx.save();
          ctx.font = `${line.size}px "Space Mono", "Courier New", monospace`;

          // Sheen/stretch as it gets pulled toward the hole
          const stretchX = 1.0 + Math.max(0, (0.3 - line.x)) * 0.8;
          ctx.translate(sx, sy);
          ctx.scale(stretchX, 1.0);

          ctx.fillStyle = line.color;
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.shadowColor = line.color;
          ctx.shadowBlur = line.glow * 12;
          ctx.fillText(line.text, 0, 0);

          ctx.restore();
        });

        ctx.globalAlpha = 1;
      }

      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      bhGeo.dispose();
      bhMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      {/* Three.js black hole canvas */}
      <canvas
        ref={bhCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          display: 'block',
          pointerEvents: 'none',
        }}
      />
      {/* 2D code lines canvas */}
      <canvas
        ref={codeCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
