import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Theme } from '../../themes';
import { audioEngine } from './audioEngine';

interface Props {
  generateTrigger: number;
  theme: Theme;
  onPrismInteract?: () => void;
}

export default function PrismCanvas({ generateTrigger, theme, onPrismInteract }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const triggerRef = useRef(generateTrigger);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(new THREE.Color(theme.bg).getHex(), 0.04);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = width < 768 ? 8.5 : 6.8;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // --- Group Hierarchy ---
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const crystalGroup = new THREE.Group();
    rootGroup.add(crystalGroup);

    // --- 1. Outer Faceted Glass Prism ---
    const crystalGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.core || '#ffffff'),
      transmission: 0.92,
      opacity: 1,
      transparent: true,
      roughness: 0.04,
      ior: 1.6,
      thickness: 1.5,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      attenuationDistance: 1.2,
      attenuationColor: new THREE.Color(theme.accent || '#38bdf8'),
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalGroup.add(crystalMesh);

    // Facet Wireframe Edge Glow
    const wireGeo = new THREE.WireframeGeometry(crystalGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(theme.accent || '#38bdf8'),
      transparent: true,
      opacity: 0.65,
      linewidth: 1,
    });
    const wireLines = new THREE.LineSegments(wireGeo, wireMat);
    crystalGroup.add(wireLines);

    // --- 2. Inner Floating Quantum Core ---
    const coreGeo = new THREE.OctahedronGeometry(0.72, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.knobCore || theme.accent || '#38bdf8'),
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    crystalGroup.add(coreMesh);

    // Mini glowing solid center sphere
    const pointCoreGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const pointCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const pointCoreMesh = new THREE.Mesh(pointCoreGeo, pointCoreMat);
    crystalGroup.add(pointCoreMesh);

    // --- 3. Gimbal Orbital Rings ---
    const ringGroup = new THREE.Group();
    rootGroup.add(ringGroup);

    const ring1Geo = new THREE.TorusGeometry(2.8, 0.012, 16, 120);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.dialTrack || '#6366f1'),
      transparent: true,
      opacity: 0.35,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    ringGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.4, 0.009, 16, 120);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.accent || '#38bdf8'),
      transparent: true,
      opacity: 0.25,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 5;
    ringGroup.add(ring2);

    // --- 4. Floating Refractive Particles / Dust Field ---
    const particleCount = 500;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 6.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
      particleScales[i] = Math.random();
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Custom particle texture via canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color(theme.accent || '#38bdf8'),
      size: 0.12,
      map: particleTexture,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- 5. Quantum Shockwave Ring (Triggers on generation) ---
    const waveGeo = new THREE.RingGeometry(0.1, 0.25, 64);
    const waveMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.accent || '#38bdf8'),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const shockwave = new THREE.Mesh(waveGeo, waveMat);
    shockwave.rotation.x = Math.PI / 2;
    scene.add(shockwave);

    let shockwaveProgress = 1.0; // 0 to 1

    // --- 6. Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(new THREE.Color(theme.accent || '#38bdf8'), 4.0, 15);
    pointLight1.position.set(3, 4, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(new THREE.Color(theme.knobCore || '#f43f5e'), 3.5, 15);
    pointLight2.position.set(-3, -3, -2);
    scene.add(pointLight2);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(1, 5, 4);
    scene.add(keyLight);

    // --- Interactive Physics & State ---
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let velX = 0.003;
    let velY = 0.004;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const onPointerDown = (e: PointerEvent) => {
      // Allow interaction if clicking on canvas or drag area
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      if (onPrismInteract) onPrismInteract();
    };

    const onPointerMove = (e: PointerEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetTiltX = normY * 0.35;
      targetTiltY = normX * 0.45;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        velY = deltaX * 0.008;
        velX = deltaY * 0.008;

        crystalGroup.rotation.y += velY;
        crystalGroup.rotation.x += velX;

        audioEngine.playPrismRotate(Math.min(2.5, Math.hypot(deltaX, deltaY) * 0.1 + 0.8));
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // --- Trigger Shockwave Function ---
    const triggerBurst = () => {
      shockwaveProgress = 0.0;
      shockwave.scale.set(1, 1, 1);
      // Sudden spin boost
      velY += 0.04;
      velX += 0.02;
    };

    // --- Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Damped inertia rotation
      if (!isDragging) {
        velX *= 0.94;
        velY *= 0.94;
        // Keep minimum gentle ambient spin
        const baseSpin = 0.004;
        crystalGroup.rotation.x += velX + baseSpin * 0.4;
        crystalGroup.rotation.y += velY + baseSpin;
      }

      // Parallax smooth tilt
      currentTiltX += (targetTiltX - currentTiltX) * 0.05;
      currentTiltY += (targetTiltY - currentTiltY) * 0.05;
      rootGroup.rotation.x = currentTiltX;
      rootGroup.rotation.y = currentTiltY;

      // Inner core counter-rotation and breathing pulse
      coreMesh.rotation.x -= 0.015;
      coreMesh.rotation.y -= 0.02;
      const corePulse = 1.0 + Math.sin(elapsedTime * 2.5) * 0.12;
      coreMesh.scale.set(corePulse, corePulse, corePulse);

      // Orbital rings harmonic rotation
      ring1.rotation.z += 0.003;
      ring2.rotation.z -= 0.002;
      ringGroup.rotation.y += 0.0015;

      // Particles slow drift
      particles.rotation.y = elapsedTime * 0.02;
      particles.rotation.x = Math.sin(elapsedTime * 0.03) * 0.1;

      // Shockwave animation
      if (shockwaveProgress < 1.0) {
        shockwaveProgress += 0.035;
        const s = 1.0 + shockwaveProgress * 18.0;
        shockwave.scale.set(s, s, s);
        waveMat.opacity = Math.max(0, (1.0 - shockwaveProgress) * 0.85);
      } else {
        waveMat.opacity = 0;
      }

      // Dynamic theme sync
      const currentTheme = themeRef.current;
      scene.fog?.color.set(currentTheme.bg);
      crystalMat.attenuationColor.set(currentTheme.accent || '#38bdf8');
      wireMat.color.set(currentTheme.accent || '#38bdf8');
      coreMat.color.set(currentTheme.knobCore || currentTheme.accent || '#38bdf8');
      particleMat.color.set(currentTheme.accent || '#38bdf8');
      pointLight1.color.set(currentTheme.accent || '#38bdf8');
      waveMat.color.set(currentTheme.accent || '#38bdf8');

      // Check external trigger
      if (triggerRef.current !== generateTrigger) {
        triggerRef.current = generateTrigger;
        triggerBurst();
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- Window Resize ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.position.z = w < 768 ? 8.5 : 6.8;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      pointCoreGeo.dispose();
      pointCoreMat.dispose();
      ring1Geo.dispose();
      ringMat1.dispose();
      ring2Geo.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTexture.dispose();
      waveGeo.dispose();
      waveMat.dispose();
    };
  }, [theme, generateTrigger, onPrismInteract]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'auto',
        overflow: 'hidden',
        cursor: 'grab',
      }}
      title="Click and drag anywhere to inspect and spin the 3D Holographic Prism"
    />
  );
}
