"use client";

import { Suspense, useEffect, useMemo, useRef, type ComponentRef, type RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Box3, MathUtils, Sphere, Vector3, type Object3D, type PerspectiveCamera } from "three";
import type { Dictionary } from "@/i18n/dictionaries/en";

const MODEL_URL = "/models/stockholm-chair.glb";
const BACKGROUND = "#f4f2ee";

// Polar angle is measured from +Y around the target: 0 looks straight down.
// Keeping the maximum below π/2 keeps the camera above the target's height,
// and the target (the model centre) sits above the floor.
const MIN_POLAR_ANGLE = Math.PI / 6;
const MAX_POLAR_ANGLE = (5 * Math.PI) / 12;
// Front three-quarter view. The asset's front faces +Z (a documented deviation
// in docs/3D-ASSETS.md), so the camera sits on the +Z side.
const CANONICAL_DIRECTION = new Vector3(0.6, 0.35, 1).normalize();

// Drei's OrbitControls instance (three-stdlib).
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;
type CameraPose = { position: Vector3; target: Vector3 };

type ProductSceneProps = {
  labels: Dictionary["scene"];
};

function useModelBounds(scene: Object3D) {
  return useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const sphere = box.getBoundingSphere(new Sphere());
    const size = box.getSize(new Vector3());
    return {
      center: sphere.center,
      radius: sphere.radius,
      footprint: Math.max(size.x, size.z),
    };
  }, [scene]);
}

// Derives framing and limits from the model's bounds. Camera state lives in the
// controls and component refs only — never in the shared store.
function CameraRig({
  scene,
  controlsRef,
  canonicalRef,
}: {
  scene: Object3D;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  canonicalRef: RefObject<CameraPose | null>;
}) {
  const { center, radius } = useModelBounds(scene);
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const framed = useRef(false);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Fit the bounding sphere into the narrower of the two fields of view.
    const aspect = size.width / size.height;
    const vfov = MathUtils.degToRad(camera.fov);
    const fov = aspect < 1 ? 2 * Math.atan(Math.tan(vfov / 2) * aspect) : vfov;
    const fit = radius / Math.sin(fov / 2);

    controls.minDistance = radius * 1.2;
    controls.maxDistance = fit * 2;
    controls.minPolarAngle = MIN_POLAR_ANGLE;
    controls.maxPolarAngle = MAX_POLAR_ANGLE;
    controls.enablePan = false;

    canonicalRef.current = {
      position: center.clone().addScaledVector(CANONICAL_DIRECTION, fit),
      target: center.clone(),
    };

    // Apply the canonical pose once; on resize only the limits and the pose
    // used by Reset change, so a user-positioned camera is not moved.
    if (!framed.current) {
      framed.current = true;
      camera.position.copy(canonicalRef.current.position);
      controls.target.copy(canonicalRef.current.target);
    }
    controls.update();
  }, [camera, canonicalRef, center, controlsRef, radius, size]);

  return null;
}

function Model({
  controlsRef,
  canonicalRef,
}: {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  canonicalRef: RefObject<CameraPose | null>;
}) {
  const { scene } = useGLTF(MODEL_URL);
  const { footprint } = useModelBounds(scene);

  return (
    <>
      <primitive object={scene} />
      {/* Static model: render the soft shadow once. */}
      <ContactShadows frames={1} opacity={0.4} blur={2.5} far={1} scale={footprint * 2} />
      <CameraRig scene={scene} controlsRef={controlsRef} canonicalRef={canonicalRef} />
    </>
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

const buttonClass =
  "grid min-h-11 min-w-11 place-items-center rounded-full bg-white/90 px-4 text-sm font-medium text-neutral-900 shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

// The scene is identical for every locale: it never reads `dir` or the locale.
export function ProductScene({ labels }: ProductSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const canonicalRef = useRef<CameraPose>(null);

  // Moves the camera along its view direction, within the zoom limits.
  const zoomBy = (factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const offset = controls.object.position.clone().sub(controls.target);
    const distance = MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
    controls.object.position.copy(controls.target).addScaledVector(offset.normalize(), distance);
    controls.update();
  };

  // Restores the canonical pose. Camera only: no store or product writes.
  const resetView = () => {
    const controls = controlsRef.current;
    const pose = canonicalRef.current;
    if (!controls || !pose) return;
    // With damping off, update() applies and clears leftover drag momentum,
    // so it can't drift the camera off the restored pose.
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.object.position.copy(pose.position);
    controls.target.copy(pose.target);
    controls.update();
    controls.enableDamping = damping;
  };

  return (
    <div className="relative h-full w-full" style={{ backgroundColor: BACKGROUND }}>
      <Canvas camera={{ position: [2, 1.5, 2.5], fov: 45 }}>
        <color attach="background" args={[BACKGROUND]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 2]} intensity={1} />
        {/* Local lightformers instead of a preset, which would fetch an HDR from a CDN. */}
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 5, -5]} scale={[10, 5, 1]} />
          <Lightformer intensity={1} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
          <Lightformer intensity={1} position={[5, 1, 0]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        </Environment>
        <Suspense fallback={null}>
          <Model controlsRef={controlsRef} canonicalRef={canonicalRef} />
        </Suspense>
        <OrbitControls ref={controlsRef} makeDefault enablePan={false} />
      </Canvas>
      <LoadingOverlay label={labels.loading} />
      <div role="group" aria-label={labels.controls.label} className="absolute bottom-4 inset-e-4 flex gap-2">
        <button type="button" className={buttonClass} aria-label={labels.controls.zoomIn} onClick={() => zoomBy(0.8)}>
          +
        </button>
        <button type="button" className={buttonClass} aria-label={labels.controls.zoomOut} onClick={() => zoomBy(1.25)}>
          −
        </button>
        <button type="button" className={buttonClass} onClick={resetView}>
          {labels.controls.reset}
        </button>
      </div>
    </div>
  );
}
