export type FitProfile = {
  id: "slender" | "curvy";
  image: string;
};

export type Story = {
  id: "founder" | "tailor" | "cutting";
  image: string;
};

export type Testimonial = {
  id: "wedding" | "graduation" | "tet" | "engagement";
  image: string;
};

export const sectionIds = ["hero", "pain-solution", "fit-model", "atelier", "testimonials"] as const;

export type SectionId = (typeof sectionIds)[number];

export const fitProfiles: FitProfile[] = [
  {
    id: "slender",
    image: "https://cdn.pixabay.com/photo/2022/05/22/16/35/vietnamese-woman-7213859_1280.jpg",
  },
  {
    id: "curvy",
    image: "https://cdn.pixabay.com/photo/2022/07/15/03/42/vietnamese-woman-7322247_1280.jpg",
  },
];

export const atelierStories: Story[] = [
  {
    id: "founder",
    image: "https://cdn.pixabay.com/photo/2022/08/26/12/13/vietnamese-woman-7412407_1280.jpg",
  },
  {
    id: "tailor",
    image: "https://cdn.pixabay.com/photo/2021/04/16/07/22/ao-dai-6182834_1280.jpg",
  },
  {
    id: "cutting",
    image: "https://cdn.pixabay.com/photo/2016/11/29/05/08/adult-1868750_1280.jpg",
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "wedding",
    image: "https://cdn.pixabay.com/photo/2021/04/16/07/22/ao-dai-6182834_1280.jpg",
  },
  {
    id: "graduation",
    image: "https://cdn.pixabay.com/photo/2022/07/15/03/42/vietnamese-woman-7322247_1280.jpg",
  },
  {
    id: "tet",
    image: "https://cdn.pixabay.com/photo/2022/05/22/16/35/vietnamese-woman-7213859_1280.jpg",
  },
  {
    id: "engagement",
    image: "https://cdn.pixabay.com/photo/2022/08/26/12/13/vietnamese-woman-7412407_1280.jpg",
  },
];
