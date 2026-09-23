"use client";

import { Suspense, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three/addons/controls/OrbitControls.js";

gsap.registerPlugin(useGSAP);

const MODEL_URL = "/models/stockholm-chair.glb";

type ProductSceneProps = {
  loadingLabel: string;
};

function Model() {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<Group>(null);
  // Set by <OrbitControls makeDefault />.
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;

  // S0-07 lifecycle proof (mount → interrupt → cleanup), not final cinematics:
  // the timeline plays on mount, is killed when the user starts orbiting, and
  // useGSAP reverts it on unmount.
  useGSAP(
    () => {
      if (!groupRef.current) return;
      const tl = gsap.timeline();
      tl.from(groupRef.current.rotation, { y: -Math.PI / 4 });

      if (!controls) return;
      const interrupt = () => tl.kill();
      controls.addEventListener("start", interrupt);
      return () => controls.removeEventListener("start", interrupt);
    },
    { dependencies: [controls], revertOnUpdate: true },
  );

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// DOM overlay: the 3D scene itself never holds text.
function LoadingOverlay({ label }: { label: string }) {
  const { active } = useProgress();
  if (!active) return null;

  return (
    <p role="status" className="absolute inset-0 grid place-items-center">
      {label}
    </p>
  );
}

// The scene is identical for every locale: it never reads `dir` or the locale.
export function ProductScene({ loadingLabel }: ProductSceneProps) {
  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [2, 1.5, 2.5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 2]} intensity={1.5} />
        {/* Local lightformers instead of a preset, which would fetch an HDR from a CDN. */}
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 5, -5]} scale={[10, 5, 1]} />
          <Lightformer intensity={1} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
          <Lightformer intensity={1} position={[5, 1, 0]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        </Environment>
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
      <LoadingOverlay label={loadingLabel} />
    </div>
  );
}
