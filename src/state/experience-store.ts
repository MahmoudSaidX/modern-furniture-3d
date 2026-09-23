import { create } from "zustand";
import { stockholmChair } from "@/data/products";
import type { SceneState } from "@/features/product-scene/scene-states";

// Genuinely shared client state only: domain values, never Three.js/R3F
// objects, controls, refs or GSAP timelines (see docs/ARCHITECTURE.md).
type ExperienceState = {
  sceneState: SceneState;
  selectedProductId: string;
  setSceneState: (sceneState: SceneState) => void;
  selectProduct: (productId: string) => void;
};

export const useExperienceStore = create<ExperienceState>()((set) => ({
  sceneState: "PRODUCT",
  selectedProductId: stockholmChair.id,
  setSceneState: (sceneState) => set({ sceneState }),
  selectProduct: (selectedProductId) => set({ selectedProductId }),
}));
