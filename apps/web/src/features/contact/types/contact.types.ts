export type Locale = 'vi' | 'en';

export interface ContactProps {
  params: Promise<{
    locale: Locale;
  }>;
}

export const optionKeys = ['model', 'fitting', 'custom', 'order'] as const;
export const faqKeys = ['reply', 'custom', 'exchange'] as const;

export type OptionKey = typeof optionKeys[number];
export type FaqKey = typeof faqKeys[number];
