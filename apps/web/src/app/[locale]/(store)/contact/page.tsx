import {
  ChevronRight,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Locale = 'vi' | 'en';

interface ContactProps {
  params: Promise<{
    locale: Locale;
  }>;
}

const optionKeys = ['model', 'fitting', 'custom', 'order'] as const;
const faqKeys = ['reply', 'custom', 'exchange'] as const;

function ContactInfoItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="group flex gap-3 sm:gap-4 border-b border-[var(--border)] py-4 sm:py-5 last:border-b-0">
      <span className="grid size-10 sm:size-11 shrink-0 place-items-center rounded-md bg-[var(--bg-secondary)] text-[var(--primary-color)] transition-colors group-hover:bg-[var(--primary-color)] group-hover:text-white">
        <Icon className="size-[17px] sm:size-[19px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] sm:text-xs font-semibold uppercase text-[var(--text-light)]">{label}</span>
        <span className="mt-1 block text-sm sm:text-base font-semibold leading-7 text-[var(--text-main)]">{value}</span>
      </span>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} className="block">
      {content}
    </a>
  );
}

async function Contact({ params }: ContactProps) {
  const t = await getTranslations('ContactPage');

  return (
    <Container as="section" className="py-8 sm:py-12">
      <Breadcrumbs />
      <section className="mt-4 mb-8 text-center max-w-3xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-playfair)] text-[var(--primary-color)] leading-tight">
          {t('title')}
        </h1>
        <p className="mt-3.5 text-sm sm:text-base leading-7 text-[var(--text-light)]">
          {t('subtitle')}
        </p>
      </section>

      <section className="mt-8 grid gap-6 sm:gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-[var(--border)] bg-[var(--bg-main)] p-4 sm:p-6 lg:p-7">
          <div className="border-b border-[var(--border)] pb-4 sm:pb-5">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-color)]">{t('directSubtitle')}</p>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-[family-name:var(--font-playfair)] font-bold text-[var(--primary-color)]">{t('directTitle')}</h2>
          </div>

          <div>
            <ContactInfoItem icon={Phone} label={t('hotline')} value={t('hotlineValue')} href="tel:0909000000" />
            <ContactInfoItem icon={MapPin} label={t('address')} value={t('addressValue')} />
            <ContactInfoItem icon={Clock} label={t('hours')} value={t('hoursValue')} />
            <ContactInfoItem icon={Mail} label={t('email')} value={t('emailValue')} href="mailto:hello@aodai.vn" />
          </div>

          <div className="mt-6 sm:mt-7">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
              <MapPin size={16} className="text-[var(--primary-color)]" />
              {t('map')}
            </div>
            <div className="overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)]">
              <iframe
                title={t('map')}
                src="https://www.google.com/maps?q=Moc%20Chau%2C%20Son%20La%2C%20Vietnam&output=embed"
                className="h-48 sm:h-60 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--bg-main)] p-4 sm:p-6 lg:p-7">
          <div className="mb-5 sm:mb-6 flex items-start gap-3 sm:gap-4">
            <span className="grid size-10 sm:size-12 shrink-0 place-items-center rounded-md bg-[var(--primary-color)] text-white">
              <MessageCircle className="size-5 sm:size-[21px]" />
            </span>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-color)]">{t('formSubtitle')}</p>
              <h2 className="mt-1.5 text-xl sm:text-2xl font-[family-name:var(--font-playfair)] font-bold text-[var(--primary-color)]">{t('formTitle')}</h2>
            </div>
          </div>

          <form className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-[var(--text-main)] block">{t('name')}</span>
                <Input
                  className="mt-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-main)] focus:bg-white focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/30 transition-colors"
                  placeholder={t('namePlaceholder')}
                  style={{ height: '44px' }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[var(--text-main)] block">{t('phoneEmail')}</span>
                <Input
                  className="mt-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-main)] focus:bg-white focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/30 transition-colors"
                  placeholder={t('contactPlaceholder')}
                  style={{ height: '44px' }}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-[var(--text-main)] block">{t('requestType')}</span>
              <div className="mt-1.5">
                <Select defaultValue="">
                  <SelectTrigger
                    className="flex w-full items-center justify-between gap-1.5 rounded-md border border-[var(--border)] !bg-[var(--bg-main)] px-3 py-2 font-[family-name:var(--font-lora)] text-sm text-[var(--text-main)] outline-none transition-colors focus-visible:border-[var(--primary-color)] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[var(--ring)]/30 hover:border-[var(--primary-color)] shadow-none"
                    style={{ height: '44px' }}
                  >
                    <SelectValue placeholder={t('requestType')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-main)] shadow-md font-[family-name:var(--font-lora)]">
                    <SelectGroup>
                      <SelectLabel>{t('requestType')}</SelectLabel>
                      {optionKeys.map((key) => (
                        <SelectItem key={key} value={t(`options.${key}`)} className="cursor-pointer">
                          {t(`options.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[var(--text-main)] block">{t('message')}</span>
              <textarea
                rows={5}
                placeholder={t('messagePlaceholder')}
                className="mt-1.5 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2.5 text-sm leading-6 text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/60 focus:bg-white focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/30"
              />
            </label>

            <button
              type="submit"
              className="justify-self-end inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-color)] sm:w-fit"
            >
              <Send size={17} />
              {t('submit')}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-10 border border-[var(--border)] bg-[var(--bg-secondary)] p-5 sm:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-color)]">
              <HelpCircle size={15} />
              FAQ
            </p>
            <h2 className="mt-2 text-2xl font-[family-name:var(--font-playfair)] font-bold text-[var(--primary-color)]">{t('faqTitle')}</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[var(--text-light)]">{t('faqSubtitle')}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {faqKeys.map((key) => (
            <article key={key} className="border border-[var(--border)] bg-[var(--bg-main)] p-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-[family-name:var(--font-lora)] text-base font-bold text-[var(--text-main)]">{t(`faqs.${key}.question`)}</h3>
                <ChevronRight size={18} className="mt-1 shrink-0 text-[var(--primary-color)]" />
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-light)]">{t(`faqs.${key}.answer`)}</p>
            </article>
          ))}
        </div>
      </section>
    </Container>
  );
}

export default Contact;
