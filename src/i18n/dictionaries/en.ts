const en = {
  meta: {
    title: "Modern Furniture 3D",
    description: "Explore modern furniture in 3D.",
  },
  switcher: {
    label: "Change language",
  },
  home: {
    title: "Modern Furniture 3D",
    featuredProduct: "Featured product",
  },
  // Cinematic overlay copy. The 3D scene/timeline never holds text; it is
  // shared by every locale and the overlay renders these strings on top.
  scene: {
    overlay: {
      headline: "Designed to be seen from every angle",
      caption: "Scroll to explore",
    },
    loading: "Loading 3D model…",
    controls: {
      label: "Camera controls",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      reset: "Reset view",
    },
    focus: {
      label: "Product details",
    },
  },
};

export type Dictionary = typeof en;

export default en;
