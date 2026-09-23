import type { LocalizedText } from "@/i18n/config";

export type Product = {
  // Stable internal identifier; never translated.
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  tagline: LocalizedText;
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
};
