import { ContactIntro } from './ContactIntro';
import { ContactMessage } from './ContactMessage';
import { ContactVisit } from './ContactVisit';
import { ContactFaq } from './ContactFaq';

/**
 * Trang Liên hệ — cùng ngôn ngữ thiết kế với trang Câu chuyện (tiêu đề căn trái, vạch kẻ mảnh,
 * góc vuông, dải đỏ thẫm) nhưng ưu tiên hành động:
 * Kênh liên hệ nhanh → Gửi lời nhắn (kèm các bước sau khi gửi) → Ghé showroom → Câu hỏi thường gặp.
 */
export function ContactExperience() {
  return (
    <>
      <ContactIntro />
      <ContactMessage />
      <ContactVisit />
      <ContactFaq />
    </>
  );
}
