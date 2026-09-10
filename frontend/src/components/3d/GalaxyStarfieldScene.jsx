import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural soft glowing star alpha texture (bright core with cyan/violet halo)
function createStarTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.2, 'rgba(240, 250, 255, 0.95)');
  gradient.addColorStop(0.45, 'rgba(0, 229, 255, 0.7)');
  gradient.addColorStop(0.75, 'rgba(124, 58, 237, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural vibrant nebula color wash texture
function createNebulaTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(128, 128, 15, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(0, 229, 255, 0.75)');     // Electric cyan core
  gradient.addColorStop(0.35, 'rgba(99, 102, 241, 0.60)');  // Deep cosmic indigo
  gradient.addColorStop(0.65, 'rgba(168, 85, 247, 0.45)');  // Amethyst violet
  gradient.addColorStop(0.88, 'rgba(15, 23, 42, 0.2)');
  gradient.addColorStop(1, 'rgba(8, 11, 16, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function GalaxyStarfieldScene({ reducedMotion = false }) {
  const groupRef = useRef(null);
  const coreRef = useRef(null);
  const coreHaloRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const dustRef = useRef(null);
  const starsRef = useRef(null);
  const flaresRef = useRef(null);
  const nebula1Ref = useRef(null);
  const nebula2Ref = useRef(null);

  const starTexture = useMemo(() => createStarTexture(), []);
  const nebulaTexture = useMemo(() => createNebulaTexture(), []);

  // 1. Layer 1: Dense Cosmic Dust Field (1,200 tiny distant stars)
  const dustData = useMemo(() => {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cWhite = new THREE.Color('#FFFFFF');
    const cViolet = new THREE.Color('#A78BFA');
    const cCyan = new THREE.Color('#38BDF8');

    for (let i = 0; i < count; i++) {
      const radius = 1.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const color = Math.random() < 0.5 ? cWhite : (Math.random() < 0.5 ? cCyan : cViolet);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return { pos, col };
  }, []);

  // 2. Layer 2: Galactic Spiral Stars (600 medium shimmering stars)
  const starsData = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cWhite = new THREE.Color('#FFFFFF');
    const cCyan = new THREE.Color('#00E5FF');
    const cSky = new THREE.Color('#38BDF8');
    const cViolet = new THREE.Color('#C084FC');
    const cAmber = new THREE.Color('#F59E0B');

    for (let i = 0; i < count; i++) {
      const radius = 1.2 + Math.pow(Math.random(), 1.4) * 3.4;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = radius * Math.cos(angle);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.75 * (1 + radius * 0.2);
      pos[i * 3 + 2] = radius * Math.sin(angle);

      const roll = Math.random();
      let color;
      if (roll < 0.35) color = cCyan;
      else if (roll < 0.60) color = cWhite;
      else if (roll < 0.80) color = cSky;
      else if (roll < 0.92) color = cViolet;
      else color = cAmber;

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return { pos, col };
  }, []);

  // 3. Layer 3: Major Stellar Beacons / Neural Flares (150 large, bright glowing stars)
  const flaresData = useMemo(() => {
    const count = 150;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cCyan = new THREE.Color('#00F2FE');
    const cWhite = new THREE.Color('#FFFFFF');
    const cAmber = new THREE.Color('#FBBF24');
    const cViolet = new THREE.Color('#E879F9');

    for (let i = 0; i < count; i++) {
      const radius = 1.1 + Math.random() * 3.2;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = radius * Math.cos(angle);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
      pos[i * 3 + 2] = radius * Math.sin(angle);

      const roll = Math.random();
      const color = roll < 0.45 ? cCyan : (roll < 0.75 ? cWhite : (roll < 0.9 ? cAmber : cViolet));
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return { pos, col };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const ptr = state.pointer || state.mouse || { x: 0, y: 0 };

    if (groupRef.current) {
      const targetRotX = -ptr.y * 0.22;
      const targetRotY = ptr.x * 0.32 + (reducedMotion ? 0 : t * 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
    }

    if (!reducedMotion) {
      // Rotation across the 3 star layers
      if (dustRef.current) dustRef.current.rotation.y = t * 0.012;
      if (starsRef.current) starsRef.current.rotation.y = t * 0.028;
      if (flaresRef.current) {
        flaresRef.current.rotation.y = t * 0.035;
        // Visible twinkle modulation on major beacons
        const flarePulse = 1 + Math.sin(t * 3.0) * 0.12;
        flaresRef.current.scale.set(flarePulse, flarePulse, flarePulse);
      }

      // Smooth neural core breathing pulse
      if (coreRef.current) {
        const pulse = 1 + Math.sin(t * 1.8) * 0.08;
        coreRef.current.scale.set(pulse, pulse, pulse);
        coreRef.current.rotation.y = t * 0.18;
        coreRef.current.rotation.x = Math.sin(t * 0.5) * 0.12;
      }

      // Volumetric core bloom halo pulsing
      if (coreHaloRef.current) {
        const haloPulse = 1 + Math.sin(t * 1.8) * 0.12;
        coreHaloRef.current.scale.set(haloPulse, haloPulse, haloPulse);
      }

      // Counter-rotating telemetry rings
      if (ring1Ref.current) {
        ring1Ref.current.rotation.x = t * 0.2;
        ring1Ref.current.rotation.y = t * 0.16;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.x = -t * 0.18;
        ring2Ref.current.rotation.z = t * 0.22;
      }

      // Dual rotating nebula cloud planes
      if (nebula1Ref.current) {
        nebula1Ref.current.rotation.z = t * 0.02;
        const neb1Scale = 1 + Math.sin(t * 0.9) * 0.05;
        nebula1Ref.current.scale.set(neb1Scale, neb1Scale, 1);
      }
      if (nebula2Ref.current) {
        nebula2Ref.current.rotation.z = -t * 0.015;
        const neb2Scale = 1 + Math.cos(t * 0.8) * 0.06;
        nebula2Ref.current.scale.set(neb2Scale, neb2Scale, 1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />

      {/* 1. Dual Layered Deep-Space Nebula Clouds (Settled lower with calm ambient opacity) */}
      <mesh ref={nebula1Ref} position={[0, -0.6, -2.6]}>
        <planeGeometry args={[12, 8]} />
        <meshBasicMaterial
          map={nebulaTexture}
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={nebula2Ref} position={[0.5, -0.8, -3.0]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[11, 7.5]} />
        <meshBasicMaterial
          map={nebulaTexture}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. Layer 1: Dense Background Cosmic Dust (1,200 tiny stars, size 0.028) */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dustData.pos.length / 3}
            array={dustData.pos}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={dustData.col.length / 3}
            array={dustData.col}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.028}
          map={starTexture}
          vertexColors
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 3. Layer 2: Medium Shimmering Galactic Stars (600 stars, size 0.075) */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={starsData.pos.length / 3}
            array={starsData.pos}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={starsData.col.length / 3}
            array={starsData.col}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.072}
          map={starTexture}
          vertexColors
          transparent
          opacity={0.65}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 4. Layer 3: Major Stellar Beacons & Flares (150 large bloom stars, size 0.13) */}
      <points ref={flaresRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={flaresData.pos.length / 3}
            array={flaresData.pos}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={flaresData.col.length / 3}
            array={flaresData.col}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.13}
          map={starTexture}
          vertexColors
          transparent
          opacity={0.75}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 5. Repositioned & Calibrated Central Neural Core (Sitting lower and deeper at y = -0.95, z = -0.65, scale = 0.78) */}
      <group position={[0, -0.95, -0.65]} scale={0.78}>
        {/* Calibrated Internal Point Lights */}
        <pointLight position={[0, 0, 0]} color="#00E5FF" intensity={2.2} distance={5} />
        <pointLight position={[0, 0, 0]} color="#F59E0B" intensity={1.0} distance={3} />

        {/* Central Neural Core (Smooth Shaded, Calibrated Emissive Nucleus) */}
        <group ref={coreRef}>
          <mesh>
            <octahedronGeometry args={[0.92, 2]} />
            <meshStandardMaterial
              color="#001F2D"
              emissive="#00E5FF"
              emissiveIntensity={0.9}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        </group>

        {/* Volumetric Core Bloom Halo (Subtle atmospheric glow) */}
        <mesh ref={coreHaloRef}>
          <sphereGeometry args={[1.18, 32, 32]} />
          <meshBasicMaterial
            color="#00F2FE"
            transparent
            opacity={0.15}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Outer Neural Geodesic Wireframe Lattice */}
        <mesh>
          <icosahedronGeometry args={[1.45, 1]} />
          <meshBasicMaterial
            color="#00E5FF"
            wireframe
            transparent
            opacity={0.26}
          />
        </mesh>

        {/* Concentric Gimbal Telemetry Rings (Faint atmospheric arcs, thin & low opacity) */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[2.25, 0.009, 16, 90]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={0.25}
            roughness={0.2}
            metalness={0.9}
            transparent
            opacity={0.12}
          />
        </mesh>

        <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[2.55, 0.008, 16, 100]} />
          <meshStandardMaterial
            color="#818CF8"
            emissive="#818CF8"
            emissiveIntensity={0.2}
            roughness={0.2}
            metalness={0.9}
            transparent
            opacity={0.10}
          />
        </mesh>
      </group>
    </group>
  );
}

export default GalaxyStarfieldScene;
