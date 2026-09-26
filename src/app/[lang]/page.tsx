import { stockholmChair } from "@/data/products";
import { ProductScene } from "@/features/product-scene/ProductScene";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function Home() {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold text-foreground">{dict.home.title}</h1>

      <section aria-label={dict.scene.overlay.headline}>
        <p className="text-xl">{dict.scene.overlay.headline}</p>
        <p className="text-sm opacity-70">{dict.scene.overlay.caption}</p>
      </section>

      <section className="h-[60vh] w-full max-w-5xl sm:h-[70vh]">
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
      </section>

      <article>
        <p className="text-sm opacity-70">{dict.home.featuredProduct}</p>
        <h2 className="text-2xl font-medium">{stockholmChair.name[locale]}</h2>
        <p>{stockholmChair.description[locale]}</p>
      </article>
    </main>
  );
}
