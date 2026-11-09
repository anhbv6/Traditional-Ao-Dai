import { AboutHero } from "./AboutHero";
import { AboutStory } from "./AboutStory";
import { AboutManifesto } from "./AboutManifesto";
import { AboutPainSolution } from "./AboutPainSolution";
import { AboutAtelier } from "./AboutAtelier";
import { AboutCta } from "./AboutCta";

/**
 * Trang Câu chuyện — giữ ít khối để đọc liền mạch:
 * Hero → Câu chuyện (ảnh + lời kể, giải nghĩa tên Thiên · Canh) → Triết lý → Vấn đề & cách xử lý
 * → Người giữ nghề & con số → Lời mời.
 * (Quy trình may đo, cảm nhận khách hàng đã có ở trang chủ nên không lặp lại.)
 */
export function AboutExperience() {
  return (
    <>
      <AboutHero />
      <AboutStory />
      <AboutManifesto />
      <AboutPainSolution />
      <AboutAtelier />
      <AboutCta />
    </>
  );
}
