import { notFound } from "next/navigation";
import { stockholmChair } from "@/data/products";
import { ProductScene } from "@/features/product-scene/ProductScene";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

// Development-only scene for the 3D foundation; not served in production.
export default async function DevScenePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <main className="flex flex-1 flex-col">
      <div className="h-[70vh] w-full">
        <ProductScene
          labels={dict.scene}
          name={stockholmChair.name[locale]}
          tagline={stockholmChair.tagline[locale]}
          regions={stockholmChair.focusRegions.map((r) => ({
            id: r.id,
            name: r.name[locale],
            description: r.description[locale],
            camera: r.camera,
          }))}
          colorMaterial={stockholmChair.colorMaterial}
          colors={stockholmChair.colors.map((c) => ({ id: c.id, name: c.name[locale], hex: c.hex }))}
        />
      </div>
    </main>
  );
}
