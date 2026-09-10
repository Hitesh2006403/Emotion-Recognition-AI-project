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
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(99, 102, 241, 0.85)');
  gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.45)');
  gradient.addColorStop(0.75, 'rgba(16, 185, 129, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function AuroraIntelligenceScene({ reducedMotion = false }) {
  const groupRef = useRef(null);
  const crystalRef = useRef(null);
  const innerCoreRef = useRef(null);
  const ribbon1Ref = useRef(null);
  const ribbon2Ref = useRef(null);
  const ribbon3Ref = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);

  const particleTexture = useMemo(() => createAuroraParticleTexture(), []);

  // 3 Harmonic Orbiting Particle Ribbons (Indigo, Cyan, Mint)
  const countPerRibbon = 280;

  const ribbon1 = useMemo(() => {
    const pos = new Float32Array(countPerRibbon * 3);
    for (let i = 0; i < countPerRibbon; i++) {
      const radius = 2.0 + (Math.random() - 0.5) * 0.45;
      const angle = (i / countPerRibbon) * Math.PI * 2 + Math.random() * 0.1;
      pos[i * 3] = radius * Math.cos(angle);
      pos[i * 3 + 1] = Math.sin(angle * 2) * 0.45 + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 2] = radius * Math.sin(angle);
    }
    return pos;
  }, []);

  const ribbon2 = useMemo(() => {
    const pos = new Float32Array(countPerRibbon * 3);
    for (let i = 0; i < countPerRibbon; i++) {
      const radius = 2.35 + (Math.random() - 0.5) * 0.5;
      const angle = (i / countPerRibbon) * Math.PI * 2 + Math.random() * 0.1;
      pos[i * 3] = radius * Math.cos(angle);
      pos[i * 3 + 1] = radius * Math.sin(angle);
      pos[i * 3 + 2] = Math.cos(angle * 2) * 0.5 + (Math.random() - 0.5) * 0.25;
    }
    return pos;
  }, []);

  const ribbon3 = useMemo(() => {
    const pos = new Float32Array(countPerRibbon * 3);
    for (let i = 0; i < countPerRibbon; i++) {
      const radius = 2.7 + (Math.random() - 0.5) * 0.6;
      const angle = (i / countPerRibbon) * Math.PI * 2 + Math.random() * 0.1;
      pos[i * 3] = Math.sin(angle * 3) * 0.55 + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = radius * Math.cos(angle);
      pos[i * 3 + 2] = radius * Math.sin(angle);
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const ptr = state.pointer || state.mouse || { x: 0, y: 0 };

    if (groupRef.current) {
      // Gentle cursor parallax tilt
      const targetRotX = -ptr.y * 0.2;
      const targetRotY = ptr.x * 0.28 + (reducedMotion ? 0 : t * 0.04);

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
    }

    if (!reducedMotion) {
      // Serene slow crystal rotation
      if (crystalRef.current) {
        crystalRef.current.rotation.y = t * 0.05;
        crystalRef.current.rotation.x = Math.sin(t * 0.3) * 0.08;
      }

      // Inner mint core breathing
      if (innerCoreRef.current) {
        const pulse = 1 + Math.sin(t * 1.5) * 0.05;
        innerCoreRef.current.scale.set(pulse, pulse, pulse);
        innerCoreRef.current.rotation.z = -t * 0.08;
      }

      // Orbiting particle ribbons
      if (ribbon1Ref.current) {
        ribbon1Ref.current.rotation.y = t * 0.06;
        ribbon1Ref.current.rotation.z = Math.sin(t * 0.2) * 0.1;
      }
      if (ribbon2Ref.current) {
        ribbon2Ref.current.rotation.x = t * 0.05;
        ribbon2Ref.current.rotation.z = -t * 0.04;
      }
      if (ribbon3Ref.current) {
        ribbon3Ref.current.rotation.y = -t * 0.045;
        ribbon3Ref.current.rotation.x = Math.cos(t * 0.25) * 0.08;
      }

      // Gimbal telemetry rings
      if (ring1Ref.current) {
        ring1Ref.current.rotation.x = t * 0.12;
        ring1Ref.current.rotation.y = t * 0.09;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.x = -t * 0.1;
        ring2Ref.current.rotation.z = t * 0.14;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Internal & Ambient Lighting for Glass Illumination */}
      <ambientLight intensity={0.9} />
      <pointLight position={[0, 0, 0]} color="#10B981" intensity={1.4} distance={4.5} />
      <directionalLight position={[3, 3, 4]} color="#6366F1" intensity={1.1} />
      <directionalLight position={[-3, -2, 2]} color="#06B6D4" intensity={0.7} />

      {/* 1. Translucent Glass Polyhedron Crystal */}
      <group ref={crystalRef}>
        {/* Glass body */}
        <mesh>
          <dodecahedronGeometry args={[1.35, 0]} />
          <meshStandardMaterial
            color="#EEF2FF"
            transparent
            opacity={0.22}
            roughness={0.12}
            metalness={0.15}
          />
        </mesh>

        {/* Elegant crystal wireframe lattice */}
        <mesh>
          <dodecahedronGeometry args={[1.35, 0]} />
          <meshBasicMaterial
            color="#4F46E5"
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>
      </group>

      {/* 2. Inner Floating Mint-Cyan Core (Octahedron) */}
      <mesh ref={innerCoreRef}>
        <octahedronGeometry args={[0.82, 0]} />
        <meshBasicMaterial
          color="#06B6D4"
          wireframe
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* 3. Orbiting Aurora Particle Ribbon 1 (Indigo Stream) */}
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
          size={0.06}
          color="#6366F1"
          map={particleTexture}
          transparent
          opacity={0.75}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* 4. Orbiting Aurora Particle Ribbon 2 (Cyan Stream) */}
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
          size={0.055}
          color="#06B6D4"
          map={particleTexture}
          transparent
          opacity={0.72}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* 5. Orbiting Aurora Particle Ribbon 3 (Mint Stream) */}
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
          size={0.055}
          color="#10B981"
          map={particleTexture}
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* 6. Concentric Aurora Telemetry Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.2, 0.012, 16, 90]} />
        <meshBasicMaterial
          color="#6366F1"
          transparent
          opacity={0.32}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.55, 0.01, 16, 100]} />
        <meshBasicMaterial
          color="#10B981"
          transparent
          opacity={0.28}
        />
      </mesh>
    </group>
  );
}

export default AuroraIntelligenceScene;
