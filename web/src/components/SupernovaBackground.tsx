import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

interface Props {
  generateTrigger?: number;
}

const PARTICLE_COUNT = 1000;
const STARFIELD_COUNT = 1400;
const CORE_X = 0;
const CORE_Y = 1.1;

// === Shared point shader (used for both starfield and explosion particles) ===
const pointVertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const pointFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.5, 0.15, d);
    float intensity = pow(core, 1.6) * 1.4 + glow * 0.5;
    gl_FragColor = vec4(vColor * intensity, vAlpha * core);
  }
`;

// === Core star shader (solar flare palette) ===
const coreFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float glow = exp(-d * 7.0) * 0.9;
    float pulse = sin(uTime * 1.6) * 0.06 + 1.0;
    float intensity = (core * 1.5 + glow) * uIntensity * pulse;
    // Solar Flare: #FF4500 (baseline) -> #FFAA00 (mid) -> #FFE680 (peak)
    vec3 hot = vec3(1.0, 0.9, 0.5);
    vec3 warm = vec3(1.0, 0.27, 0.0);
    vec3 col = mix(warm, hot, smoothstep(0.4, 2.0, uIntensity));
    gl_FragColor = vec4(col * intensity, 1.0);
  }
`;

// === Halo (nebula glow palette) ===
const haloFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float glow = exp(-d * 4.0) * 0.6;
    // Nebula Glow: #008080 -> #2D8C8C
    vec3 deep = vec3(0.0, 0.5, 0.5);
    vec3 glowCol = vec3(0.18, 0.55, 0.55);
    vec3 col = mix(deep, glowCol, clamp(uIntensity / 2.0, 0.0, 1.0));
    gl_FragColor = vec4(col * glow * uIntensity, glow * 0.7);
  }
`;

// === Nebula background (teal deep-space atmosphere) ===
const nebulaFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv - vec2(0.5);
    float dist = length(uv);

    // Primary nebula glow (teal)
    float nebulaNoise = fbm(uv * 2.5 + vec2(uTime * 0.02, -uTime * 0.01));
    float nebulaGlow = exp(-dist * 0.8) * (0.08 + nebulaNoise * 0.18);

    // Secondary solar-flare accent (very faint, for depth)
    float accentNoise = fbm(uv * 4.0 - vec2(uTime * 0.015, uTime * 0.008));
    float accentGlow = exp(-dist * 1.2) * accentNoise * 0.04;

    vec3 nebulaColor = vec3(0.0, 0.5, 0.5);   // #008080
    vec3 accentColor = vec3(1.0, 0.27, 0.0);  // #FF4500

    vec3 finalColor = nebulaColor * nebulaGlow + accentColor * accentGlow;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const planeVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export default function SupernovaBackground({ generateTrigger = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    explodeAt: number;
    coreIntensity: number;
    targetIntensity: number;
  }>({
    explodeAt: 0,
    coreIntensity: 0.4,
    targetIntensity: 0.4,
  });

  useEffect(() => {
    if (generateTrigger > 0) {
      const s = stateRef.current;
      s.explodeAt = performance.now();
      s.targetIntensity = 2.5;
    }
  }, [generateTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050508);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.5,  // strength (calmer)
      0.6,  // radius
      0.2   // threshold (only bright parts bloom)
    );
    composer.addPass(bloom);

    // === Nebula Background (teal deep-space atmosphere) ===
    const nebulaGeo = new THREE.PlaneGeometry(40, 40);
    const nebulaMat = new THREE.ShaderMaterial({
      vertexShader: planeVertexShader,
      fragmentShader: nebulaFragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebula.position.set(0, 0, -10);
    scene.add(nebula);

    // === Starfield ===
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STARFIELD_COUNT * 3);
    const starSize = new Float32Array(STARFIELD_COUNT);
    const starAlpha = new Float32Array(STARFIELD_COUNT);
    const starColor = new Float32Array(STARFIELD_COUNT * 3);
    for (let i = 0; i < STARFIELD_COUNT; i++) {
      const r = 15 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
      starSize[i] = Math.random() * 0.06 + 0.015;
      starAlpha[i] = Math.random() * 0.35 + 0.1;
      const tint = Math.random();
      if (tint < 0.7) {
        // White stars
        starColor[i * 3] = 1.0;
        starColor[i * 3 + 1] = 1.0;
        starColor[i * 3 + 2] = 1.0;
      } else if (tint < 0.9) {
        // Teal nebula-tinted stars: #2D8C8C
        starColor[i * 3] = 0.18;
        starColor[i * 3 + 1] = 0.55;
        starColor[i * 3 + 2] = 0.55;
      } else {
        // Amber stars: #FFAA00
        starColor[i * 3] = 1.0;
        starColor[i * 3 + 1] = 0.67;
        starColor[i * 3 + 2] = 0.0;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
    starGeo.setAttribute('aAlpha', new THREE.BufferAttribute(starAlpha, 1));
    starGeo.setAttribute('aColor', new THREE.BufferAttribute(starColor, 3));
    const starMat = new THREE.ShaderMaterial({
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {},
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // === Core Star ===
    const coreGeo = new THREE.PlaneGeometry(1.0, 1.0);
    const coreMat = new THREE.ShaderMaterial({
      vertexShader: planeVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.7 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(CORE_X, CORE_Y, 0);
    scene.add(core);

    // === Core Halo ===
    const haloGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: planeVertexShader,
      fragmentShader: haloFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.7 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(CORE_X, CORE_Y, -0.1);
    scene.add(halo);

    // === Particles (clustered around core, ready to explode) ===
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(PARTICLE_COUNT * 3);
    const partSize = new Float32Array(PARTICLE_COUNT);
    const partAlpha = new Float32Array(PARTICLE_COUNT);
    const partColor = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const lives = new Float32Array(PARTICLE_COUNT);
    const basePos = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = Math.random() * 0.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = CORE_X + r * Math.sin(phi) * Math.cos(theta);
      const y = CORE_Y + r * Math.cos(phi) * 0.5;
      const z = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      partPos[i * 3] = x;
      partPos[i * 3 + 1] = y;
      partPos[i * 3 + 2] = z;
      basePos[i * 3] = x;
      basePos[i * 3 + 1] = y;
      basePos[i * 3 + 2] = z;
      partSize[i] = 0.03;
      partAlpha[i] = 0.0;
      const tint = Math.random();
      if (tint < 0.55) {
        // Solar Flare: #FF4500 -> #FFAA00
        partColor[i * 3] = 1.0;
        partColor[i * 3 + 1] = 0.27 + Math.random() * 0.4;
        partColor[i * 3 + 2] = 0.0;
      } else if (tint < 0.85) {
        // Nebula Glow: #008080 -> #2D8C8C
        partColor[i * 3] = Math.random() * 0.18;
        partColor[i * 3 + 1] = 0.5 + Math.random() * 0.1;
        partColor[i * 3 + 2] = 0.5 + Math.random() * 0.1;
      } else {
        // White-hot sparks: #FFE680
        partColor[i * 3] = 1.0;
        partColor[i * 3 + 1] = 0.9;
        partColor[i * 3 + 2] = 0.5;
      }
      lives[i] = 0;
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
    }

    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    partGeo.setAttribute('aSize', new THREE.BufferAttribute(partSize, 1));
    partGeo.setAttribute('aAlpha', new THREE.BufferAttribute(partAlpha, 1));
    partGeo.setAttribute('aColor', new THREE.BufferAttribute(partColor, 3));

    const partMat = new THREE.ShaderMaterial({
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {},
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    let lastTime = performance.now();
    let animId: number;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const time = now * 0.001;

      coreMat.uniforms.uTime.value = time;
      haloMat.uniforms.uTime.value = time;
      nebulaMat.uniforms.uTime.value = time;

      const s = stateRef.current;
      s.coreIntensity += (s.targetIntensity - s.coreIntensity) * delta * 4;
      coreMat.uniforms.uIntensity.value = s.coreIntensity;
      haloMat.uniforms.uIntensity.value = s.coreIntensity;

      if (s.targetIntensity > 0.8) {
        s.targetIntensity -= delta * 2.0;
        if (s.targetIntensity < 0.7) s.targetIntensity = 0.7;
      }

      if (s.explodeAt > 0) {
        const elapsed = (now - s.explodeAt) / 1000;
        if (elapsed < 0.05) {
          for (let i = 0; i < PARTICLE_COUNT; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 2.5 + Math.random() * 1.5;
            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            velocities[i * 3 + 1] = Math.cos(phi) * speed * 1.1;
            velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed * 0.6;
            lives[i] = 1.0;
            partAlpha[i] = 1.0;
            partSize[i] = 0.04 + Math.random() * 0.04;
          }
          s.explodeAt = -1;
        }
      }

      const posAttr = partGeo.attributes.position as THREE.BufferAttribute;
      const alphaAttr = partGeo.attributes.aAlpha as THREE.BufferAttribute;
      const sizeAttr = partGeo.attributes.aSize as THREE.BufferAttribute;
      const pos = posAttr.array as Float32Array;
      const alphas = alphaAttr.array as Float32Array;
      const sizes = sizeAttr.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (lives[i] > 0) {
          pos[i * 3] += velocities[i * 3] * delta;
          pos[i * 3 + 1] += velocities[i * 3 + 1] * delta;
          pos[i * 3 + 2] += velocities[i * 3 + 2] * delta;
          velocities[i * 3] *= 0.97;
          velocities[i * 3 + 1] *= 0.97;
          velocities[i * 3 + 2] *= 0.97;
          lives[i] -= delta * 0.4;
          alphas[i] = Math.max(0, lives[i]);
          sizes[i] = 0.04 + lives[i] * 0.05;

          if (lives[i] <= 0) {
            pos[i * 3] = basePos[i * 3];
            pos[i * 3 + 1] = basePos[i * 3 + 1];
            pos[i * 3 + 2] = basePos[i * 3 + 2];
            alphas[i] = 0;
            sizes[i] = 0.03;
          }
        } else {
          const bx = basePos[i * 3];
          const by = basePos[i * 3 + 1];
          const bz = basePos[i * 3 + 2];
          const t = time * 0.4 + i * 0.1;
          pos[i * 3] = bx + Math.sin(t) * 0.015;
          pos[i * 3 + 1] = by + Math.cos(t * 1.3) * 0.015;
          pos[i * 3 + 2] = bz + Math.sin(t * 0.7) * 0.01;
        }
      }
      posAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;

      starPoints.rotation.y = time * 0.005;
      starPoints.rotation.x = Math.sin(time * 0.003) * 0.05;

      composer.render();
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      composer.dispose();
      starGeo.dispose();
      coreGeo.dispose();
      haloGeo.dispose();
      partGeo.dispose();
      nebulaGeo.dispose();
      nebulaMat.dispose();
      starMat.dispose();
      coreMat.dispose();
      haloMat.dispose();
      partMat.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
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
  );
}
