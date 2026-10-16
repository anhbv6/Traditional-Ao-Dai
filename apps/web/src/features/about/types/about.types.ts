export type FitProfile = {
  id: "slender" | "curvy";
  image: string;
};

export type Story = {
  id: "founder" | "tailor" | "cutting";
  image: string;
};

export const fitProfiles: FitProfile[] = [
  {
    id: "slender",
    image: "/images/ex5.jpg",
  },
  {
    id: "curvy",
    image: "/images/ex6.jpg",
  },
];

export const atelierStories: Story[] = [
  {
    id: "founder",
    image: "/images/ex7.jpg",
  },
  {
    id: "tailor",
    image: "/images/ex8.jpg",
  },
  {
    id: "cutting",
    image: "/images/login1.jpg",
  },
];
