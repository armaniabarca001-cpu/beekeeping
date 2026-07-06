"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

// Deterministic pseudo-random in [0, 1) so flower/grass placement is stable
// across re-renders instead of jumping around every time React re-mounts.
function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

const FLOWER_COLORS = ["#e8607d", "#f4f1e8", "#f2c744", "#c96bd6", "#ff8a5c"];

function Flower({
  position,
  color,
  phase,
}: {
  position: [number, number, number];
  color: string;
  phase: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(t * 0.8 + phase) * 0.18;
    groupRef.current.rotation.x = Math.sin(t * 0.6 + phase * 1.3) * 0.1;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.008, 0.014, 0.3, 6]} />
        <meshStandardMaterial color="#3f7d3f" roughness={0.9} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.05, 0.32, Math.sin(angle) * 0.05]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.028, 6, 6]} />
        <meshStandardMaterial color="#f2c744" roughness={0.6} />
      </mesh>
    </group>
  );
}

function GrassTuft({ position, phase }: { position: [number, number, number]; phase: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.9 + phase) * 0.25;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.09, 0]}>
        <coneGeometry args={[0.03, 0.18, 4]} />
        <meshStandardMaterial color="#4f9350" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Garden({ hiveRadius = 1.2 }: { hiveRadius?: number }) {
  const groundRadius = 8;

  const flowers = useMemo(() => {
    const count = 16;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + pseudoRandom(i) * 0.6;
      const r = hiveRadius + 0.8 + pseudoRandom(i + 100) * (groundRadius - hiveRadius - 1.2);
      return {
        position: [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [number, number, number],
        color: FLOWER_COLORS[i % FLOWER_COLORS.length],
        phase: pseudoRandom(i + 200) * Math.PI * 2,
      };
    });
  }, [hiveRadius]);

  const grass = useMemo(() => {
    const count = 40;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + pseudoRandom(i + 300) * 0.8;
      const r = hiveRadius + 0.4 + pseudoRandom(i + 400) * (groundRadius - hiveRadius - 0.6);
      return {
        position: [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [number, number, number],
        phase: pseudoRandom(i + 500) * Math.PI * 2,
      };
    });
  }, [hiveRadius]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[groundRadius, 48]} />
        <meshStandardMaterial color="#5a9450" roughness={1} />
      </mesh>
      {flowers.map((f, i) => (
        <Flower key={i} position={f.position} color={f.color} phase={f.phase} />
      ))}
      {grass.map((g, i) => (
        <GrassTuft key={i} position={g.position} phase={g.phase} />
      ))}
    </>
  );
}
