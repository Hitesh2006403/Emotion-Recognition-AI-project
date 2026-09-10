import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function EmotionCoreScene({ isDark = true, reducedMotion = false }) {
  const groupRef = useRef(null);
  const innerCoreRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const particlesRef = useRef(null);

  // Palette mapped strictly to our scientific color system
  const colors = useMemo(() => {
    return {
      primary: isDark ? '#00E5FF' : '#0284C7',     // Electric Cyan (Dark) / Cerulean (Light)
      secondary: isDark ? '#38BDF8' : '#0EA5E9',   // Synaptic Light Blue
      wire: isDark ? '#00E5FF' : '#0369A1',
      particle: isDark ? '#00F2FE' : '#0284C7',
      nodeGlow: isDark ? '#F59E0B' : '#D97706',    // Subtle Valence/Arousal Harmonic Amber
    };
  }, [isDark]);

  // Generate 1,200 particle positions on a spherical field
  const { particlePositions, particleScales } = useMemo(() => {
    const count = 1200;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 2.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      scales[i] = Math.random() * 0.8 + 0.2;
    }
    return { particlePositions: positions, particleScales: scales };
  }, []);

  // Frame animation loop with mouse reactivity & reduced-motion awareness
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const ptr = state.pointer || state.mouse || { x: 0, y: 0 };

    if (groupRef.current) {
      // Parallactic tilt based on cursor position (-1 to 1) across the full hero area
      const targetRotX = -ptr.y * 0.22;
      const targetRotY = ptr.x * 0.32 + (reducedMotion ? 0 : t * 0.08);

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
    }

    if (!reducedMotion) {
      // Inner core gentle affective breathing pulse
      if (innerCoreRef.current) {
        const pulse = 1 + Math.sin(t * 1.8) * 0.05;
        innerCoreRef.current.scale.set(pulse, pulse, pulse);
        innerCoreRef.current.rotation.z = -t * 0.15;
      }

      // Counter-rotating telemetry rings
      if (ring1Ref.current) {
        ring1Ref.current.rotation.x = t * 0.2;
        ring1Ref.current.rotation.y = t * 0.15;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.x = -t * 0.18;
        ring2Ref.current.rotation.z = t * 0.22;
      }

      // Particle cloud subtle orbital drift
      if (particlesRef.current) {
        particlesRef.current.rotation.y = t * 0.03;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Central Geodesic Lattice (Wireframe Icosahedron) */}
      <mesh>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial
          color={colors.wire}
          wireframe
          transparent
          opacity={isDark ? 0.25 : 0.32}
        />
      </mesh>

      {/* 2. Inner Resonant Affective Core (Octahedron) */}
      <mesh ref={innerCoreRef}>
        <octahedronGeometry args={[0.95, 0]} />
        <meshBasicMaterial
          color={colors.primary}
          wireframe
          transparent
          opacity={isDark ? 0.55 : 0.65}
        />
      </mesh>

      {/* 3. Outer Geodesic Telemetry Ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.25, 0.015, 16, 80]} />
        <meshBasicMaterial
          color={colors.secondary}
          transparent
          opacity={isDark ? 0.35 : 0.4}
        />
      </mesh>

      {/* 4. Outer Geodesic Telemetry Ring 2 (Orthogonal) */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.55, 0.012, 16, 90]} />
        <meshBasicMaterial
          color={colors.primary}
          transparent
          opacity={isDark ? 0.3 : 0.35}
        />
      </mesh>

      {/* 5. Synaptic Floating Particle Cloud */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 3}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isDark ? 0.042 : 0.036}
          color={colors.particle}
          transparent
          opacity={isDark ? 0.65 : 0.55}
          sizeAttenuation
          blending={isDark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </points>

      {/* 6. Vertex Harmonic Accent Nodes (Tiny Amber Synaptic Junctions) */}
      <mesh>
        <icosahedronGeometry args={[1.5, 1]} />
        <pointsMaterial
          size={0.065}
          color={colors.nodeGlow}
          transparent
          opacity={isDark ? 0.5 : 0.4}
          sizeAttenuation
        />
      </mesh>
    </group>
  );
}

export default EmotionCoreScene;
