"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Shared node data ─────────────────────────────────────────

type Pos = [number, number, number];

const NODES: { pos: Pos; r: number; color: string; phase: number }[] = [
  { pos: [0, 0, 0],          r: 0.14, color: "#00E5CC", phase: 0.0 },
  { pos: [2.4, 0.6, -1.4],   r: 0.09, color: "#6366F1", phase: 0.8 },
  { pos: [-2.1, 0.9, -0.7],  r: 0.11, color: "#00E5CC", phase: 1.6 },
  { pos: [0.7, -2.1, 0.9],   r: 0.08, color: "#6366F1", phase: 2.4 },
  { pos: [-1.4, -1.1, -1.3], r: 0.10, color: "#00E5CC", phase: 3.2 },
  { pos: [1.9, -0.7, 1.7],   r: 0.09, color: "#6366F1", phase: 4.0 },
  { pos: [-1.9, 1.7, 0.7],   r: 0.11, color: "#00E5CC", phase: 4.8 },
  { pos: [0.4, 2.3, -0.9],   r: 0.08, color: "#6366F1", phase: 5.6 },
  { pos: [-0.7, -0.4, 2.3],  r: 0.09, color: "#00E5CC", phase: 1.2 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 6], [0, 8],
  [1, 7], [1, 5],
  [2, 6], [2, 4],
  [3, 5], [3, 8],
  [6, 7],
];

// ─── Mouse tracker (updates a shared ref, zero re-renders) ────

function MouseTracker({
  mouseRef,
}: {
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  useEffect(() => {
    function onMove(e: MouseEvent) {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseRef]);

  return null;
}

// ─── Floating wireframe shapes ────────────────────────────────

function FloatingShapes() {
  const icosaRef = useRef<THREE.Mesh>(null!);
  const torusRef  = useRef<THREE.Mesh>(null!);
  const octaRef   = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    icosaRef.current.rotation.x = t * 0.12;
    icosaRef.current.rotation.y = t * 0.18;
    torusRef.current.rotation.x  = t * 0.08;
    torusRef.current.rotation.z  = t * 0.14;
    octaRef.current.rotation.y   = t * 0.16;
    octaRef.current.rotation.x   = t * 0.10;
  });

  return (
    <>
      <mesh ref={icosaRef} position={[3.8, 1.2, -3]}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshBasicMaterial color="#00E5CC" wireframe transparent opacity={0.09} />
      </mesh>
      <mesh ref={torusRef} position={[-4, -1.5, -2]}>
        <torusGeometry args={[1.1, 0.35, 12, 40]} />
        <meshBasicMaterial color="#6366F1" wireframe transparent opacity={0.08} />
      </mesh>
      <mesh ref={octaRef} position={[-1.2, 3, -3.5]}>
        <octahedronGeometry args={[0.9]} />
        <meshBasicMaterial color="#F59E0B" wireframe transparent opacity={0.08} />
      </mesh>
    </>
  );
}

// ─── Particle field ───────────────────────────────────────────

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null!);

  const { positions, sizes } = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
      sizes[i] = Math.random() * 1.2 + 0.3;
    }
    return { positions, sizes };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, sizes]);

  useFrame(({ clock }) => {
    pointsRef.current.rotation.y = clock.elapsedTime * 0.012;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        color="#00E5CC"
        size={0.038}
        sizeAttenuation
        transparent
        opacity={0.28}
      />
    </points>
  );
}

// ─── Graph node ───────────────────────────────────────────────

function GraphNode({ pos, r, color, phase }: (typeof NODES)[0]) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ref.current.scale.setScalar(1 + Math.sin(t * 1.4 + phase) * 0.08);
    (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.5 + Math.sin(t * 1.4 + phase) * 0.35;
  });

  return (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[r, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        roughness={0.15}
        metalness={0.6}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

function EdgeLine({ from, to }: { from: Pos; to: Pos }) {
  const obj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...from),
      new THREE.Vector3(...to),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: "#00E5CC",
      transparent: true,
      opacity: 0.18,
    });
    return new THREE.Line(geo, mat);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <primitive object={obj} />;
}

function Particle({
  from, to, speed, offset, color,
}: {
  from: Pos; to: Pos; speed: number; offset: number; color: string;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const a = useMemo(() => new THREE.Vector3(...from), []); // eslint-disable-line react-hooks/exhaustive-deps
  const b = useMemo(() => new THREE.Vector3(...to), []);   // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(({ clock }) => {
    const t = ((clock.elapsedTime * speed + offset) % 1 + 1) % 1;
    ref.current.position.lerpVectors(a, b, t);
  });

  return (
    <mesh ref={ref} position={from}>
      <sphereGeometry args={[0.026, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={4}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ─── Node graph (auto-rotates + mouse drift) ──────────────────

function NodeGraph({
  mouseRef,
}: {
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.055;
    groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.12;

    // Camera drifts gently toward mouse
    camera.position.x += (mouseRef.current.x * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (mouseRef.current.y * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      {NODES.map((n, i) => (
        <GraphNode key={i} {...n} />
      ))}
      {EDGES.map(([a, b], i) => (
        <EdgeLine key={i} from={NODES[a].pos} to={NODES[b].pos} />
      ))}
      {EDGES.map(([a, b], i) => (
        <Particle
          key={i}
          from={NODES[a].pos}
          to={NODES[b].pos}
          speed={0.22 + (i % 4) * 0.04}
          offset={(i * 0.618) % 1}
          color={i % 2 === 0 ? "#00E5CC" : "#6366F1"}
        />
      ))}
    </group>
  );
}

// ─── Scene root ───────────────────────────────────────────────

function Scene() {
  const mouseRef = useRef({ x: 0, y: 0 });

  return (
    <>
      <MouseTracker mouseRef={mouseRef} />
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 4, 5]}   color="#00E5CC" intensity={3} />
      <pointLight position={[-5, -4, -3]} color="#6366F1" intensity={2} />
      <pointLight position={[0, -3, 3]}  color="#ffffff"  intensity={0.4} />
      <ParticleField />
      <FloatingShapes />
      <NodeGraph mouseRef={mouseRef} />
    </>
  );
}

// ─── Canvas wrapper ───────────────────────────────────────────

export default function HeroScene() {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 8], fov: 58 }}
      style={{ background: "transparent" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      dpr={[1, 1.5]}
    >
      <Scene />
    </Canvas>
  );
}
