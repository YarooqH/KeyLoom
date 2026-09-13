import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  // Pseudo-random noise functions
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
      // Pitch black void inside the black hole
      gl_FragColor = vec4(0.01, 0.01, 0.02, 1.0);
      return;
    }
    
    // --- Gravitational Lensing (Space-Time Warping) ---
    // Simulates light bending around the singularity
    // Avoid division by zero by using a small epsilon
    float lensFactor = 1.0 / (max(abs(dist * 8.0 - 0.6), 0.001));
    float angle = atan(uv.y + 0.000001, uv.x + 0.000001) + lensFactor * 0.85 + uTime * 0.15;
    
    // --- Accretion Disk (Tilted Gravitational Ring) ---
    // Scale y to simulate a 3D tilted plane, and warp based on angle
    float tilt = 0.35;
    vec2 tiltedUv = vec2(cos(angle) * dist, sin(angle) * dist / tilt);
    float tiltedDist = length(tiltedUv);
    
    // Complex noise on the accretion disk to simulate swirling gas
    float diskNoise = fbm(vec2(angle * 3.5 - uTime * 0.2, tiltedDist * 16.0));
    float diskNoise2 = fbm(vec2(angle * 6.0 + uTime * 0.1, tiltedDist * 32.0));
    
    // Radial glow profile of the swirling gas (thinner, more detailed strings)
    float diskGlow = exp(-abs(tiltedDist - 0.28) * 16.0) * (0.4 + diskNoise * 0.7 + diskNoise2 * 0.3);
    
    // --- Einstein Ring (Relativistic light halo) ---
    // The super-bright ring of light bent around the back of the event horizon
    float einsteinGlow = exp(-(dist - horizon) * 28.0) * (0.8 + diskNoise2 * 0.5);
    
    // --- Ambient Teal Space Nebula ---
    float nebulaNoise = fbm(uv * 3.0 + vec2(uTime * 0.04, -uTime * 0.02));
    float nebulaGlow = exp(-dist * 1.2) * (0.15 + nebulaNoise * 0.35);
    
    // Colors
    vec3 colorOrangeRed = vec3(0.9, 0.2, 0.02);
    vec3 colorAmber = vec3(1.0, 0.5, 0.05);
    vec3 colorTeal = vec3(0.05, 0.35, 0.45);
    vec3 colorEinstein = vec3(1.0, 0.7, 0.3);
    
    // Accretion disk coloring
    vec3 diskColor = mix(colorOrangeRed, colorAmber, diskNoise);
    vec3 finalColor = diskColor * diskGlow * 1.8; // Reduced brightness multiplier
    
    // Add Einstein Ring
    finalColor += colorEinstein * einsteinGlow;
    
    // Add Teal background nebula
    finalColor += colorTeal * nebulaGlow * 1.2;
    
    // Subtle chromatic aberration vignette at outer edges
    float vignette = smoothstep(0.5, 0.1, dist);
    finalColor *= vignette;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface CosmicBackgroundProps {
  isSingularity?: boolean;
}

export default function CosmicBackground({ isSingularity = false }: CosmicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- Scene setup ---
    const scene = new THREE.Scene();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050508);

    // --- Post-processing (high-end bloom for space glow) ---
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const _bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      2.2,   // strength
      0.95,  // radius
      0.08   // threshold
    );
    void _bloomPass;

    // --- Scene Setup: Group for positioning ---
    const cosmicGroup = new THREE.Group();
    // Shift top right and make massive, but pan out a bit
    cosmicGroup.position.set(2.0, 3.2, 0);
    cosmicGroup.scale.set(2.2, 2.2, 2.2);
    scene.add(cosmicGroup);

    // --- Black Hole Plane (glowing warped accretion disk + lensing) ---
    const blackHoleGeo = new THREE.PlaneGeometry(16, 16);
    const blackHoleMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: fragmentShader
        .replace('float tilt = 0.35;', 'float tilt = 0.20;') // Flatter disk
        .replace('float diskGlow = exp(-abs(tiltedDist - 0.28) * 16.0)', 'float diskGlow = exp(-abs(tiltedDist - 0.28) * 35.0)') // Thinner disk
        .replace('vec3 finalColor = diskColor * diskGlow * 1.8;', 'vec3 finalColor = diskColor * diskGlow * 1.2;'), // Less blinding
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    });
    const blackHole = new THREE.Mesh(blackHoleGeo, blackHoleMat);
    blackHole.visible = !isSingularity;
    cosmicGroup.add(blackHole);

    // --- Stardust particles ---
    const particleCount = 1500;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      if (isSingularity) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
        velocities[i] = (Math.random() - 0.5) * 0.02; // Slow random drift
      } else {
        const r = 2.5 + Math.random() * 15;
        const theta = Math.random() * Math.PI * 2;
        const z = (Math.random() - 0.5) * 5 - 1;
        
        positions[i * 3] = r * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(theta);
        positions[i * 3 + 2] = z;
        
        velocities[i] = 0.1 / Math.sqrt(r);
      }
    }
    
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // soft star canvas texture
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 16;
    starCanvas.height = 16;
    const ctx = starCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.75)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    const starTexture = new THREE.CanvasTexture(starCanvas);
    
    const particleMat = new THREE.PointsMaterial({
      color: 0xddddff,
      size: 0.08,
      map: starTexture,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const particles = new THREE.Points(particleGeo, particleMat);
    if (isSingularity) {
      scene.add(particles);
    } else {
      cosmicGroup.add(particles);
    }

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
      
      // Adjust position based on screen ratio
      if (w < 768) {
        cosmicGroup.position.set(0, 3.2, 0);
      } else {
        cosmicGroup.position.set(2.0, 3.2, 0);
      }
    };
    window.addEventListener('resize', onResize);
    onResize(); // Initial call to set correct position

    // --- Animation loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Update shader uniforms
      blackHoleMat.uniforms.uTime.value = elapsed;

      // Animate stardust particles (swirling orbit into the gravity well)
      const positionsAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let x = positionsAttr.getX(i);
        let y = positionsAttr.getY(i);
        let z = positionsAttr.getZ(i);
        
        if (isSingularity) {
          // Slow continuous drift
          x += velocities[i];
          y += velocities[i] * 0.5;
          
          // Wrap around if they go too far
          if (x > 20) x = -20;
          if (x < -20) x = 20;
          if (y > 20) y = -20;
          if (y < -20) y = 20;
          
          positionsAttr.setXYZ(i, x, y, z);
        } else {
          const currentR = Math.sqrt(x*x + y*y);
          const speed = velocities[i];
          const currentAngle = Math.atan2(y, x) + speed * 0.15;
          
          let newR = currentR - 0.001 * speed;
          if (newR < 0.1) {
            newR = 12 + Math.random() * 5;
          }
          
          positionsAttr.setXYZ(i, newR * Math.cos(currentAngle), newR * Math.sin(currentAngle), z);
        }
      }
      positionsAttr.needsUpdate = true;

      // Smooth mouse parallax camera movement
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x += (mouse.x * 0.85 - camera.position.x) * 0.05;
      camera.position.y += (mouse.y * 0.65 - camera.position.y) * 0.05;
      camera.lookAt(new THREE.Vector3(0, 0, 0));

      composer.render();
    };
    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      particleGeo.dispose();
      particleMat.dispose();
      starTexture.dispose();
      blackHoleGeo.dispose();
      blackHoleMat.dispose();
      renderer.dispose();
    };
  }, [isSingularity]);

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
        transform: 'scale(1.02)' // Prevent blur artifacts on the edges
      }}
    />
  );
}