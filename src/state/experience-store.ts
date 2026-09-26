import { create } from "zustand";
import { stockholmChair, type ProductColor } from "@/data/products";
import type { SceneState } from "@/features/product-scene/scene-states";

// Genuinely shared client state only: domain values, never Three.js/R3F
// objects, controls, refs or GSAP timelines (see docs/ARCHITECTURE.md).
type ExperienceState = {
  sceneState: SceneState;
  selectedProductId: string;
  selectedColorId: ProductColor["id"];
  setSceneState: (sceneState: SceneState) => void;
  selectProduct: (productId: string) => void;
  selectColor: (colorId: ProductColor["id"]) => void;
};

export const useExperienceStore = create<ExperienceState>()((set) => ({
  sceneState: "PRODUCT",
  selectedProductId: stockholmChair.id,
  selectedColorId: stockholmChair.defaultColorId,
  setSceneState: (sceneState) => set({ sceneState }),
  selectProduct: (selectedProductId) => set({ selectedProductId }),
  selectColor: (selectedColorId) => set({ selectedColorId }),
}));
