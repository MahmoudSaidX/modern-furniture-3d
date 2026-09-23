import { notFound } from "next/navigation";
import { ProductScene } from "@/features/product-scene/ProductScene";
import { getDictionary } from "@/i18n/get-dictionary";

// Development-only scene for the 3D foundation; not served in production.
export default async function DevScenePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const dict = await getDictionary();

  return (
    <main className="flex flex-1 flex-col">
      <div className="h-[70vh] w-full">
        <ProductScene loadingLabel={dict.scene.loading} />
      </div>
    </main>
  );
}
