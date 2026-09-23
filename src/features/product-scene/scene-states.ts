// Cinematic scene states. A contract only: transitions and storage are
// defined by the stories that use them (see docs/ANIMATION.md).
export const SCENE_STATES = ["PRODUCT", "DETAIL", "CUSTOMIZE", "CONTEXT"] as const;

export type SceneState = (typeof SCENE_STATES)[number];
