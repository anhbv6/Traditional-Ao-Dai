import {
  ChevronDown,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';

import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Logo } from '../header/Logo';
import { OnlyOnHome } from '../OnlyOnHome';
import { SocialLinks } from './SocialLinks';
import { QRBank } from './QRBank';

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const showroomMapUrl = 'https://www.google.com/maps/search/?api=1&query=AODAI+showroom+Vietnam';

function FooterLinkList({ links }: { links: FooterLink[] }) {
  return (
    <ul className="grid gap-2.5">
      {links.map((link) => (
        <li key={`${link.href}-${link.label}`}>
          <Link
            href={link.href}
            className="text-sm leading-6 text-muted-foreground transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations('Footer');

  const columns: FooterColumn[] = [
    {
      title: t('customerCare.title'),
      links: [
        { label: t('customerCare.sizeGuide'), href: '/faqs#size-guide' },
        { label: t('customerCare.returnPolicy'), href: '/faqs#return-policy' },
        { label: t('customerCare.customFit'), href: '/products?service=custom-fit' },
        { label: t('customerCare.careGuide'), href: '/news/cach-giat-bao-quan-ao-dai' },
      ],
    },
    {
      title: t('company.title'),
      links: [
        { label: t('company.story'), href: '/about' },
        { label: t('company.careers'), href: '/about#careers' },
        { label: t('company.partners'), href: '/contact#agency' },
        { label: t('legal.privacy'), href: '/faqs#privacy' },
        { label: t('legal.terms'), href: '/faqs#terms' },
      ],
    },
    {
      title: t('quickLinks.title'),
      links: [
        { label: t('quickLinks.wedding'), href: '/products?category=ao-dai-cuoi' },
        { label: t('quickLinks.modern'), href: '/products?category=ao-dai-cach-tan' },
        { label: t('quickLinks.silk'), href: '/products?category=ao-dai-lua-to-tam' },
        { label: t('quickLinks.accessories'), href: '/products?category=phu-kien-ao-dai' },
        { label: t('quickLinks.custom'), href: '/products?keyword=ao-dai-may-do' },
        { label: t('quickLinks.handEmbroidery'), href: '/products?keyword=ao-dai-theu-tay' },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-accent/30 bg-background">
      <OnlyOnHome>
        <section className="bg-primary text-white">
          <div className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:px-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[2px] text-accent">
                {t('newsletter.eyebrow')}
              </p>
              <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-white sm:text-3xl">
                {t('newsletter.title')}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/78">
                {t('newsletter.description')}
              </p>
            </div>

            <form className="grid gap-3 sm:grid-cols-[1fr_0.75fr_auto]" action={`/${locale}/contact`} method="get">
              <label className="sr-only" htmlFor="footer-email">
                {t('newsletter.emailLabel')}
              </label>
              <input
                id="footer-email"
                name="email"
                type="email"
                placeholder={t('newsletter.emailPlaceholder')}
                className="min-h-12 rounded-md border border-white/20 bg-white px-4 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
              <label className="sr-only" htmlFor="footer-phone">
                {t('newsletter.phoneLabel')}
              </label>
              <input
                id="footer-phone"
                name="phone"
                type="tel"
                placeholder={t('newsletter.phonePlaceholder')}
                className="min-h-12 rounded-md border border-white/20 bg-white px-4 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
              <button
                type="submit"
                className="cursor-pointer inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-xs font-semibold uppercase tracking-[1.5px] text-white transition-colors hover:bg-foreground"
              >
                {t('newsletter.submit')}
                <Send size={15} strokeWidth={1.8} />
              </button>
            </form>
          </div>
        </section>
      </OnlyOnHome>

      <section className="mx-auto grid w-full gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_1.7fr_0.3fr] lg:px-12 lg:py-12">
        <div className="max-w-md">
          <Logo textLogo />
          <p className="mt-4 font-[family-name:var(--font-dancing)] text-2xl leading-snug text-primary">
            {t('brand.tagline')}
          </p>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-muted-foreground">
            <a className="flex gap-3 transition-colors hover:text-primary" href={showroomMapUrl} target="_blank" rel="noreferrer">
              <MapPin className="mt-1 h-4 w-4 min-w-4 text-primary" strokeWidth={1.7} />
              <span>{t('brand.address')}</span>
            </a>
            <a className="flex items-center gap-3 transition-colors hover:text-primary" href={`tel:${t('brand.hotlineValue')}`}>
              <Phone className="h-4 w-4 min-w-4 text-primary" strokeWidth={1.7} />
              <span>{t('brand.hotline')}</span>
            </a>
            <a className="flex items-center gap-3 transition-colors hover:text-primary" href={`mailto:${t('brand.emailValue')}`}>
              <Mail className="h-4 w-4 min-w-4 text-primary" strokeWidth={1.7} />
              <span>{t('brand.email')}</span>
            </a>
            <p className="flex items-center gap-3">
              <Clock3 className="h-4 w-4 min-w-4 text-primary" strokeWidth={1.7} />
              <span>{t('brand.hours')}</span>
            </p>
          </div>
        </div>

        <div>
          <div className="hidden grid-cols-3 gap-7 md:grid">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="mb-4 font-[family-name:var(--font-lora)] text-sm font-semibold uppercase tracking-[1.5px] text-primary">
                  {column.title}
                </h3>
                <FooterLinkList links={column.links} />
              </div>
            ))}
          </div>

          <div className="grid gap-2 md:hidden">
            {columns.map((column, index) => (
              <details
                key={column.title}
                className="group border-b border-accent/35 py-2 last:border-b-0"
                open={index === 0}
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[1.5px] text-primary marker:hidden">
                  {column.title}
                  <ChevronDown
                    className="h-4 w-4 transition-transform group-open:rotate-180"
                    strokeWidth={1.8}
                  />
                </summary>
                <div className="pb-4 pt-2">
                  <FooterLinkList links={column.links} />
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center lg:items-start w-full">
          <QRBank />
          <SocialLinks socialLabel={t('brand.socialLabel')} />
        </div>
      </section>

      <section className="border-y border-accent/30 bg-secondary mx-auto flex w-full flex-col gap-3 px-4 py-4 text-xs text-muted-foreground sm:px-8 md:flex-row md:items-center md:justify-center lg:px-12">
        <p>{t('legal.copyright')}</p>
      </section>
    </footer>
  );
}
