import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural soft aurora particle alpha texture (smooth circular glow with indigo-cyan-mint halo)
function createAuroraParticleTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.25, 'rgba(99, 102, 241, 0.9)');
  gradient.addColorStop(0.55, 'rgba(6, 182, 212, 0.6)');
  gradient.addColorStop(0.8, 'rgba(16, 185, 129, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural vibrant aurora backdrop wash texture for light mode
function createAuroraBackdropTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.45)');     // Indigo
  gradient.addColorStop(0.35, 'rgba(6, 182, 212, 0.40)');   // Cyan
  gradient.addColorStop(0.68, 'rgba(16, 185, 129, 0.32)');  // Mint
  gradient.addColorStop(0.88, 'rgba(168, 85, 247, 0.2)');   // Violet
  gradient.addColorStop(1, 'rgba(248, 249, 250, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function AuroraIntelligenceScene({ reducedMotion = false }) {
  const groupRef = useRef(null);
  const crystalGroupRef = useRef(null);
  const innerCoreRef = useRef(null);
  const coreHaloRef = useRef(null);
  const ribbon1Ref = useRef(null);
  const ribbon2Ref = useRef(null);
  const ribbon3Ref = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const backdropRef = useRef(null);

  const particleTexture = useMemo(() => createAuroraParticleTexture(), []);
  const backdropTexture = useMemo(() => createAuroraBackdropTexture(), []);

  // 3 Orbiting Aurora Particle Ribbons (Indigo, Cyan, Mint)
  const countPerRibbon = 300;

  const ribbon1 = useMemo(() => {
    const pos = new Float32Array(countPerRibbon * 3);
    for (let i = 0; i < countPerRibbon; i++) {
      const radius = 1.9 + (Math.random() - 0.5) * 0.45;
      const angle = (i / countPerRibbon) * Math.PI * 2 + Math.random() * 0.08;
      pos[i * 3] = radius * Math.cos(angle);
      pos[i * 3 + 1] = Math.sin(angle * 2) * 0.5 + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 2] = radius * Math.sin(angle);
    }
    return pos;
  }, []);

  const ribbon2 = useMemo(() => {
    const pos = new Float32Array(countPerRibbon * 3);
    for (let i = 0; i < countPerRibbon; i++) {
      const radius = 2.3 + (Math.random() - 0.5) * 0.5;
      const angle = (i / countPerRibbon) * Math.PI * 2 + Math.random() * 0.08;
      pos[i * 3] = radius * Math.cos(angle);
      pos[i * 3 + 1] = radius * Math.sin(angle);
      pos[i * 3 + 2] = Math.cos(angle * 2) * 0.55 + (Math.random() - 0.5) * 0.25;
    }
    return pos;
  }, []);

  const ribbon3 = useMemo(() => {
    const pos = new Float32Array(countPerRibbon * 3);
    for (let i = 0; i < countPerRibbon; i++) {
      const radius = 2.65 + (Math.random() - 0.5) * 0.55;
      const angle = (i / countPerRibbon) * Math.PI * 2 + Math.random() * 0.08;
      pos[i * 3] = Math.sin(angle * 3) * 0.6 + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = radius * Math.cos(angle);
      pos[i * 3 + 2] = radius * Math.sin(angle);
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const ptr = state.pointer || state.mouse || { x: 0, y: 0 };

    if (groupRef.current) {
      const targetRotX = -ptr.y * 0.2;
      const targetRotY = ptr.x * 0.28 + (reducedMotion ? 0 : t * 0.04);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
    }

    if (!reducedMotion) {
      // Serene crystal rotation & gentle float
      if (crystalGroupRef.current) {
        crystalGroupRef.current.rotation.y = t * 0.07;
        crystalGroupRef.current.rotation.x = Math.sin(t * 0.4) * 0.1;
      }

      // Inner mint nucleus breathing
      if (innerCoreRef.current) {
        const pulse = 1 + Math.sin(t * 1.6) * 0.07;
        innerCoreRef.current.scale.set(pulse, pulse, pulse);
        innerCoreRef.current.rotation.z = -t * 0.12;
      }

      // Volumetric core bloom halo pulsing
      if (coreHaloRef.current) {
        const haloPulse = 1 + Math.sin(t * 1.6) * 0.1;
        coreHaloRef.current.scale.set(haloPulse, haloPulse, haloPulse);
      }

      // Orbiting particle ribbons
      if (ribbon1Ref.current) {
        ribbon1Ref.current.rotation.y = t * 0.07;
        ribbon1Ref.current.rotation.z = Math.sin(t * 0.25) * 0.12;
      }
      if (ribbon2Ref.current) {
        ribbon2Ref.current.rotation.x = t * 0.06;
        ribbon2Ref.current.rotation.z = -t * 0.05;
      }
      if (ribbon3Ref.current) {
        ribbon3Ref.current.rotation.y = -t * 0.055;
        ribbon3Ref.current.rotation.x = Math.cos(t * 0.3) * 0.09;
      }

      // Gimbal telemetry rings
      if (ring1Ref.current) {
        ring1Ref.current.rotation.x = t * 0.14;
        ring1Ref.current.rotation.y = t * 0.1;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.x = -t * 0.12;
        ring2Ref.current.rotation.z = t * 0.16;
      }

      // Aurora backdrop subtle drift
      if (backdropRef.current) {
        backdropRef.current.rotation.z = t * 0.015;
        const bScale = 1 + Math.sin(t * 0.7) * 0.05;
        backdropRef.current.scale.set(bScale, bScale, 1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Internal Point Lights inside the Crystal Core */}
      <pointLight position={[0, 0, 0]} color="#10B981" intensity={4.5} distance={6} />
      <pointLight position={[0, 0, 0]} color="#4F46E5" intensity={3.5} distance={6} />
      <directionalLight position={[4, 5, 4]} color="#818CF8" intensity={1.8} />
      <directionalLight position={[-4, -3, 3]} color="#06B6D4" intensity={1.4} />
      <ambientLight intensity={0.7} />

      {/* 2. Soft Aurora Backdrop Wash (Layered behind crystal at z = -2.6) */}
      <mesh ref={backdropRef} position={[0, 0, -2.6]}>
        <planeGeometry args={[11, 7.5]} />
        <meshBasicMaterial
          map={backdropTexture}
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      {/* 3. Outer Luminous Translucent Crystal Shell (Dodecahedron with Solid Glass + Wireframe) */}
      <group ref={crystalGroupRef}>
        {/* Solid Glass Faceted Body (Catches light with specular highlights) */}
        <mesh>
          <dodecahedronGeometry args={[1.42, 0]} />
          <meshStandardMaterial
            color="#F1F5F9"
            emissive="#6366F1"
            emissiveIntensity={0.45}
            roughness={0.12}
            metalness={0.25}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Crisp Geometric Wireframe Lattice */}
        <mesh>
          <dodecahedronGeometry args={[1.42, 0]} />
          <meshBasicMaterial
            color="#4338CA"
            wireframe
            transparent
            opacity={0.75}
          />
        </mesh>
      </group>

      {/* 4. Inner Glowing Mint-Cyan Nucleus (Smooth Shaded Octahedron) */}
      <mesh ref={innerCoreRef}>
        <octahedronGeometry args={[0.88, 2]} />
        <meshStandardMaterial
          color="#ECFDF5"
          emissive="#10B981"
          emissiveIntensity={1.5}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>

      {/* 5. Volumetric Aurora Core Bloom Halo */}
      <mesh ref={coreHaloRef}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial
          color="#34D399"
          transparent
          opacity={0.32}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 6. Orbiting Aurora Particle Ribbon 1 (Indigo Stream) */}
      <points ref={ribbon1Ref}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={ribbon1.length / 3}
            array={ribbon1}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.085}
          color="#4F46E5"
          map={particleTexture}
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* 7. Orbiting Aurora Particle Ribbon 2 (Cyan Stream) */}
      <points ref={ribbon2Ref}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={ribbon2.length / 3}
            array={ribbon2}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#06B6D4"
          map={particleTexture}
          transparent
          opacity={0.82}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* 8. Orbiting Aurora Particle Ribbon 3 (Mint Stream) */}
      <points ref={ribbon3Ref}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={ribbon3.length / 3}
            array={ribbon3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#10B981"
          map={particleTexture}
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* 9. Concentric Aurora Telemetry Rings (Catching Light) */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.25, 0.012, 16, 90]} />
        <meshStandardMaterial
          color="#4F46E5"
          emissive="#4F46E5"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.58, 0.01, 16, 100]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#10B981"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

export default AuroraIntelligenceScene;
