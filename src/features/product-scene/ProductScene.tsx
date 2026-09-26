"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import {
  Box3,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Sphere,
  Spherical,
  Vector3,
  type Object3D,
  type PerspectiveCamera,
} from "three";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { FocusCamera, FocusRegion, ProductColor } from "@/data/products";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { useExperienceStore } from "@/state/experience-store";

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

// Detail focus (US-103): camera move to or from an inspection region.
const FOCUS_SECONDS = 1.2;

gsap.registerPlugin(useGSAP);

// Drei's OrbitControls instance (three-stdlib).
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;
type CameraPose = { position: Vector3; target: Vector3 };
type CameraLimits = Pick<
  FocusCamera,
  "minDistance" | "maxDistance" | "minAzimuth" | "maxAzimuth" | "minPolar" | "maxPolar"
>;

// A region with its copy already localized by the page.
export type SceneRegion = {
  id: FocusRegion["id"];
  name: string;
  description: string;
  camera: FocusCamera;
};

// A color with its name already localized by the page.
export type SceneColor = {
  id: ProductColor["id"];
  name: string;
  hex: string;
};

type ProductSceneProps = {
  labels: Dictionary["scene"];
  name: string;
  tagline: string;
  regions: SceneRegion[];
  colorMaterial: string;
  colors: SceneColor[];
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

function applyLimits(controls: OrbitControlsImpl, limits: CameraLimits) {
  controls.minDistance = limits.minDistance;
  controls.maxDistance = limits.maxDistance;
  controls.minAzimuthAngle = limits.minAzimuth;
  controls.maxAzimuthAngle = limits.maxAzimuth;
  controls.minPolarAngle = limits.minPolar;
  controls.maxPolarAngle = limits.maxPolar;
}

// Returns a new, temporary copy of `limits` widened just enough to contain the
// camera's current pose, so the next update() moves nothing (no snap). It never
// mutates the region data or the full-product limits.
function widenToCurrent(controls: OrbitControlsImpl, limits: CameraLimits): CameraLimits {
  const current = new Spherical().setFromVector3(controls.object.position.clone().sub(controls.target));
  const minAzimuth = Math.min(limits.minAzimuth, current.theta);
  const maxAzimuth = Math.max(limits.maxAzimuth, current.theta);
  const unbounded = maxAzimuth - minAzimuth >= 2 * Math.PI;
  return {
    minDistance: Math.min(limits.minDistance, current.radius),
    maxDistance: Math.max(limits.maxDistance, current.radius),
    minAzimuth: unbounded ? -Infinity : minAzimuth,
    maxAzimuth: unbounded ? Infinity : maxAzimuth,
    minPolar: Math.min(limits.minPolar, current.phi),
    maxPolar: Math.max(limits.maxPolar, current.phi),
  };
}

// Region camera for the viewer's current shape: the portrait override applies
// when the canvas is taller than it is wide.
function resolveCamera(controls: OrbitControlsImpl, camera: FocusCamera): FocusCamera {
  const canvas = controls.domElement;
  const portrait = canvas ? canvas.clientWidth < canvas.clientHeight : false;
  return portrait && camera.portrait ? { ...camera, ...camera.portrait } : camera;
}

// The only place region data becomes a camera pose.
function regionPose(camera: FocusCamera): CameraPose {
  const target = new Vector3(...camera.target);
  const offset = new Vector3().setFromSpherical(new Spherical(camera.distance, camera.polar, camera.azimuth));
  return { position: target.clone().add(offset), target };
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
  productLimitsRef,
  inspectingRef,
}: {
  scene: Object3D;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  canonicalRef: RefObject<CameraPose | null>;
  productLimitsRef: RefObject<CameraLimits | null>;
  inspectingRef: RefObject<boolean>;
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

    productLimitsRef.current = {
      minDistance: radius * 1.2,
      maxDistance: fit * 2,
      minAzimuth: -Infinity,
      maxAzimuth: Infinity,
      minPolar: MIN_POLAR_ANGLE,
      maxPolar: MAX_POLAR_ANGLE,
    };
    // While inspecting, the region's (or temporary) limits stay in place.
    if (!inspectingRef.current) applyLimits(controls, productLimitsRef.current);
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
  }, [camera, canonicalRef, center, controlsRef, inspectingRef, productLimitsRef, radius, size]);

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

type ModelProps = IntroRefs & {
  productLimitsRef: RefObject<CameraLimits | null>;
  inspectingRef: RefObject<boolean>;
  colorMaterial: string;
  colorHex: string | undefined;
};

function Model({
  controlsRef,
  canonicalRef,
  productLimitsRef,
  inspectingRef,
  colorMaterial,
  colorHex,
  ...intro
}: ModelProps) {
  const { scene } = useGLTF(MODEL_URL);
  const { footprint } = useModelBounds(scene);

  // The cached GLTF scene is shared; clone it and own the tinted material so a
  // color never leaks into another mount. Geometry and textures stay shared.
  const { model, fabric } = useMemo(() => {
    const model = scene.clone(true);
    let fabric: MeshStandardMaterial | null = null;
    model.traverse((object) => {
      if (
        object instanceof Mesh &&
        object.material instanceof MeshStandardMaterial &&
        object.material.name === colorMaterial
      ) {
        fabric ??= object.material.clone();
        object.material = fabric;
      }
    });
    return { model, fabric: fabric as MeshStandardMaterial | null };
  }, [scene, colorMaterial]);

  useEffect(() => {
    if (!fabric && process.env.NODE_ENV !== "production") {
      console.error(`ProductScene: no material named "${colorMaterial}" to tint.`);
    }
    return () => fabric?.dispose();
  }, [fabric, colorMaterial]);

  // The texture's base color is multiplied by this tint (sRGB hex → linear).
  useEffect(() => {
    if (fabric && colorHex) fabric.color.set(colorHex);
  }, [fabric, colorHex]);

  return (
    <>
      <primitive object={model} />
      {/* Static model: render the soft shadow once. */}
      <ContactShadows frames={1} opacity={0.4} blur={2.5} far={1} scale={footprint * 2} />
      <CameraRig
        scene={scene}
        controlsRef={controlsRef}
        canonicalRef={canonicalRef}
        productLimitsRef={productLimitsRef}
        inspectingRef={inspectingRef}
      />
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
export function ProductScene({ labels, name, tagline, regions, colorMaterial, colors }: ProductSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const canonicalRef = useRef<CameraPose>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const controlsUiRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef<(() => void) | null>(null);
  const playedRef = useRef(false);
  // Detail focus: the active region is local UI state; camera state stays in refs.
  const [activeRegion, setActiveRegion] = useState<SceneRegion | null>(null);
  const productLimitsRef = useRef<CameraLimits>(null);
  const inspectingRef = useRef(false);
  const colorsRef = useRef<HTMLDivElement>(null);
  const selectedColorId = useExperienceStore((state) => state.selectedColorId);
  const selectColor = useExperienceStore((state) => state.selectColor);
  const selectedColor = colors.find((color) => color.id === selectedColorId);
  const transitionRef = useRef<{
    tween: gsap.core.Tween;
    limits: CameraLimits;
  } | null>(null);

  const { contextSafe } = useGSAP(() => () => {
    // Never leave the controls disabled if unmounted mid-move.
    const controls = controlsRef.current;
    if (controls) controls.enabled = true;
  });

  // Any meaningful interaction ends the intro at the canonical pose. Once the
  // intro has finished it is a no-op, so later input never re-applies that pose.
  const finishIntro = () => {
    if (!playedRef.current) finishRef.current?.();
  };

  // Unlike the intro, an interrupted focus move stops where it is: the camera
  // keeps its exact pose and OrbitControls takes over with the destination
  // limits widened to contain it, so nothing snaps.
  const interruptTransition = () => {
    const controls = controlsRef.current;
    const transition = transitionRef.current;
    if (!controls || !transition) return;
    transition.tween.kill();
    transitionRef.current = null;
    applyLimits(controls, widenToCurrent(controls, transition.limits));
    controls.update();
    controls.enabled = true;
  };

  const onViewerInput = (event?: { target: EventTarget | null }) => {
    // Choosing a color is not viewer input: it never moves the camera.
    if (event?.target instanceof Node && colorsRef.current?.contains(event.target)) return;
    finishIntro();
    interruptTransition();
  };

  // Moves camera and target from the current view to `end`, then calls
  // `arrive`. GSAP is the only camera writer while it runs; no limits apply.
  const moveTo = (end: CameraPose, limits: CameraLimits, arrive: () => void) => {
    const controls = controlsRef.current;
    if (!controls) return;
    transitionRef.current?.tween.kill();
    transitionRef.current = null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      arrive();
      return;
    }

    controls.enabled = false;
    const camera = controls.object;
    const startTarget = controls.target.clone();
    const from = new Spherical().setFromVector3(camera.position.clone().sub(startTarget));
    const to = new Spherical().setFromVector3(end.position.clone().sub(end.target));
    // Shortest way around.
    const dTheta = MathUtils.euclideanModulo(to.theta - from.theta + Math.PI, 2 * Math.PI) - Math.PI;
    const current = new Spherical();
    const offset = new Vector3();
    const progress = { t: 0 };

    // Created in the useGSAP context, so it is reverted on unmount.
    const tween = contextSafe(() =>
      gsap.to(progress, {
        t: 1,
        duration: FOCUS_SECONDS,
        ease: "power2.inOut",
        onUpdate: () => {
          const t = progress.t;
          controls.target.lerpVectors(startTarget, end.target, t);
          current.set(
            MathUtils.lerp(from.radius, to.radius, t),
            MathUtils.lerp(from.phi, to.phi, t),
            from.theta + dTheta * t,
          );
          camera.position.copy(controls.target).add(offset.setFromSpherical(current));
          camera.lookAt(controls.target);
        },
        onComplete: () => {
          transitionRef.current = null;
          arrive();
        },
      }),
    )();
    transitionRef.current = { tween, limits };
  };

  const selectRegion = (region: SceneRegion) => {
    const controls = controlsRef.current;
    if (!controls) return;
    finishIntro();
    inspectingRef.current = true;
    setActiveRegion(region);
    // Canonical limits from data, freshly installed on arrival.
    const camera = resolveCamera(controls, region.camera);
    const limits: CameraLimits = camera;
    const pose = regionPose(camera);
    moveTo(pose, limits, () => {
      applyLimits(controls, limits);
      applyPose(controls, pose);
      controls.enabled = true;
    });
  };

  // Moves the camera along its view direction, within the zoom limits.
  const zoomBy = (factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const offset = controls.object.position.clone().sub(controls.target);
    const distance = MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
    controls.object.position.copy(controls.target).addScaledVector(offset.normalize(), distance);
    controls.update();
  };

  // Restores the canonical pose and the full-product limits. From a region it
  // is a smooth return; otherwise instant, as in US-101. No store writes.
  const resetView = () => {
    const controls = controlsRef.current;
    const pose = canonicalRef.current;
    const limits = productLimitsRef.current;
    if (!controls || !pose || !limits) return;
    const arrive = () => {
      applyLimits(controls, limits);
      applyPose(controls, pose);
      inspectingRef.current = false;
      controls.enabled = true;
    };
    if (activeRegion) {
      setActiveRegion(null);
      moveTo(pose, limits, arrive);
      return;
    }
    transitionRef.current?.tween.kill();
    transitionRef.current = null;
    arrive();
  };

  return (
    <div
      className="relative h-full w-full"
      style={{ backgroundColor: BACKGROUND }}
      onPointerDownCapture={onViewerInput}
      onWheelCapture={onViewerInput}
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
            productLimitsRef={productLimitsRef}
            inspectingRef={inspectingRef}
            colorMaterial={colorMaterial}
            colorHex={selectedColor?.hex}
            copyRef={copyRef}
            controlsUiRef={controlsUiRef}
            finishRef={finishRef}
            playedRef={playedRef}
          />
        </Suspense>
        <OrbitControls ref={controlsRef} makeDefault enablePan={false} />
      </Canvas>
      <LoadingOverlay label={labels.loading} />
      {/* Below sm: copy, then the colors in their own row. From sm: copy at the
          inline start, colors at the inline end. Only the controls take input. */}
      <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
        {/* Non-interactive copy: hidden until the reveal. */}
        <div ref={copyRef} className="invisible min-w-0 text-start opacity-0">
          <p className="text-lg font-medium text-neutral-900">{name}</p>
          {/* The tagline area carries the active region's copy while inspecting. */}
          <p aria-live="polite" className="text-sm text-neutral-700">
            {activeRegion ? (
              <>
                <span className="font-medium text-neutral-900">{activeRegion.name}</span> {activeRegion.description}
              </>
            ) : (
              tagline
            )}
          </p>
        </div>
        {/* Never faded by the intro and never viewer input. */}
        <div ref={colorsRef} className="pointer-events-auto flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <div role="group" aria-label={labels.color.label} className="flex gap-2">
            {colors.map((color) => {
              const selected = color.id === selectedColorId;
              return (
                <button
                  key={color.id}
                  type="button"
                  aria-label={color.name}
                  aria-pressed={selected}
                  className={`grid min-h-11 min-w-11 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${selected ? "ring-2 ring-neutral-900 ring-offset-2" : ""}`}
                  onClick={() => selectColor(color.id)}
                >
                  <span aria-hidden className="size-7 rounded-full" style={{ backgroundColor: color.hex }} />
                </button>
              );
            })}
          </div>
          <p aria-hidden className="text-xs text-neutral-700">
            {selectedColor?.name}
          </p>
        </div>
      </div>
      {/* Below sm: its own row above the viewer controls (bottom-4 + 44px + gap).
          From sm: same bottom edge, wrapping before the viewer controls (≤ 15rem). */}
      <div
        role="group"
        aria-label={labels.focus.label}
        className="absolute inset-x-4 bottom-17 flex flex-wrap gap-2 sm:inset-e-auto sm:bottom-4 sm:max-w-[calc(100%-15rem)]"
      >
        {regions.map((region) => {
          const active = activeRegion?.id === region.id;
          return (
            <button
              key={region.id}
              type="button"
              aria-pressed={active}
              className={`${buttonClass} ${active ? "bg-neutral-900! text-white!" : ""}`}
              onClick={() => selectRegion(region)}
            >
              {region.name}
            </button>
          );
        })}
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
            onViewerInput();
            zoomBy(0.8);
          }}
        >
          +
        </button>
        <button
          type="button"
          className={buttonClass}
          aria-label={labels.controls.zoomOut}
          onClick={() => {
            onViewerInput();
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
