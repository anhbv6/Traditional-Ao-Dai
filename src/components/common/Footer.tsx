import {
  ChevronDown,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import { FaFacebook, FaTiktok, FaInstagram, FaXTwitter } from 'react-icons/fa6';

import type { SVGProps } from 'react';

interface ZaloIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

function ZaloIcon({ size = 17, ...props }: ZaloIconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      {...props}
    >
      <title>Zalo</title>
      <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z" />
    </svg>
  );
}
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Logo } from './header/Logo';

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
            className="text-sm leading-6 text-[#706565] transition-colors hover:text-[#800020]"
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
    <footer className="mt-auto border-t border-[#E2A79E]/30 bg-[#FAF7F5]">
      <section className="bg-[#800020] text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2px] text-[#E2A79E]">
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
              className="min-h-12 rounded-md border border-white/20 bg-white px-4 text-sm text-[#2A2525] outline-none transition focus:border-[#E2A79E] focus:ring-2 focus:ring-[#E2A79E]/40"
            />
            <label className="sr-only" htmlFor="footer-phone">
              {t('newsletter.phoneLabel')}
            </label>
            <input
              id="footer-phone"
              name="phone"
              type="tel"
              placeholder={t('newsletter.phonePlaceholder')}
              className="min-h-12 rounded-md border border-white/20 bg-white px-4 text-sm text-[#2A2525] outline-none transition focus:border-[#E2A79E] focus:ring-2 focus:ring-[#E2A79E]/40"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#E2A79E] px-5 text-xs font-semibold uppercase tracking-[1.5px] text-white transition-colors hover:bg-[#2A2525]"
            >
              {t('newsletter.submit')}
              <Send size={15} strokeWidth={1.8} />
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid w-full gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_1.7fr_0.3fr] lg:px-12 lg:py-12">
        <div className="max-w-md">
          <Logo textLogo />
          <p className="mt-4 font-[family-name:var(--font-dancing)] text-2xl leading-snug text-[#800020]">
            {t('brand.tagline')}
          </p>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-[#706565]">
            <a className="flex gap-3 transition-colors hover:text-[#800020]" href={showroomMapUrl} target="_blank" rel="noreferrer">
              <MapPin className="mt-1 h-4 w-4 min-w-4 text-[#800020]" strokeWidth={1.7} />
              <span>{t('brand.address')}</span>
            </a>
            <a className="flex items-center gap-3 transition-colors hover:text-[#800020]" href={`tel:${t('brand.hotlineValue')}`}>
              <Phone className="h-4 w-4 min-w-4 text-[#800020]" strokeWidth={1.7} />
              <span>{t('brand.hotline')}</span>
            </a>
            <a className="flex items-center gap-3 transition-colors hover:text-[#800020]" href={`mailto:${t('brand.emailValue')}`}>
              <Mail className="h-4 w-4 min-w-4 text-[#800020]" strokeWidth={1.7} />
              <span>{t('brand.email')}</span>
            </a>
            <p className="flex items-center gap-3">
              <Clock3 className="h-4 w-4 min-w-4 text-[#800020]" strokeWidth={1.7} />
              <span>{t('brand.hours')}</span>
            </p>
          </div>
        </div>

        <div>
          <div className="hidden grid-cols-3 gap-7 md:grid">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="mb-4 font-[family-name:var(--font-lora)] text-sm font-semibold uppercase tracking-[1.5px] text-[#800020]">
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
                className="group border-b border-[#E2A79E]/35 py-2 last:border-b-0"
                open={index === 0}
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[1.5px] text-[#800020] marker:hidden">
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
          <div className="cursor-pointer flex flex-col items-center rounded-xl max-w-[180px] w-full transition-transform hover:scale-[1.02] duration-300">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg flex items-center justify-center p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://qr.sepay.vn/img/qr.png"
                alt="Bank QR Code"
                width={150}
                height={150}
                className="h-full w-full object-contain mix-blend-multiply"
              />
            </div>
            <div className="text-center text-[10px] leading-relaxed text-[#706565] w-full">
              <p className="font-bold text-[#800020] tracking-wide">MB BANK</p>
              <p className="font-mono mt-0.5 tracking-wider text-[#2A2525] font-semibold">123456789999</p>
              <p className="font-[family-name:var(--font-lora)] uppercase mt-0.5 text-[9px] font-semibold tracking-wider text-[#706565]/80">NGUYEN VAN A</p>
            </div>
          </div>
          <div className="flex gap-4 justify-center lg:self-center w-full max-w-[180px] mt-2" aria-label={t('brand.socialLabel')}>
            {[
              { label: 'Facebook', href: 'https://www.facebook.com/', icon: FaFacebook },
              { label: 'TikTok', href: 'https://www.tiktok.com/', icon: FaTiktok },
              { label: 'Instagram', href: 'https://www.instagram.com/', icon: FaInstagram },
              { label: 'Zalo OA', href: 'https://zalo.me/', icon: ZaloIcon },
              { label: 'X (Twitter)', href: 'https://x.com/', icon: FaXTwitter },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                title={label}
                className="grid place-items-center rounded-md text-[#800020] transition-colors hover:opacity-70"
              >
                <Icon size={17} strokeWidth={1.7} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#E2A79E]/30 bg-[#F3ECE7] mx-auto flex w-full flex-col gap-3 px-5 py-5 text-xs text-[#706565] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/faqs#privacy" className="transition-colors hover:text-[#800020]">
            {t('legal.privacy')}
          </Link>
          <Link href="/faqs#terms" className="transition-colors hover:text-[#800020]">
            {t('legal.terms')}
          </Link>
        </div>
        <p>{t('legal.copyright')}</p>
      </section>
    </footer>
  );
}
