"use client";

import { Suspense, useLayoutEffect, useMemo, useRef, type ComponentRef, type RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Box3, MathUtils, Sphere, Spherical, Vector3, type Object3D, type PerspectiveCamera } from "three";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
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

// Cinematic intro (US-102): wide pose → canonical pose, then the UI reveal.
const INTRO_SECONDS = 3;
const UI_REVEAL_AT = 2.2;
const SUBDUED_CONTROLS_OPACITY = 0.5;
const WIDE_DISTANCE_FACTOR = 1.6; // Stays below maxDistance (2 × fit).
const WIDE_AZIMUTH_OFFSET = -0.35; // Radians; same polar angle, so within the limits.

gsap.registerPlugin(useGSAP);

// Drei's OrbitControls instance (three-stdlib).
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;
type CameraPose = { position: Vector3; target: Vector3 };

type ProductSceneProps = {
  labels: Dictionary["scene"];
  name: string;
  tagline: string;
};

// The single path to the canonical framing: intro completion, intro skip,
// reduced motion and Reset View all go through here.
function applyPose(controls: OrbitControlsImpl, pose: CameraPose) {
  // With damping off, update() applies and clears leftover drag momentum,
  // so it can't drift the camera off the restored pose.
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  controls.object.position.copy(pose.position);
  controls.target.copy(pose.target);
  controls.update();
  controls.enableDamping = damping;
}

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

  // A layout effect so the canonical pose exists before CinematicIntro runs.
  useLayoutEffect(() => {
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

type IntroRefs = {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  canonicalRef: RefObject<CameraPose | null>;
  copyRef: RefObject<HTMLDivElement | null>;
  controlsUiRef: RefObject<HTMLDivElement | null>;
  finishRef: RefObject<(() => void) | null>;
  playedRef: RefObject<boolean>;
};

// Plays once per mount, after the model has loaded. While the timeline runs,
// OrbitControls is disabled so GSAP is the only camera writer; user intent is
// detected by DOM listeners in ProductScene, which call finishRef.
function CinematicIntro({ controlsRef, canonicalRef, copyRef, controlsUiRef, finishRef, playedRef }: IntroRefs) {
  useGSAP((_, contextSafe) => {
    const controls = controlsRef.current;
    if (!controls || !contextSafe) return;
    // Created paused so finish() can always kill it; it plays only for the intro.
    const tl = gsap.timeline({ paused: true });

    const finish = contextSafe(() => {
      tl.kill();
      const pose = canonicalRef.current;
      if (pose) applyPose(controls, pose);
      gsap.set(copyRef.current, { autoAlpha: 1, y: 0 });
      gsap.set(controlsUiRef.current, { opacity: 1 });
      controls.enabled = true;
      playedRef.current = true;
    });
    finishRef.current = finish;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = canonicalRef.current;
    if (playedRef.current || reducedMotion || !start) {
      finish();
      return;
    }

    controls.enabled = false;
    gsap.set(copyRef.current, { autoAlpha: 0, y: 8 });
    gsap.set(controlsUiRef.current, { opacity: SUBDUED_CONTROLS_OPACITY });

    const camera = controls.object;
    const wide = new Spherical().setFromVector3(start.position.clone().sub(start.target));
    wide.radius *= WIDE_DISTANCE_FACTOR;
    wide.theta += WIDE_AZIMUTH_OFFSET;
    const current = new Spherical();
    const offset = new Vector3();

    const place = (t: number) => {
      // Read the canonical pose every tick so a resize still ends on it.
      const pose = canonicalRef.current ?? start;
      const end = new Spherical().setFromVector3(offset.copy(pose.position).sub(pose.target));
      current.set(
        MathUtils.lerp(wide.radius, end.radius, t),
        MathUtils.lerp(wide.phi, end.phi, t),
        MathUtils.lerp(wide.theta, end.theta, t),
      );
      camera.position.copy(pose.target).add(offset.setFromSpherical(current));
      camera.lookAt(pose.target);
    };
    place(0);

    const progress = { t: 0 };
    tl.eventCallback("onComplete", finish)
      .to(progress, { t: 1, duration: INTRO_SECONDS, ease: "power2.inOut", onUpdate: () => place(progress.t) })
      .to(copyRef.current, { autoAlpha: 1, y: 0, duration: INTRO_SECONDS - UI_REVEAL_AT }, UI_REVEAL_AT)
      .to(controlsUiRef.current, { opacity: 1, duration: INTRO_SECONDS - UI_REVEAL_AT }, UI_REVEAL_AT)
      .play();

    return () => {
      // Never leave the controls disabled if unmounted mid-intro.
      controls.enabled = true;
      finishRef.current = null;
    };
  });

  return null;
}

function Model({ controlsRef, canonicalRef, ...intro }: IntroRefs) {
  const { scene } = useGLTF(MODEL_URL);
  const { footprint } = useModelBounds(scene);

  return (
    <>
      <primitive object={scene} />
      {/* Static model: render the soft shadow once. */}
      <ContactShadows frames={1} opacity={0.4} blur={2.5} far={1} scale={footprint * 2} />
      <CameraRig scene={scene} controlsRef={controlsRef} canonicalRef={canonicalRef} />
      <CinematicIntro controlsRef={controlsRef} canonicalRef={canonicalRef} {...intro} />
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
export function ProductScene({ labels, name, tagline }: ProductSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const canonicalRef = useRef<CameraPose>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const controlsUiRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef<(() => void) | null>(null);
  const playedRef = useRef(false);

  // Any meaningful interaction ends the intro at the canonical pose.
  const finishIntro = () => finishRef.current?.();

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
    applyPose(controls, pose);
  };

  return (
    <div
      className="relative h-full w-full"
      style={{ backgroundColor: BACKGROUND }}
      onPointerDownCapture={finishIntro}
      onWheelCapture={finishIntro}
    >
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
          <Model
            controlsRef={controlsRef}
            canonicalRef={canonicalRef}
            copyRef={copyRef}
            controlsUiRef={controlsUiRef}
            finishRef={finishRef}
            playedRef={playedRef}
          />
        </Suspense>
        <OrbitControls ref={controlsRef} makeDefault enablePan={false} />
      </Canvas>
      <LoadingOverlay label={labels.loading} />
      {/* Non-interactive copy: hidden until the reveal. */}
      <div ref={copyRef} className="invisible absolute top-4 inset-s-4 text-start opacity-0">
        <p className="text-lg font-medium text-neutral-900">{name}</p>
        <p className="text-sm text-neutral-700">{tagline}</p>
      </div>
      {/* Always focusable and operable; the intro only subdues its opacity. */}
      <div
        ref={controlsUiRef}
        role="group"
        aria-label={labels.controls.label}
        className="absolute bottom-4 inset-e-4 flex gap-2"
        onFocusCapture={finishIntro}
      >
        <button
          type="button"
          className={buttonClass}
          aria-label={labels.controls.zoomIn}
          onClick={() => {
            finishIntro();
            zoomBy(0.8);
          }}
        >
          +
        </button>
        <button type="button" className={buttonClass} aria-label={labels.controls.zoomOut}
          onClick={() => {
            finishIntro();
            zoomBy(1.25);
          }}
        >
          −
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            finishIntro();
            resetView();
          }}
        >
          {labels.controls.reset}
        </button>
      </div>
    </div>
  );
}
