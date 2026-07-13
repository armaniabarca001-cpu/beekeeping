"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

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

  const [diffuse, normal] = useTexture(
    ["/textures/grass-diffuse.jpg", "/textures/grass-normal.jpg"],
    ([diff, norm]) => {
      for (const tex of [diff, norm]) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(groundRadius, groundRadius);
      }
      diff.colorSpace = THREE.SRGBColorSpace;
    },
  );

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[groundRadius, 48]} />
        <meshStandardMaterial map={diffuse} normalMap={normal} roughness={0.95} />
      </mesh>
      {flowers.map((f, i) => (
        <Flower key={i} position={f.position} color={f.color} phase={f.phase} />
      ))}
    </>
  );
}
