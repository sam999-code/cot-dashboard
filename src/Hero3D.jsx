import React, { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* Institutional 3D hero: a slowly rotating wireframe globe ("the trade that built
   the world") inside a drifting particle field. Cool slate + gold, low-cost WebGL.
   Honors prefers-reduced-motion by not mounting (the page bg stands in). */

const GOLD = "#cda94f";
const GOLD_BRIGHT = "#ecca6e";
const INFO = "#4c8dff";

function Globe() {
  const grp = useRef();
  useFrame((_, dt) => {
    if (grp.current) {
      grp.current.rotation.y += dt * 0.12;
      grp.current.rotation.x = Math.sin(performance.now() / 6000) * 0.12;
    }
  });
  return (
    <group ref={grp}>
      <mesh>
        <icosahedronGeometry args={[2.1, 2]} />
        <meshBasicMaterial color={GOLD} wireframe transparent opacity={0.32} />
      </mesh>
      <mesh scale={0.985}>
        <icosahedronGeometry args={[2.1, 3]} />
        <meshBasicMaterial color={INFO} wireframe transparent opacity={0.06} />
      </mesh>
      <mesh scale={0.6}>
        <icosahedronGeometry args={[2.1, 1]} />
        <meshBasicMaterial color={GOLD_BRIGHT} wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function Particles({ count = 900 }) {
  const ref = useRef();
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cGold = new THREE.Color(GOLD_BRIGHT);
    const cInfo = new THREE.Color(INFO);
    for (let i = 0; i < count; i++) {
      // shell + scatter
      const r = 3 + Math.random() * 6;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(ph) * Math.cos(th);
      positions[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
      positions[i * 3 + 2] = r * Math.cos(ph);
      const c = Math.random() > 0.5 ? cGold : cInfo;
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y -= dt * 0.02; });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.8}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function Hero3D() {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}>
        <Suspense fallback={null}>
          <Globe />
          <Particles />
        </Suspense>
      </Canvas>
    </div>
  );
}
