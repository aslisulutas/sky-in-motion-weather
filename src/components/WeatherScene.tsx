import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { SceneKind } from "@/lib/weather";

interface Props {
  kind: SceneKind;
  isDay: boolean;
}

function Sun() {
  const ref = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (!ref.current) return;
    ref.current.rotation.z += dt * 0.3;
    const k = 1 + Math.sin(s.clock.elapsedTime * 2) * 0.04;
    ref.current.scale.setScalar(k);
  });
  return (
    <Float speed={1.5} floatIntensity={0.6}>
      <group ref={ref} position={[3.2, 2.2, -2]}>
        <mesh>
          <sphereGeometry args={[1.2, 48, 48]} />
          <meshStandardMaterial color="#ffc93c" emissive="#ffae00" emissiveIntensity={0.9} roughness={0.4} />
        </mesh>
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.8, Math.sin(a) * 1.8, 0]} rotation={[0, 0, a - Math.PI / 2]}>
              <capsuleGeometry args={[0.12, 0.45, 8, 16]} />
              <meshStandardMaterial color="#ffd85e" emissive="#ffb300" emissiveIntensity={0.7} />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
}

function Moon() {
  return (
    <Float speed={1} floatIntensity={0.5}>
      <group position={[3.2, 2.2, -2]}>
        <mesh>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial color="#f4f1de" emissive="#d9d4b8" emissiveIntensity={0.5} roughness={0.9} />
        </mesh>
        {([[0.3, 0.3], [-0.35, -0.1], [0.1, -0.45]] as [number, number][]).map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.88]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#d8d3b5" />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Cloud({ position, scale = 1, color, speed = 0.3 }: { position: [number, number, number]; scale?: number; color: string; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.x += dt * speed;
    if (ref.current.position.x > 9) ref.current.position.x = -9;
  });
  const puffs: [number, number, number, number][] = [
    [0, 0, 0, 0.9], [0.9, -0.15, 0, 0.7], [-0.9, -0.2, 0, 0.65], [0.35, 0.45, 0, 0.6], [-0.4, 0.35, 0.1, 0.55],
  ];
  return (
    <group ref={ref} position={position} scale={scale}>
      <Float speed={2} floatIntensity={0.4} rotationIntensity={0.1}>
        {puffs.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[r, 32, 32]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.9} />
          </mesh>
        ))}
      </Float>
    </group>
  );
}

function Precip({ snow }: { snow: boolean }) {
  const count = snow ? 400 : 700;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(
    () => Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 18,
      y: Math.random() * 12 - 4,
      z: (Math.random() - 0.5) * 6,
      s: snow ? 0.6 + Math.random() * 0.6 : 8 + Math.random() * 4,
      p: Math.random() * 6,
    })),
    [count, snow],
  );
  const m = useMemo(() => new THREE.Object3D(), []);
  useFrame((st, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    if (!ref.current) return;
    const t = st.clock.elapsedTime;
    data.forEach((d, i) => {
      d.y -= d.s * dt;
      if (d.y < -5) d.y = 7;
      m.position.set(d.x + (snow ? Math.sin(t + d.p) * 0.3 : 0), d.y, d.z);
      m.rotation.set(0, snow ? t + d.p : 0, snow ? t * 0.5 : 0.15);
      m.updateMatrix();
      ref.current!.setMatrixAt(i, m.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      {snow ? <octahedronGeometry args={[0.07]} /> : <capsuleGeometry args={[0.025, 0.3, 4, 6]} />}
      <meshStandardMaterial color={snow ? "#ffffff" : "#9fd3ff"} emissive={snow ? "#ffffff" : "#5aa9e6"} emissiveIntensity={0.3} transparent opacity={0.85} />
    </instancedMesh>
  );
}

function Lightning() {
  const ref = useRef<THREE.PointLight>(null);
  const next = useRef(2);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    if (t > next.current) {
      ref.current.intensity = 400;
      next.current = t + 2 + Math.random() * 4;
    }
    ref.current.intensity *= 0.85;
  });
  return <pointLight ref={ref} position={[0, 4, 2]} color="#e6f0ff" distance={30} />;
}

function Rig() {
  useFrame((s, dt) => {
    s.camera.position.x += (s.pointer.x * 0.6 - s.camera.position.x) * (1 - Math.exp(-3 * dt));
    s.camera.position.y += (s.pointer.y * 0.4 - s.camera.position.y) * (1 - Math.exp(-3 * dt));
    s.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function WeatherScene({ kind, isDay }: Props) {
  const dark = kind === "storm" || kind === "rain";
  const cloudColor = !isDay ? "#8d96b8" : dark ? "#9aa3b5" : "#ffffff";
  const showSun = isDay && (kind === "clear" || kind === "partly");
  const showMoon = !isDay && (kind === "clear" || kind === "partly");
  const clouds =
    kind === "clear" ? 2 : kind === "partly" ? 4 : 7;

  const cloudPositions: [number, number, number][] = [
    [-5, 2.5, -1], [1, 3, -3], [-2, 1, 0], [4.5, 0.5, -2], [-7, 0, -3], [6, 3.2, -4], [0, -0.5, -1],
  ];

  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 9], fov: 50 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={isDay ? 0.9 : 0.45} />
      <hemisphereLight args={[isDay ? "#fff6e0" : "#8899ff", "#6b8cce", 0.6]} />
      <directionalLight position={[5, 6, 5]} intensity={isDay ? 1.6 : 0.6} />
      {showSun && <Sun />}
      {showMoon && <Moon />}
      {!isDay && <Sparkles count={120} scale={[20, 10, 4]} position={[0, 2, -5]} size={3} speed={0.3} color="#fff8d6" />}
      {cloudPositions.slice(0, clouds).map((p, i) => (
        <Cloud key={i} position={p} scale={0.8 + (i % 3) * 0.25} color={cloudColor} speed={0.15 + (i % 3) * 0.08} />
      ))}
      {(kind === "rain" || kind === "storm") && <Precip snow={false} />}
      {kind === "snow" && <Precip snow />}
      {kind === "storm" && <Lightning />}
      {kind === "fog" && (
        <Sparkles count={60} scale={[20, 4, 4]} position={[0, -2, 0]} size={40} speed={0.2} opacity={0.25} color="#ffffff" />
      )}
      <Rig />
    </Canvas>
  );
}
