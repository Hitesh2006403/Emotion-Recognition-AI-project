import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural soft glowing star alpha texture (circular with soft falloff & cyan/violet bloom halo)
function createStarTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.18, 'rgba(230, 245, 255, 0.95)');
  gradient.addColorStop(0.45, 'rgba(0, 229, 255, 0.55)');
  gradient.addColorStop(0.75, 'rgba(124, 58, 237, 0.18)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural soft nebula color wash texture
function createNebulaTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0, 229, 255, 0.22)');
  gradient.addColorStop(0.4, 'rgba(99, 102, 241, 0.16)');
  gradient.addColorStop(0.7, 'rgba(124, 58, 237, 0.08)');
  gradient.addColorStop(1, 'rgba(8, 11, 16, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function GalaxyStarfieldScene({ reducedMotion = false }) {
  const groupRef = useRef(null);
  const coreRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const starsRef = useRef(null);
  const nebulaRef = useRef(null);

  const starTexture = useMemo(() => createStarTexture(), []);
  const nebulaTexture = useMemo(() => createNebulaTexture(), []);

  // 1,800 stars partitioned between a galactic disk and an outer cosmic halo
  const { positions, colors, sizes } = useMemo(() => {
    const count = 1800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    const cWhite = new THREE.Color('#FFFFFF');
    const cCyan = new THREE.Color('#00E5FF');
    const cSky = new THREE.Color('#38BDF8');
    const cViolet = new THREE.Color('#A78BFA');
    const cAmber = new THREE.Color('#F59E0B');

    for (let i = 0; i < count; i++) {
      // 65% in flattened galactic disk with spiral density falloff, 35% in spherical halo
      const isDisk = Math.random() < 0.65;
      let x, y, z;

      if (isDisk) {
        const radius = 1.2 + Math.pow(Math.random(), 1.5) * 3.6;
        const angle = Math.random() * Math.PI * 2;
        x = radius * Math.cos(angle);
        z = radius * Math.sin(angle);
        y = (Math.random() - 0.5) * 0.85 * (1 + radius * 0.15); // gentle galactic disc thickness
      } else {
        const radius = 1.8 + Math.random() * 3.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        x = radius * Math.sin(phi) * Math.cos(theta);
        y = radius * Math.sin(phi) * Math.sin(theta);
        z = radius * Math.cos(phi);
      }

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color variation: 45% white, 30% cyan, 15% violet, 10% amber
      const roll = Math.random();
      let color;
      if (roll < 0.45) color = cWhite;
      else if (roll < 0.75) color = Math.random() > 0.5 ? cCyan : cSky;
      else if (roll < 0.90) color = cViolet;
      else color = cAmber;

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      // Varied star size (closer/major stars shimmer slightly larger)
      sz[i] = Math.random() * 0.05 + 0.025;
    }

    return { positions: pos, colors: col, sizes: sz };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const ptr = state.pointer || state.mouse || { x: 0, y: 0 };

    if (groupRef.current) {
      // Cursor parallax tilt
      const targetRotX = -ptr.y * 0.22;
      const targetRotY = ptr.x * 0.32 + (reducedMotion ? 0 : t * 0.06);

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
    }

    if (!reducedMotion) {
      // Starfield slow orbital rotation & subtle twinkle
      if (starsRef.current) {
        starsRef.current.rotation.y = t * 0.025;
        starsRef.current.rotation.z = Math.sin(t * 0.1) * 0.05;
      }

      // Galactic core breathing pulse
      if (coreRef.current) {
        const pulse = 1 + Math.sin(t * 1.6) * 0.06;
        coreRef.current.scale.set(pulse, pulse, pulse);
        coreRef.current.rotation.z = -t * 0.12;
      }

      // Counter-rotating telemetry rings
      if (ring1Ref.current) {
        ring1Ref.current.rotation.x = t * 0.18;
        ring1Ref.current.rotation.y = t * 0.14;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.x = -t * 0.15;
        ring2Ref.current.rotation.z = t * 0.2;
      }

      // Nebula wash subtle drift & breathing
      if (nebulaRef.current) {
        nebulaRef.current.rotation.z = t * 0.015;
        const nebPulse = 1 + Math.sin(t * 0.8) * 0.04;
        nebulaRef.current.scale.set(nebPulse, nebPulse, 1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Deep-Space Nebula Color Wash (Backdrop Plane) */}
      <mesh ref={nebulaRef} position={[0, 0, -2.8]}>
        <planeGeometry args={[11, 7.5]} />
        <meshBasicMaterial
          map={nebulaTexture}
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. Galactic Starfield (Glowing Stars with Bloom Halo) */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          map={starTexture}
          vertexColors
          transparent
          opacity={0.88}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 3. Central Galactic Geodesic Lattice (Wireframe Icosahedron) */}
      <mesh>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshBasicMaterial
          color="#00E5FF"
          wireframe
          transparent
          opacity={0.24}
        />
      </mesh>

      {/* 4. Resonant Galactic Nucleus (Inner Octahedron) */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.88, 0]} />
        <meshBasicMaterial
          color="#00F2FE"
          wireframe
          transparent
          opacity={0.58}
        />
      </mesh>

      {/* 5. Concentric Gimbal Telemetry Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.2, 0.014, 16, 90]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.35}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.5, 0.012, 16, 100]} />
        <meshBasicMaterial
          color="#818CF8"
          transparent
          opacity={0.28}
        />
      </mesh>

      {/* 6. Amber Stellar Flare Nodes */}
      <mesh>
        <icosahedronGeometry args={[1.4, 1]} />
        <pointsMaterial
          size={0.07}
          color="#F59E0B"
          map={starTexture}
          transparent
          opacity={0.55}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default GalaxyStarfieldScene;
