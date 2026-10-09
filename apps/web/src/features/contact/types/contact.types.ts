/** Loại nhu cầu khách chọn trong form — gửi mã KEY, nhãn dịch qua `ContactPage.form.options` */
export const optionKeys = ['model', 'fitting', 'custom', 'order'] as const;
export const faqKeys = ['reply', 'appointment', 'custom', 'exchange'] as const;
/** Các bước sau khi khách gửi lời nhắn */
export const stepKeys = ['read', 'call', 'meet'] as const;

export type OptionKey = typeof optionKeys[number];
export type FaqKey = typeof faqKeys[number];
export type StepKey = typeof stepKeys[number];

export interface ContactFormValues {
  name: string;
  contactInfo: string;
  requestType: OptionKey | '';
  message: string;
}
