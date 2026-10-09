import { AboutHero } from "./AboutHero";
import { AboutManifesto } from "./AboutManifesto";
import { AboutPainSolution } from "./AboutPainSolution";
import { FitModel } from "./FitModel";
import { AboutAtelier } from "./AboutAtelier";
import { AboutCta } from "./AboutCta";

/**
 * Trang Câu chuyện — gọn và khác nhịp với trang chủ:
 * Hero nền tối → Triết lý → I. Vấn đề & cách xử lý → II. Phom dáng → III. Nghệ nhân & con số → Lời mời.
 * Tiêu đề chương căn trái, đánh số La Mã; cuộn tự nhiên, hoạt ảnh chậm và nhẹ.
 * (Cảm nhận khách hàng đã có ở trang chủ nên không lặp lại ở đây.)
 */
export function AboutExperience() {
  return (
    <>
      <AboutHero />
      <AboutManifesto />
      <AboutPainSolution />
      <FitModel />
      <AboutAtelier />
      <AboutCta />
    </>
  );
}
