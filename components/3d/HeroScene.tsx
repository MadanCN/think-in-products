"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Scene data ───────────────────────────────────────────────

type Pos = [number, number, number];

const NODES: { pos: Pos; r: number; color: string; phase: number }[] = [
  { pos: [0, 0, 0],          r: 0.14, color: "#00E5CC", phase: 0.0  }, // hub
  { pos: [2.4, 0.6, -1.4],   r: 0.09, color: "#6366F1", phase: 0.8  },
  { pos: [-2.1, 0.9, -0.7],  r: 0.11, color: "#00E5CC", phase: 1.6  },
  { pos: [0.7, -2.1, 0.9],   r: 0.08, color: "#6366F1", phase: 2.4  },
  { pos: [-1.4, -1.1, -1.3], r: 0.10, color: "#00E5CC", phase: 3.2  },
  { pos: [1.9, -0.7, 1.7],   r: 0.09, color: "#6366F1", phase: 4.0  },
  { pos: [-1.9, 1.7, 0.7],   r: 0.11, color: "#00E5CC", phase: 4.8  },
  { pos: [0.4, 2.3, -0.9],   r: 0.08, color: "#6366F1", phase: 5.6  },
  { pos: [-0.7, -0.4, 2.3],  r: 0.09, color: "#00E5CC", phase: 1.2  },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 6], [0, 8],
  [1, 7], [1, 5],
  [2, 6], [2, 4],
  [3, 5], [3, 8],
  [6, 7],
];

// ─── Sub-components ───────────────────────────────────────────

function GraphNode({
  pos,
  r,
  color,
  phase,
}: {
  pos: Pos;
  r: number;
  color: string;
  phase: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const s = 1 + Math.sin(t * 1.4 + phase) * 0.08;
    ref.current.scale.setScalar(s);
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.5 + Math.sin(t * 1.4 + phase) * 0.35;
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
  from,
  to,
  speed,
  offset,
  color,
}: {
  from: Pos;
  to: Pos;
  speed: number;
  offset: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const a = useMemo(() => new THREE.Vector3(...from), []); // eslint-disable-line react-hooks/exhaustive-deps
  const b = useMemo(() => new THREE.Vector3(...to), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(({ clock }) => {
    const t = ((clock.elapsedTime * speed + offset) % 1 + 1) % 1;
    ref.current.position.lerpVectors(a, b, t);
    ref.current.visible = true;
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

// ─── Scene group (auto-rotates) ───────────────────────────────

function NodeGraph() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    groupRef.current.rotation.y = clock.elapsedTime * 0.055;
    groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.03) * 0.12;
  });

  return (
    <group ref={groupRef}>
      {NODES.map((n, i) => (
        <GraphNode key={i} {...n} />
      ))}

      {EDGES.map(([a, b], i) => (
        <EdgeLine
          key={i}
          from={NODES[a].pos}
          to={NODES[b].pos}
        />
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

// ─── Canvas wrapper (exported, loaded with ssr:false) ─────────

export default function HeroScene() {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 8], fov: 58 }}
      style={{ background: "transparent" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 4, 5]}   color="#00E5CC" intensity={3} />
      <pointLight position={[-5, -4, -3]} color="#6366F1" intensity={2} />
      <pointLight position={[0, -3, 3]}  color="#ffffff"  intensity={0.4} />
      <NodeGraph />
    </Canvas>
  );
}
