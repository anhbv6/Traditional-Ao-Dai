/** Một mục trong trang Điều khoản (đọc từ messages/<locale>/terms.json → `sections`) */
export interface TermsSection {
  /** id neo (#general, #privacy...) — dùng cho mục lục và link từ footer */
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
}
