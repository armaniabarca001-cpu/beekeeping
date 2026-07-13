"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Stars, Cloud, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Garden } from "./Garden";
import type { BackgroundTheme } from "@/lib/background-themes";

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

let studioBackdropTexture: THREE.CanvasTexture | null = null;
function getStudioBackdropTexture() {
  if (studioBackdropTexture) return studioBackdropTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#f2ede2");
  grad.addColorStop(0.55, "#f7f3ea");
  grad.addColorStop(1, "#e4dccb");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 8, 256);
  studioBackdropTexture = new THREE.CanvasTexture(canvas);
  return studioBackdropTexture;
}

function StudioBackground({ hiveRadius }: { hiveRadius: number }) {
  const backdrop = useMemo(() => getStudioBackdropTexture(), []);
  return (
    <>
      <color attach="background" args={["#f2ede2"]} />
      <mesh scale={[30, 30, 30]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial map={backdrop} side={THREE.BackSide} fog={false} />
      </mesh>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.3} castShadow />
      <directionalLight position={[-5, 3, -3]} intensity={0.4} color="#dce6ff" />
      <Environment preset="studio" />
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.45}
        scale={Math.max(hiveRadius * 3, 6)}
        blur={2.2}
        far={4}
      />
    </>
  );
}

function SpaceBackground({ hiveRadius }: { hiveRadius: number }) {
  return (
    <>
      <color attach="background" args={["#050014"]} />
      <Stars radius={60} depth={40} count={3500} factor={4} fade speed={1} />
      <ambientLight intensity={0.8} />
      <pointLight position={[6, 6, 6]} intensity={3.5} color="#e8f0ff" />
      <pointLight position={[-5, 3, -4]} intensity={1.5} color="#8fb8ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[Math.max(hiveRadius + 1, 3), 48]} />
        <meshStandardMaterial color="#1b1b2e" roughness={0.6} metalness={0.3} />
      </mesh>
    </>
  );
}

function CloudsBackground() {
  return (
    <>
      <color attach="background" args={["#bfe0ff"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 6, 4]} intensity={1.2} />
      <Cloud position={[-3.5, 2.5, -4]} scale={1.8} opacity={0.7} speed={0.15} />
      <Cloud position={[3.5, 3.2, -5]} scale={2.2} opacity={0.6} speed={0.1} />
      <Cloud position={[0, 4, -7]} scale={2.8} opacity={0.5} speed={0.12} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8, 48]} />
        <meshStandardMaterial color="#eaf6ff" roughness={1} transparent opacity={0.6} />
      </mesh>
    </>
  );
}

function SunsetBackground({ hiveRadius }: { hiveRadius: number }) {
  return (
    <>
      <Sky sunPosition={[8, 0.6, -6]} turbidity={8} rayleigh={3} mieCoefficient={0.02} />
      <ambientLight intensity={0.6} color="#ffb37a" />
      <directionalLight position={[8, 1.5, -6]} intensity={1.6} color="#ff9d5c" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[Math.max(hiveRadius + 6, 8), 48]} />
        <meshStandardMaterial color="#7a5a3a" roughness={1} />
      </mesh>
    </>
  );
}

function Bubble({ position, phase }: { position: [number, number, number]; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.3 + phase) % 1;
    ref.current.position.y = position[1] + t * 3;
    ref.current.position.x = position[0] + Math.sin(clock.elapsedTime + phase * 6) * 0.15;
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshStandardMaterial color="#d8f4ff" transparent opacity={0.5} roughness={0.1} />
    </mesh>
  );
}

function UnderwaterBackground({ hiveRadius }: { hiveRadius: number }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        position: [
          (pseudoRandom(i) - 0.5) * 6,
          -0.2,
          (pseudoRandom(i + 50) - 0.5) * 6,
        ] as [number, number, number],
        phase: pseudoRandom(i + 100),
      })),
    [],
  );

  return (
    <>
      <color attach="background" args={["#0c4a6e"]} />
      <fog attach="fog" args={["#0c4a6e", 3, 14]} />
      <ambientLight intensity={0.8} color="#8ecdf0" />
      <directionalLight position={[2, 8, 2]} intensity={0.8} color="#bfe8ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[Math.max(hiveRadius + 6, 8), 48]} />
        <meshStandardMaterial color="#c2b280" roughness={1} />
      </mesh>
      {bubbles.map((b, i) => (
        <Bubble key={i} position={b.position} phase={b.phase} />
      ))}
    </>
  );
}

export function SceneBackground({
  theme,
  hiveRadius,
}: {
  theme: BackgroundTheme;
  hiveRadius: number;
}) {
  switch (theme) {
    case "studio":
      return <StudioBackground hiveRadius={hiveRadius} />;
    case "space":
      return <SpaceBackground hiveRadius={hiveRadius} />;
    case "clouds":
      return <CloudsBackground />;
    case "sunset":
      return <SunsetBackground hiveRadius={hiveRadius} />;
    case "underwater":
      return <UnderwaterBackground hiveRadius={hiveRadius} />;
    case "garden":
    default:
      return (
        <>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 6, 4]} intensity={1.4} castShadow />
          <Sky sunPosition={[10, 8, 5]} turbidity={6} rayleigh={1.5} />
          <Environment preset="park" />
          <Garden hiveRadius={hiveRadius} />
        </>
      );
  }
}
