"use client";

import React from 'react';
import {
  ChevronRight,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ContactInfoItem } from './ContactInfoItem';
import { ContactForm } from './ContactForm';
import { faqKeys } from '../types/contact.types';

export function ContactExperience() {
  const t = useTranslations('ContactPage');

  return (
    <div>
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

        <ContactForm />
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
    </div>
  );
}
