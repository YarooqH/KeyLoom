import { useEffect, useRef } from 'react';

interface Particle {
  r: number;
  theta: number;
  char: string;
  color: string;
}

interface Props {
  generateTrigger?: number;
}

export default function AsciiSingularity({ generateTrigger = 0 }: Props = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shootRef = useRef<number>(0);

  useEffect(() => {
    if (generateTrigger > 0) {
      shootRef.current = performance.now();
    }
  }, [generateTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataChars = "01$&<>?[]!@%*+=ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const densityChars = "  ..:---==++**##%%@@██";

    // 150 particles scattered everywhere
    const particles: Particle[] = Array.from({ length: 150 }, () => resetParticle(true));

    function resetParticle(randomStart = false): Particle {
      const colors = ['#ffffff']; // Particles are purely white
      
      let r, theta;
      if (randomStart) {
        // Spawn randomly across the visible field
        r = 0.5 + Math.random() * 3.5;
        theta = Math.random() * Math.PI * 2;
      } else {
        // Respawn at the edges to feed the black hole
        r = 3.5 + Math.random() * 1.0;
        theta = Math.random() * Math.PI * 2;
      }
      
      return {
        r,
        theta,
        char: dataChars[Math.floor(Math.random() * dataChars.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }

    let animId: number;
    let lastTime = performance.now();

    // CSS-pixel dimensions for drawing math; backing store is dpr-scaled so
    // the moving ASCII cells stay crisp on high-DPI displays (the bilinear
    // upscale was the source of the smudgy/trailing look).
    const dpr = window.devicePixelRatio || 1;
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;
    const handleResize = () => {
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Draw background
      ctx.fillStyle = '#030306';
      // Reset and re-apply DPR transform each frame (fillRect resets it).
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillRect(0, 0, cssW, cssH);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Determine grid size dynamically based on window
      const cellW = 10;
      const cellH = 16;
      const gridCols = Math.ceil(cssW / cellW);
      const gridRows = Math.ceil(cssH / cellH);

      ctx.font = 'bold 9px "Courier New", Courier, monospace';

      const time = now * 0.001;
      const horizon = 0.30; // Further reduced black hole size
      const tilt = 0.15;

      // Center of the black hole is at 30% of the screen width
      const cx = gridCols * 0.3;
      const cy = gridRows * 0.5;
      const halfH = cssH / 2;

      const grid: { char: string; color: string; alpha: number }[][] = [];
      
      for (let y = 0; y < gridRows; y++) {
        grid[y] = [];
        for (let x = 0; x < gridCols; x++) {
          // Calculate perfect circular distance based on physical pixels
          const pixelX = x * cellW;
          const pixelY = y * cellH;
          const centerX = cx * cellW;
          const centerY = cy * cellH;
          
          const dx = (pixelX - centerX) / halfH;
          const dy = (pixelY - centerY) / halfH;
          
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const diskDist = Math.hypot(dx, dy / tilt);

          let brightness = 0;
          let color = '#00b8d4';
          let isVoid = false;

          // Einstein Ring
          const haloDist = dist - horizon;
          if (haloDist > 0 && haloDist < 0.35) {
            const haloBase = 1.0 - (haloDist / 0.35);
            const polarBoost = Math.abs(Math.sin(angle));
            brightness = Math.pow(haloBase, 2.0) * (0.3 + 0.7 * polarBoost);
            color = haloDist < 0.08 ? '#e0f7fa' : '#00b8d4';
          }

          // Accretion Disk
          if (diskDist > horizon && diskDist < 2.5) {
            const isFront = dy > -0.05;
            if (isFront || dist > horizon) {
              const diskIntensity = Math.exp(-Math.abs(diskDist - (horizon + 0.15)) * 2.5);
              const swirl = Math.sin(Math.atan2(dy / tilt, dx) * 6.0 - time * 3.0) * 0.15 + 0.85;
              const finalDisk = diskIntensity * swirl;
              
              if (finalDisk > brightness) {
                brightness = finalDisk;
                color = diskDist < horizon + 0.3 ? '#ffffff' : (diskDist < horizon + 0.6 ? '#00e5ff' : '#006064');
              }
            }
          }

          // Event Horizon
          if (dist < horizon) {
            const frontDiskThickness = 0.08;
            const isFrontDisk = (diskDist > horizon && diskDist < 2.5 && Math.abs(dy) < frontDiskThickness);
            
            if (!isFrontDisk) {
              brightness = 0;
              isVoid = true;
            }
          }

          if (brightness < 0.05 && !isVoid) {
            const noise = Math.sin(x * 12.9898 + y * 78.233 + time * 0.5) * 43758.5453;
            if (noise - Math.floor(noise) > 0.995) {
              brightness = 0.15;
              color = '#00e5ff';
            }
          }

          let char = ' ';
          let alpha = Math.min(1.0, brightness * 1.5);

          if (isVoid) {
            char = ' ';
            alpha = 1.0;
            color = '#000000';
          } else if (brightness > 0.05) {
            const charIdx = Math.min(
              densityChars.length - 1,
              Math.floor(Math.pow(brightness, 0.8) * densityChars.length)
            );
            char = densityChars[charIdx];
          } else if (brightness > 0.01) {
            char = '.'; 
          }

          grid[y][x] = { char, color, alpha };
        }
      }

      // Update particles
      const isShooting = shootRef.current > 0 && (now - shootRef.current) < 1200;

      particles.forEach((p, idx) => {
        if (isShooting) {
          // Shoot outwards to the right
          let nTheta = p.theta % (2 * Math.PI);
          if (nTheta > Math.PI) nTheta -= 2 * Math.PI;
          if (nTheta < -Math.PI) nTheta += 2 * Math.PI;
          
          // Gently curve their path towards the right side
          p.theta = nTheta * (1 - 2.0 * delta); 
          // Explode outwards rapidly
          p.r += 15.0 * delta; 
          
          // Continuous fountain: once they fly off screen, instantly respawn them AT the event horizon facing right
          if (p.r > 6.0) {
            p.r = horizon + 0.05;
            p.theta = (Math.random() - 0.5) * 1.5; // Spray cone (between -45 and 45 degrees)
            p.char = "01$&<>?[]!@%*+=ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 43)];
          }
        } else {
          // Normal spiral inwards
          const inwardSpeed = 0.05 + 0.15 / (p.r + 0.1);
          p.r -= inwardSpeed * delta;
          
          const swirlSpeed = 0.5 + 0.8 / (p.r + 0.1);
          p.theta += swirlSpeed * delta;

          if (p.r < horizon * 0.8) {
            particles[idx] = resetParticle();
          }
        }
      });

      // Render grid to screen
      for (let y = 0; y < gridRows; y++) {
        if (!grid[y]) continue;
        for (let x = 0; x < gridCols; x++) {
          const cell = grid[y][x];
          if (!cell || cell.char === ' ') continue;

          ctx.fillStyle = cell.color;
          ctx.globalAlpha = cell.alpha;
          ctx.fillText(cell.char, x * cellW + cellW / 2, y * cellH + cellH / 2);
        }
      }
      
      // Render floating particles smoother and in the app's monospace font
      ctx.font = '14px "Space Mono", monospace';
      particles.forEach(p => {
        const px = Math.cos(p.theta) * p.r;
        const py = Math.sin(p.theta) * p.r;
        const pixelX = px * halfH + (cx * cellW);
        const pixelY = py * halfH + (cy * cellH);
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1.0;
        
        // Add a subtle glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillText(p.char, pixelX, pixelY);
      });
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 3px, 6px 100%',
        pointerEvents: 'none',
        zIndex: 3,
      }} />
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
