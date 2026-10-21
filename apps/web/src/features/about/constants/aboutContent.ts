import type { FitProfile, Story } from "../types/about.types";

/** Dữ liệu tĩnh trang Câu chuyện (ảnh); chữ hiển thị lấy từ messages/<locale>/about.json theo `id` */
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
