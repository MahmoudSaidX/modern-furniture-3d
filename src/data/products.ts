import type { LocalizedText } from "@/i18n/config";

type Vec3 = [number, number, number];

// Camera view of one inspection region, in world meters/radians. Angles use
// OrbitControls' spherical convention around `target`: azimuth = atan2(x, z)
// (0 = front, +Z), polar measured from +Y.
// Invariants: every pose value lies inside its own range; polar ranges stay
// within the full-product range [π/6, 5π/12], so the camera stays above the
// target and the floor; azimuth ranges stay within (−π, π) without wrapping.
export type FocusCamera = {
  target: Vec3;
  distance: number;
  azimuth: number;
  polar: number;
  // Inspection limits, applied once the camera arrives.
  minDistance: number;
  maxDistance: number;
  minAzimuth: number;
  maxAzimuth: number;
  minPolar: number;
  maxPolar: number;
  // Optional override for a portrait viewer (canvas width < height): only the
  // values that must differ; everything else is inherited.
  portrait?: Partial<Omit<FocusCamera, "portrait">>;
};

export type FocusRegion = {
  // Stable internal identifier; never translated.
  id: "fabric" | "cushion" | "frame" | "legs";
  name: LocalizedText;
  description: LocalizedText;
  camera: FocusCamera;
};

export type Product = {
  // Stable internal identifier; never translated.
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  tagline: LocalizedText;
  // Visual inspection regions: camera views over the model. The GLB has no
  // semantic part nodes (see docs/3D-ASSETS.md, "Current deviations").
  focusRegions: FocusRegion[];
};

export const stockholmChair: Product = {
  id: "stockholm-chair",
  name: {
    en: "Stockholm Chair",
    ar: "كرسي ستوكهولم",
  },
  description: {
    en: "A modern chair you can explore in 3D.",
    ar: "كرسي عصري يمكنك استكشافه بتقنية ثلاثية الأبعاد.",
  },
  tagline: {
    en: "Designed for quiet moments.",
    ar: "صُمم للحظات الهادئة.",
  },
  focusRegions: [
    {
      id: "fabric",
      name: { en: "Fabric", ar: "القماش" },
      description: {
        en: "Explore the upholstery across the backrest.",
        ar: "استكشف تفاصيل التنجيد على امتداد مسند الظهر.",
      },
      camera: {
        target: [0, 0.6, -0.3],
        distance: 1.0,
        azimuth: 0.3,
        polar: 1.1,
        minDistance: 0.75,
        maxDistance: 1.3,
        minAzimuth: -0.5,
        maxAzimuth: 0.9,
        minPolar: 0.85,
        maxPolar: 1.3,
      },
    },
    {
      id: "cushion",
      name: { en: "Cushion", ar: "الوسادة" },
      description: {
        en: "Explore the details of the seat cushion.",
        ar: "استكشف تفاصيل وسادة المقعد.",
      },
      camera: {
        target: [0, 0.4, 0.1],
        distance: 1.05,
        azimuth: 0.4,
        polar: 0.95,
        minDistance: 0.8,
        maxDistance: 1.35,
        minAzimuth: -0.6,
        maxAzimuth: 1.1,
        minPolar: 0.6,
        maxPolar: 1.2,
      },
    },
    {
      id: "frame",
      name: { en: "Frame", ar: "الهيكل" },
      description: {
        en: "Explore the structure along the sides and back.",
        ar: "استكشف تفاصيل الهيكل على الجانبين والظهر.",
      },
      camera: {
        target: [0.25, 0.4, -0.05],
        distance: 1.0,
        azimuth: 1.75,
        polar: 1.2,
        minDistance: 0.75,
        maxDistance: 1.3,
        minAzimuth: 1.3,
        maxAzimuth: 2.3,
        minPolar: 0.95,
        maxPolar: 1.3,
      },
    },
    {
      id: "legs",
      name: { en: "Legs", ar: "الأرجل" },
      description: {
        en: "Explore the chair's lower structure and legs.",
        ar: "استكشف الجزء السفلي من الهيكل والأرجل.",
      },
      camera: {
        target: [0, 0.2, 0.15],
        distance: 1.0,
        azimuth: 0.55,
        polar: 1.25,
        minDistance: 0.75,
        maxDistance: 1.3,
        minAzimuth: 0,
        maxAzimuth: 1.1,
        minPolar: 1.05,
        maxPolar: 1.3,
        portrait: { distance: 1.3, minDistance: 1.05, maxDistance: 1.6 },
      },
    },
  ],
};
