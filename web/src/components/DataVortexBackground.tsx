import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

const fragmentShader = `
  uniform float uTime;
  uniform sampler2D uText;
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
    // Normalise UV coordinates to center
    vec2 uv = vUv - 0.5;
    float dist = length(uv);
    
    // --- Event Horizon ---
    float horizon = 0.12;
    if (dist < horizon) {
      gl_FragColor = vec4(0.0, 0.0, 0.01, 1.0);
      return;
    }
    
    // --- Gravitational Lensing (Space-Time Warping) ---
    float lensFactor = 1.0 / (max(abs(dist * 6.0 - 0.5), 0.001));
    float angle = atan(uv.y + 0.000001, uv.x + 0.000001) + lensFactor * 0.9 + uTime * 0.15;
    
    // --- Data Stream Mapping ---
    // Use a clean angle without extreme lensing so text doesn't turn into a blur
    float cleanAngle = atan(uv.y, uv.x);
    vec2 dataUv = vec2(
      (cleanAngle / 6.28318) * 6.0, 
      (dist * 2.0) - uTime * 0.15 // Flow much slower inwards (was 0.4)
    );
    
    vec4 textSample = texture2D(uText, fract(dataUv));
    float textIntensity = textSample.r;
    
    // Create a sweeping funnel mask for the text 
    // We want a few thick ribbons of text flowing in
    float maskWave = sin(cleanAngle * 3.0 - uTime * 0.2); // Slower ribbon rotation (was 0.8)
    float ribbonMask = smoothstep(0.1, 0.9, maskWave * 0.5 + 0.5);
    
    // Add accretion disk noise
    float diskNoise = fbm(vec2(angle * 4.0 - uTime * 0.2, (1.0/dist) * 2.0));
    float diskGlow = exp(-abs(dist - 0.2) * 8.0) * (0.3 + diskNoise * 0.7);
    
    // Einstein Ring
    float einsteinGlow = exp(-(dist - horizon) * 35.0) * 1.2;
    
    // Colors
    vec3 colorOrangeRed = vec3(0.9, 0.3, 0.05);
    vec3 colorAmber = vec3(1.0, 0.6, 0.1);
    vec3 colorData = vec3(0.5, 0.9, 1.0); // Bright cyan/blue data for contrast
    
    // Accretion disk
    vec3 finalColor = mix(colorOrangeRed, colorAmber, diskNoise) * diskGlow;
    
    // Add Einstein Ring
    finalColor += colorAmber * einsteinGlow;
    
    // Add the holographic text! 
    // Additive blending makes the bright cyan text truly glow on top of the orange disk
    float textAlpha = textIntensity * (ribbonMask * 2.5 + 0.3);
    finalColor += colorData * textAlpha * 1.2;
    
    // Ambient background space
    float nebula = fbm(uv * 2.0 + uTime * 0.05);
    finalColor += vec3(0.02, 0.05, 0.1) * nebula;
    
    // Vignette
    float vignette = smoothstep(0.7, 0.0, dist);
    finalColor *= vignette;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function DataVortexBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- Generate Text Texture ---
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 2048;
    textCanvas.height = 2048;
    const ctx = textCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 2048, 2048);
      ctx.fillStyle = '#FFFFFF';
      // Dense matrix-style text
      ctx.font = 'bold 36px monospace';
      
      const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}:"<>?[];,./01';
      for (let y = 0; y < 2048; y += 32) {
        for (let x = 0; x < 2048; x += 24) {
          if (Math.random() > 0.3) { 
            const char = chars[Math.floor(Math.random() * chars.length)];
            ctx.globalAlpha = Math.random() * 0.9 + 0.1;
            ctx.fillText(char, x, y);
          }
        }
      }
    }
    const textTexture = new THREE.CanvasTexture(textCanvas);
    textTexture.wrapS = THREE.RepeatWrapping;
    textTexture.wrapT = THREE.RepeatWrapping;
    textTexture.magFilter = THREE.LinearFilter;
    textTexture.minFilter = THREE.LinearFilter;
    textTexture.generateMipmaps = false;
    textTexture.needsUpdate = true;

    // --- Scene setup ---
    const scene = new THREE.Scene();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020204);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // --- Scene Setup: Group for positioning ---
    const cosmicGroup = new THREE.Group();
    // Position it slightly left so the massive ribbon sweeps across the right
    cosmicGroup.position.set(-1.0, 1.0, 0);
    cosmicGroup.scale.set(2.5, 2.5, 2.5);
    scene.add(cosmicGroup);

    // --- Black Hole Plane ---
    const blackHoleGeo = new THREE.PlaneGeometry(16, 16);
    const blackHoleMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uText: { value: textTexture }
      },
      transparent: true,
      depthWrite: false,
    });
    const blackHole = new THREE.Mesh(blackHoleGeo, blackHoleMat);
    cosmicGroup.add(blackHole);

    // --- Mouse parallax ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // --- Resize handler ---
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      
      if (w < 768) {
        cosmicGroup.position.set(0, 1.0, 0);
      } else {
        cosmicGroup.position.set(-1.0, 1.0, 0);
      }
    };
    window.addEventListener('resize', onResize);
    onResize();

    // --- Animation loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      blackHoleMat.uniforms.uTime.value = elapsed;

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x += (mouse.x * 0.85 - camera.position.x) * 0.05;
      camera.position.y += (mouse.y * 0.65 - camera.position.y) * 0.05;
      camera.lookAt(new THREE.Vector3(0, 0, 0));

      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      textTexture.dispose();
      blackHoleGeo.dispose();
      blackHoleMat.dispose();
      renderer.dispose();
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
        filter: 'blur(2px)',
        transform: 'scale(1.02)'
      }}
    />
  );
}
